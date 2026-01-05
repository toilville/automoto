# Technical Specification: Advanced Evaluation Framework Extension

**Document Type:** Technical Design Specification  
**Component:** Advanced Multi-Dimension Evaluation System  
**Author:** Knowledge Agent POC Team  
**Date:** January 5, 2026  
**Status:** Ready for Implementation

---

## Overview

Extension of the current 5-dimension expert review framework to support:
- 6th dimension (Cross-Artifact Coherence)
- Automatic scoring complementing expert review
- Improvement suggestion generation
- Multi-evaluator consensus
- Dimension-specific reasoning

---

## Current State (Week 1-2)

```python
# Existing 5 dimensions
EXPERT_REVIEW_DIMENSIONS = {
    "factual_accuracy": 0.2,      # Are claims accurate?
    "completeness": 0.2,           # All findings captured?
    "faithfulness": 0.2,           # Matches source?
    "signal_to_noise": 0.15,       # Relevant density?
    "reusability": 0.15            # Applicable elsewhere?
}

# Passing criteria: average score >= 3.0 / 5.0
# Used by: Iteration loop, quality gating
# Status: Functional, working in Week 2 tests
```

---

## Extended Framework (Phase 1)

### 1. New Dimension: Cross-Artifact Coherence

**Definition:**
- Does this artifact connect to other project artifacts?
- Are perspectives complementary or contradictory?
- Quality of cross-references and citations

**Weight:** 0.1 (adjusted from original 5 dimensions to 0.18 each)

**Scoring Logic:**
```python
score = (
    0.3 * has_cross_references +
    0.3 * reference_quality +
    0.2 * perspective_complementarity +
    0.2 * citation_accuracy
)
# Each component scored 0-5
```

**Implementation:**
```python
def evaluate_cross_artifact_coherence(
    primary_artifact: BaseKnowledgeArtifact,
    related_artifacts: List[BaseKnowledgeArtifact],
    project_context: Dict[str, Any]
) -> CrossArtifactScore:
    """
    Score artifact's coherence within project context.
    
    Args:
        primary_artifact: The artifact being evaluated
        related_artifacts: Other artifacts in project
        project_context: Project metadata, objectives, etc.
    
    Returns:
        CrossArtifactScore with subscores and reasoning
    """
    # 1. Find mention of related artifacts
    references = find_cross_references(
        primary_artifact,
        related_artifacts
    )
    
    # 2. Evaluate quality of references
    reference_quality = assess_reference_quality(references)
    
    # 3. Check perspective alignment
    complementarity = assess_perspective_fit(
        primary_artifact,
        related_artifacts,
        project_context
    )
    
    # 4. Calculate final score
    final_score = weighted_combination([
        (0.3, len(references) / len(related_artifacts)),
        (0.3, reference_quality),
        (0.2, complementarity),
        (0.2, assess_citations(references))
    ])
    
    return CrossArtifactScore(
        score=final_score,
        references_found=len(references),
        reference_quality=reference_quality,
        perspective_fit=complementarity,
        reasoning={
            "mentions_other_artifacts": len(references) > 0,
            "perspective": "complementary" | "contradictory" | "orthogonal",
            "key_connections": [...]
        }
    )
```

### 2. Automatic Quality Scoring

Complement expert review with automatic checks:

**Readability Metrics**
```python
def score_readability(artifact: BaseKnowledgeArtifact) -> float:
    """
    Score 0-5 based on:
    - Flesch-Kincaid grade level
    - Sentence length distribution
    - Paragraph coherence
    - Jargon density
    """
    text = artifact.plain_language_overview
    
    fk_score = flesch_kincaid_grade(text)
    # Convert grade to 0-5: < 8th grade = 5, > 16th = 1
    
    sentence_lengths = analyze_sentence_lengths(text)
    # High variance = lower score
    
    coherence = assess_paragraph_coherence(text)
    # Using discourse markers, entity tracking
    
    jargon = assess_technical_jargon(text, artifact.source_type)
    # Too much jargon without explanation = lower score
    
    return weighted_avg([fk_score, sentence_lengths, coherence, jargon])
```

