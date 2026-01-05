# Technical Specification: Multi-Artifact Project Framework

**Document Type:** Technical Design Specification  
**Component:** Multi-Artifact Project Management System  
**Author:** Knowledge Agent POC Team  
**Date:** January 5, 2026  
**Status:** Ready for Implementation

---

## Overview

The Multi-Artifact Project Framework enables grouping of papers, talks, and code repositories into coherent research projects for batch extraction, evaluation, and knowledge synthesis.

---

## Data Model

### Core Entities

#### ProjectDefinition
```python
@dataclass
class ProjectDefinition:
    """Top-level project container."""
    
    # Identity
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # "Vision Language Models 2024"
    description: str  # Long-form description
    research_area: str  # "computer-vision", "nlp", etc.
    
    # Artifacts
    papers: List['PaperReference'] = field(default_factory=list)
    talks: List['TalkReference'] = field(default_factory=list)
    repositories: List['RepositoryReference'] = field(default_factory=list)
    
    # Metadata
    objectives: List[str]  # What are we trying to understand?
    keywords: List[str]  # Project tags
    related_projects: List[str] = field(default_factory=list)  # Cross-references
    
    # Dates
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    target_completion_date: Optional[datetime] = None
    
    # Status & Control
    status: 'ProjectStatus' = 'draft'  # draft, active, completed, archived
    is_public: bool = False
    
    # Execution
    execution_config: Optional['ExecutionConfig'] = None
    
    # Results
    compiled_knowledge: Optional['CompiledProjectKnowledge'] = None
    quality_metrics: Optional['ProjectQualityMetrics'] = None
    
    def artifact_count(self) -> int:
        return len(self.papers) + len(self.talks) + len(self.repositories)
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dictionary."""
        pass
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ProjectDefinition':
        """Deserialize from dictionary."""
        pass
```

#### PaperReference
```python
@dataclass
class PaperReference:
    """Reference to a research paper."""
    
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    # Source
    local_path: Optional[str] = None  # /path/to/paper.pdf
    url: Optional[str] = None  # https://arxiv.org/...
    doi: Optional[str] = None  # Digital Object Identifier
    
    # Metadata
    title: Optional[str] = None  # Auto-extract or provide
    authors: List[str] = field(default_factory=list)
    publication_date: Optional[date] = None
    venue: Optional[str] = None  # Conference or journal
    
    # Extraction Status
    status: 'ArtifactStatus' = 'pending'  # pending, processing, complete, failed
    extraction_attempts: int = 0
    last_extraction_error: Optional[str] = None
    
    # Results
    extracted_knowledge: Optional['PaperKnowledgeArtifact'] = None
    evaluation_result: Optional['EvaluationResult'] = None
    
    @property
    def quality_score(self) -> Optional[float]:
        if self.evaluation_result:
            return self.evaluation_result.weighted_score
        return None
```

#### TalkReference
```python
@dataclass
class TalkReference:
    """Reference to a research talk/presentation."""
    
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    # Source
    local_path: Optional[str] = None  # /path/to/transcript.txt
    url: Optional[str] = None  # YouTube, conference link
    
    # Metadata
    title: Optional[str] = None
    speakers: List[str] = field(default_factory=list)
    event: Optional[str] = None  # Conference name
    date: Optional[date] = None
    duration_minutes: Optional[int] = None
    video_url: Optional[str] = None
    
    # Extraction Status
    status: 'ArtifactStatus' = 'pending'
    extraction_attempts: int = 0
    last_extraction_error: Optional[str] = None
    
    # Results
    extracted_knowledge: Optional['TalkKnowledgeArtifact'] = None
    evaluation_result: Optional['EvaluationResult'] = None
```

#### RepositoryReference
```python
@dataclass
class RepositoryReference:
    """Reference to a code repository."""
    
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    
    # Source
    url: str  # https://github.com/owner/repo (required)
    
    # Metadata
    owner: Optional[str] = None  # Auto-extracted
    name: Optional[str] = None
    description: Optional[str] = None
    primary_language: Optional[str] = None
    topics: List[str] = field(default_factory=list)
    stars: Optional[int] = None
    
    # Extraction Status
    status: 'ArtifactStatus' = 'pending'
    extraction_attempts: int = 0
    last_extraction_error: Optional[str] = None
    
    # Results
    extracted_knowledge: Optional['RepositoryKnowledgeArtifact'] = None
    evaluation_result: Optional['EvaluationResult'] = None
```

### Enums