**Content Completeness**
```python
def score_completeness(artifact: BaseKnowledgeArtifact) -> float:
    """
    Score 0-5 based on:
    - All required fields filled
    - Sufficient length (content density)
    - Evidence provided for claims
    - Methodological detail
    """
    scores = []
    
    # Field completeness
    required_fields = [
        'plain_language_overview',
        'technical_problem_addressed',
        'key_methods_approach',
        'primary_claims_capabilities',
        'key_evidence_citations'
    ]
    filled = sum(1 for f in required_fields if getattr(artifact, f))
    scores.append((filled / len(required_fields)) * 5)
    
    # Content length vs. source type
    # Paper: expect 1000+ words equivalent
    # Talk: expect detailed transcript summary
    # Repo: expect comprehensive overview
    content_length = estimate_content_tokens(artifact)
    expected = estimate_expected_length(artifact.source_type)
    scores.append(min(5, (content_length / expected) * 5))
    
    # Evidence support
    evidence_mentions = count_evidence_citations(artifact)
    claim_count = len(artifact.primary_claims_capabilities)
    evidence_ratio = min(1.0, evidence_mentions / (claim_count + 1))
    scores.append(evidence_ratio * 5)
    
    # Methodological detail (for papers/repos)
    if artifact.source_type in ['paper', 'repository']:
        method_score = assess_methodological_detail(artifact)
        scores.append(method_score)
    
    return np.mean(scores)
```

**Structural Validity**
```python
def score_structure(artifact: BaseKnowledgeArtifact) -> float:
    """
    Score 0-5 based on:
    - JSON schema compliance
    - Field type correctness
    - No hallucinations detected
    - Confidence score validity
    """
    scores = []
    
    # Schema validation
    try:
        artifact.to_dict()
        scores.append(5.0)  # Valid structure
    except Exception as e:
        scores.append(0.0)  # Invalid
    
    # Confidence score sanity check
    if 0.0 <= artifact.confidence_score <= 1.0:
        scores.append(5.0)
    else:
        scores.append(1.0)
    
    # Hallucination detection
    hallucination_score = detect_hallucinations(artifact)
    # Uses: fact-checking, consistency checks
    scores.append(hallucination_score)
    
    # Temporal consistency
    temporal_score = assess_temporal_consistency(artifact)
    scores.append(temporal_score)
    
    return np.mean(scores)
```

### 3. Evaluation Results Enhancement

```python
@dataclass
class EvaluationResult:
    """Enhanced evaluation result with detailed breakdowns."""
    
    artifact_id: str
    artifact_type: SourceType
    evaluation_timestamp: datetime
    
    # Original 5 dimensions
    factual_accuracy: DimensionScore
    completeness: DimensionScore
    faithfulness: DimensionScore
    signal_to_noise: DimensionScore
    reusability: DimensionScore
    
    # New dimension
    cross_artifact_coherence: Optional[DimensionScore] = None
    
    # Automatic scores
    automatic_scores: Dict[str, float] = field(default_factory=dict)
    # {
    #   "readability": 4.2,
    #   "content_completeness": 3.8,
    #   "structural_validity": 5.0,
    #   ...
    # }
    
    # Combined score
    expert_weighted_score: float  # 0-5, expert review only
    automatic_weighted_score: float  # 0-5, automatic only
    combined_weighted_score: float  # 0-5, hybrid (0.6 expert, 0.4 auto)
    
    # Thresholds
    passes_quality_gate: bool  # >= 3.0
    passes_automatic_gate: bool  # >= 3.0 on automatic
    passes_expert_gate: bool  # >= 3.0 on expert
    
    # Analysis
    dimension_reasoning: Dict[str, str]  # Per-dimension explanation
    improvement_suggestions: List[str]  # What to improve
    low_scores: List[str]  # Which dimensions are weak?
    
    # Evaluators
    expert_reviewer_id: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        pass

@dataclass
class DimensionScore:
    """Score for single evaluation dimension."""
    
    value: float  # 0.0-5.0
    weight: float  # 0.1-0.2 (relative importance)
    reasoning: str  # Why this score?
    subscores: Dict[str, float] = field(default_factory=dict)  # Breakdown
    suggestions: List[str] = field(default_factory=list)  # How to improve
    
    def weighted_value(self) -> float:
        return self.value * self.weight
```

### 4. Improvement Suggestion Engine

```python
def generate_improvement_suggestions(
    artifact: BaseKnowledgeArtifact,
    evaluation: EvaluationResult,
    extraction_context: Dict[str, Any]
) -> List[ImprovementSuggestion]:
    """
    Generate specific, actionable suggestions to improve quality.
    
    Used in iteration loop to guide re-extraction.
    """
    suggestions = []
    
    # Per-dimension suggestions
    if evaluation.factual_accuracy.value < 3.0:
        suggestions.append(ImprovementSuggestion(
            dimension="factual_accuracy",
            issue="Claims lack proper citations",
            action="Add specific evidence for each claim",
            priority="high"
        ))
    
    if evaluation.completeness.value < 3.0:
        missing_fields = find_missing_sections(artifact)
        suggestions.append(ImprovementSuggestion(
            dimension="completeness",
            issue=f"Missing: {missing_fields}",
            action=f"Expand {missing_fields} section with details",
            priority="high"
        ))
    
    # Automatic scoring feedback
    if evaluation.automatic_scores.get("readability", 5) < 3:
        suggestions.append(ImprovementSuggestion(
            dimension="readability",
            issue="Text is too technical",
            action="Simplify language; explain jargon for non-specialists",
            priority="medium"
        ))
    
    # Cross-artifact suggestions
    if evaluation.cross_artifact_coherence and \
       evaluation.cross_artifact_coherence.value < 3:
        suggestions.append(ImprovementSuggestion(
            dimension="cross_artifact_coherence",
            issue="Doesn't connect to project context",
            action="Add references to related artifacts in project",
            priority="medium"
        ))
    
    return suggestions

@dataclass
class ImprovementSuggestion:
    dimension: str  # Which dimension to improve
    issue: str  # What's the problem?
    action: str  # Specific action to take
    priority: str  # high, medium, low
```

### 5. Re-Extraction Prompt Enhancement

```python
def create_improved_extraction_prompt(
    artifact_type: SourceType,
    original_extraction: Dict[str, Any],
    evaluation: EvaluationResult,
    suggestions: List[ImprovementSuggestion]
) -> str:
    """
    Create improved prompt for re-extraction based on feedback.
    """
    base_prompt = get_base_extraction_prompt(artifact_type)
    
    # Add refinement instructions
    refinement_section = "## Improvement Instructions:\n"
    
    for suggestion in suggestions:
        if suggestion.priority == "high":
            refinement_section += f"- {suggestion.action}\n"
    
    refinement_section += f"\n## Previous Extraction Issues:\n"
    refinement_section += f"- Accuracy concerns: {evaluation.factual_accuracy.reasoning}\n"
    
    if evaluation.low_scores:
        refinement_section += f"- Weak areas: {', '.join(evaluation.low_scores)}\n"
    
    improved_prompt = base_prompt + refinement_section
    
    return improved_prompt
```

---

## Integration with Existing Code

### 1. Updates to Evaluation Module
```python
# evaluation/evaluators.py
class ExpertReviewEvaluator:
    # Existing
    async def evaluate(self, artifact) -> EvaluationResult:
        # 5 dimensions
        pass
    
    # NEW
    async def evaluate_extended(self, 
                                artifact,
                                related_artifacts: Optional[List] = None
                                ) -> EvaluationResult:
        """Evaluate with cross-artifact dimension."""
        pass
    
    async def evaluate_automatic(self, artifact) -> Dict[str, float]:
        """Generate automatic scores."""
        pass

# evaluation/__init__.py
from .advanced_scoring import (
    score_readability,
    score_completeness,
    score_structure,
)
from .suggestions import generate_improvement_suggestions
```