```python
class ProjectStatus(str, Enum):
    """Project lifecycle status."""
    DRAFT = "draft"  # Being set up
    ACTIVE = "active"  # Currently extracting
    PAUSED = "paused"  # Temporarily stopped
    COMPLETED = "completed"  # Extraction done
    ARCHIVED = "archived"  # No longer active

class ArtifactStatus(str, Enum):
    """Artifact extraction status."""
    PENDING = "pending"  # Queued for processing
    PROCESSING = "processing"  # Currently extracting
    COMPLETE = "complete"  # Extraction successful
    FAILED = "failed"  # Extraction error
    NEEDS_REVIEW = "needs_review"  # Manual review needed
    APPROVED = "approved"  # Quality approved
```

---

## Storage & Repository

### ProjectRepository Interface
```python
class ProjectRepository(Protocol):
    """Abstract project storage interface."""
    
    def create(self, project: ProjectDefinition) -> str:
        """Create project, return ID."""
        
    def read(self, project_id: str) -> ProjectDefinition:
        """Get project by ID."""
        
    def update(self, project: ProjectDefinition) -> None:
        """Update existing project."""
        
    def delete(self, project_id: str) -> None:
        """Delete project (archive preferred)."""
        
    def list(self, 
             status: Optional[ProjectStatus] = None,
             area: Optional[str] = None,
             created_after: Optional[datetime] = None) -> List[ProjectDefinition]:
        """Query projects with filtering."""
        
    def count(self) -> int:
        """Total project count."""
        
    def get_statistics(self) -> Dict[str, Any]:
        """Aggregate statistics across projects."""
```

### Implementation Options
1. **JSON File Storage** (MVP)
   - Simple, no DB setup
   - Good for <100 projects
   - Per-project JSON files in `projects/` directory

2. **SQLite** (Production)
   - Lightweight, single file
   - Supports queries
   - Easy deployment

3. **PostgreSQL** (Cloud)
   - Full-featured
   - Multi-user support
   - Horizontal scaling

**MVP Strategy:** Start with JSON, migrate to SQLite when needed

---

## Execution Flow

### Project Execution Pipeline

```
1. START: User submits project

2. VALIDATE
   - Check all references valid
   - Ensure at least 1 artifact
   - Verify URLs/paths accessible

3. PREPARE
   - Download remote artifacts
   - Stage local files
   - Create execution context

4. EXTRACT (Per Artifact)
   - Assign appropriate agent
   - Run extraction
   - Capture output
   - Record duration & tokens

5. EVALUATE (Per Artifact)
   - Run expert review
   - Calculate scores
   - Assess quality

6. DECIDE
   - Score >= 3.0? → Move to 8
   - Score < 3.0? → Move to 7

7. ITERATE (If needed)
   - Generate improvement suggestions
   - Update extraction prompt
   - Re-extract (max 2-3 times)
   - Re-evaluate

8. COMPILE
   - Synthesize all extracted knowledge
   - Find cross-references
   - Generate compilation report

9. COMPLETE
   - Write results to storage
   - Update project status
   - Generate metrics

10. REPORT
    - Return compiled knowledge
    - Return quality metrics
    - Return detailed logs
```

### ExecutionConfig
```python
@dataclass
class ExecutionConfig:
    """Project execution parameters."""
    
    # Processing
    parallel_extractions: int = 3  # Concurrent artifacts
    extraction_model: str = "gpt-4o"
    extraction_temperature: float = 0.3
    
    # Quality
    min_quality_score: float = 3.0  # Pass threshold
    max_extraction_attempts: int = 2  # Iteration limit
    enable_compilation: bool = True
    
    # Optimization
    enable_prompt_optimization: bool = False
    use_cached_extractions: bool = True
    
    # Notifications
    notify_on_completion: bool = False
    notification_email: Optional[str] = None
    
    # Human Review
    require_human_approval: bool = False
    escalate_if_low_quality: bool = True
```

---

## API Contracts

### Request: Create Project
```http
POST /api/v1/projects
Content-Type: application/json

{
  "name": "Vision Language Models 2024",
  "description": "Collection of papers, talks, and code on VLMs",
  "research_area": "computer-vision",
  "objectives": [
    "Understand CLIP architecture",
    "Evaluate performance benchmarks",
    "Review implementation details"
  ],
  "papers": [
    {
      "url": "https://arxiv.org/pdf/2103.14030.pdf",
      "title": "Learning Transferable Visual Models From Natural Language Supervision"
    }
  ],
  "talks": [
    {
      "url": "https://www.youtube.com/watch?v=...",
      "title": "CLIP: Connecting Text and Images"
    }
  ],
  "repositories": [
    {
      "url": "https://github.com/openai/CLIP"
    }
  ],
  "execution_config": {
    "parallel_extractions": 3,
    "min_quality_score": 3.0
  }
}
```

### Response: Create Project
```http
201 Created
Content-Type: application/json

{
  "project_id": "proj_abc123xyz",
  "status": "draft",
  "created_at": "2024-01-05T10:30:00Z",
  "artifact_count": 3,
  "artifacts": {
    "papers": 1,
    "talks": 1,
    "repositories": 1
  }
}
```