### 2. Updates to Iteration Loop
```python
# workflows/poc_workflow.py
async def iterate_and_refine(self, artifacts):
    for attempt in range(self.max_iterations):
        # Existing extraction + evaluation
        evaluation = await self.evaluate_artifact(artifact)
        
        if evaluation.passes_quality_gate:
            break  # Success
        
        # NEW: Generate suggestions
        suggestions = generate_improvement_suggestions(
            artifact=original_artifact,
            evaluation=evaluation,
            context=extraction_context
        )
        
        # NEW: Improve prompt based on feedback
        improved_prompt = create_improved_extraction_prompt(
            artifact_type=artifact.source_type,
            original_extraction=previous_result,
            evaluation=evaluation,
            suggestions=suggestions
        )
        
        # Re-extract with improved prompt
        improved_artifact = await agent.extract(
            source,
            custom_prompt=improved_prompt
        )
        
        # Re-evaluate
        evaluation = await self.evaluate_artifact(improved_artifact)
```

---

## Testing Strategy

### Unit Tests (80+ tests)
```python
tests/test_evaluation_advanced/
├── test_cross_artifact_coherence.py (20 tests)
│   ├── test_reference_detection
│   ├── test_reference_quality_scoring
│   ├── test_perspective_alignment
│   └── test_edge_cases
├── test_automatic_scoring.py (30 tests)
│   ├── test_readability_scoring
│   ├── test_completeness_scoring
│   ├── test_structure_validation
│   └── test_hallucination_detection
├── test_improvement_suggestions.py (15 tests)
│   ├── test_suggestion_generation
│   ├── test_priority_assignment
│   └── test_prompt_enhancement
└── test_evaluation_result.py (15 tests)
```

### Integration Tests (30+ tests)
```python
tests/test_evaluation_integration/
├── test_hybrid_evaluation.py
│   ├── test_expert_vs_automatic_agreement
│   ├── test_combined_scoring
│   └── test_edge_case_discrepancies
├── test_iteration_with_feedback.py
│   ├── test_suggestion_improves_score
│   ├── test_max_iterations_enforcement
│   └── test_early_exit_on_passing_score
└── test_cross_artifact_in_project.py
    ├── test_multi_artifact_evaluation
    ├── test_inter_artifact_connections
    └── test_compilation_with_metrics
```

---

## Performance Considerations

### Optimization for Cross-Artifact Evaluation
- Cache artifact embeddings for similarity comparisons
- Batch evaluate related artifacts together
- Parallel evaluation of automatic scoring
- Async cross-reference finding

### Caching Strategy
```python
# Cache embeddings for reference detection
artifact_embeddings = {}
artifact_embeddings[artifact_id] = generate_embedding(artifact)

# Reuse for all cross-artifact comparisons in project
# Invalidate when artifact updated
```

---

## Rollout Plan

### Phase 1: MVP (Jan 12-15)
- [x] Design enhanced EvaluationResult schema
- [ ] Implement automatic scoring (readability, completeness)
- [ ] Basic cross-artifact detection
- **Status:** Internal testing

### Phase 2: Integration (Jan 15-19)
- [ ] Integrate with iteration loop
- [ ] Implement improvement suggestions
- [ ] Add prompt enhancement
- [ ] Test feedback-driven improvement
- **Status:** E2E testing

### Phase 3: Polish (Jan 19-23)
- [ ] Performance optimization
- [ ] Caching implementation
- [ ] Evaluation dashboard integration
- **Status:** Production ready

---

## Success Criteria

- [ ] All 6 dimensions evaluating correctly
- [ ] Automatic scoring >= 0.85 correlation with expert
- [ ] Improvement suggestions increase passing rate by 15%
- [ ] Cross-artifact coherence finds real connections
- [ ] Iteration loop reaches 85%+ passing rate
- [ ] 80+ evaluation tests passing
- [ ] Documentation complete

---

**Status: Ready for Implementation (Jan 12)**