### Request: Execute Project
```http
POST /api/v1/projects/proj_abc123xyz/execute
```

### Response: Execution Started
```http
202 Accepted
Location: /api/v1/projects/proj_abc123xyz/status

{
  "execution_id": "exec_xyz789",
  "started_at": "2024-01-05T10:35:00Z",
  "status": "processing"
}
```

### Request: Get Status
```http
GET /api/v1/projects/proj_abc123xyz/status
```

### Response: Status Update
```http
200 OK

{
  "project_id": "proj_abc123xyz",
  "status": "processing",
  "progress": {
    "completed": 1,
    "total": 3,
    "percentage": 33
  },
  "current_artifact": {
    "type": "talk",
    "title": "CLIP: Connecting Text and Images",
    "status": "processing"
  },
  "start_time": "2024-01-05T10:35:00Z",
  "estimated_completion": "2024-01-05T11:30:00Z"
}
```

### Request: Get Results
```http
GET /api/v1/projects/proj_abc123xyz/results
```

### Response: Compilation Results
```http
200 OK

{
  "project_id": "proj_abc123xyz",
  "compiled_knowledge": {
    "key_findings": [...],
    "cross_references": {...},
    "gaps": [...],
    "recommendations": [...]
  },
  "quality_metrics": {
    "average_score": 3.8,
    "passing_artifacts": 3,
    "total_artifacts": 3,
    "passing_rate": 1.0
  },
  "artifacts": [
    {
      "id": "art_...",
      "type": "paper",
      "title": "...",
      "quality_score": 3.9,
      "status": "approved"
    }
  ]
}
```

---

## Integration with Existing Code

### Changes to POC Workflow
```python
# Current: Single artifact extraction
from agents import ModernPaperAgent

agent = ModernPaperAgent()
result = await agent.extract("paper.pdf")

# New: Project-based orchestration
from projects import ProjectService

service = ProjectService()
project = service.load_project("proj_abc123xyz")

# Execute entire project (multiple artifacts, auto-iteration)
results = await service.execute_project(project)

# Access compiled results
knowledge = results.compiled_knowledge
metrics = results.quality_metrics
```

### Changes to Evaluation Framework
```python
# Existing: Single artifact evaluation
from evaluation.evaluators import ExpertReviewEvaluator

evaluator = ExpertReviewEvaluator()
result = evaluator.evaluate(artifact)

# New: Project-level evaluation with cross-artifact scoring
evaluator.evaluate_cross_artifact(
    primary_artifact=paper,
    related_artifacts=[talk, repo],
    dimension='cross_artifact_coherence'
)
```

---

## Testing Strategy

### Unit Tests (100+ tests)
```python
tests/test_projects/
├── test_project_definition.py  # Schema validation
├── test_project_references.py  # Individual artifact refs
├── test_project_repository.py  # CRUD operations
├── test_execution_config.py    # Configuration validation
└── test_enums.py              # Status transitions
```

### Integration Tests (50+ tests)
```python
tests/test_projects/
├── test_project_creation_workflow.py  # Create → validate → execute
├── test_artifact_extraction_in_project.py
├── test_iteration_loop.py
└── test_compilation.py
```

### API Contract Tests (40+ tests)
```python
tests/test_api/
├── test_project_endpoints.py
├── test_execution_endpoints.py
├── test_status_endpoints.py
└── test_results_endpoints.py
```

---

## Rollout Plan

### Phase 1: MVP (Jan 12-15)
- Project definition schema
- JSON-based storage
- Basic CRUD operations
- Manual artifact assignment
- **Status:** Internal testing

### Phase 2: Integration (Jan 15-19)
- Agent integration
- Batch extraction
- Evaluation integration
- Iteration loop
- **Status:** E2E testing

### Phase 3: API (Jan 19-23)
- REST endpoints
- Status tracking
- Results retrieval
- **Status:** API testing

### Phase 4: Polish (Jan 23-26)
- Dashboard integration
- Performance optimization
- Documentation
- **Status:** Production ready

---

## Success Criteria

- [x] Data model complete
- [ ] Repository implementation working
- [ ] Project creation functional
- [ ] Artifact extraction in projects
- [ ] Iteration loop reaching 85%+ passing rate
- [ ] Compilation producing insights
- [ ] API endpoints operational
- [ ] 75%+ test coverage
- [ ] Documentation complete

---

## Implementation Order

**Start immediately:**
1. Create `projects/` module directory
2. Define ProjectDefinition dataclass
3. Implement ProjectRepository with JSON storage
4. Write 30+ unit tests
5. Create CRUD CLI commands

**Next (Jan 12):**
6. Integrate with agents
7. Build execution pipeline
8. Implement iteration loop

---

**Status: Ready for Implementation**
