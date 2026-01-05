# Knowledge Extraction POC v1 - Complete Implementation

This directory contains the complete implementation of the **Knowledge Extraction POC v1** as specified in the project specification document.

## 🎯 POC Objective

Build specialized extraction agents for three artifact types:
1. **Research Papers** (PDFs)
2. **Research Talks** (transcripts)
3. **Code/Model Repositories** (GitHub repos)

Extract deep, structured knowledge that goes beyond summaries to capture technical details, limitations, future work, and unanticipated insights.

## 📁 Implementation Structure

### Core Schemas (Spec-Compliant)
- **`core/schemas/base_schema.py`** - Common baseline schema (12 required fields)
- **`core/schemas/paper_schema.py`** - Paper-specific fields (Spec 6.1)
- **`core/schemas/talk_schema.py`** - Talk-specific fields (Spec 6.2)
- **`core/schemas/repository_schema.py`** - Repository-specific fields (Spec 6.3)

All schemas include:
- ✅ 11 baseline knowledge fields
- ✅ Confidence score (0.0-1.0)
- ✅ Provenance tracking
- ✅ Additional/found knowledge sections
- ✅ Datatype-specific required fields

### Extraction Agents
- **`agents/modern_spec_agents.py`** - Agent Framework implementations
  - `ModernPaperAgent` - Research paper extraction
  - `ModernTalkAgent` - Talk/transcript extraction
  - `ModernRepositoryAgent` - Code repository extraction
  
All agents use spec-aligned system prompts that instruct comprehensive extraction.

### System Prompts (Spec-Aligned)
- **`prompts/spec_prompts.py`** - Detailed extraction instructions
  - `PAPER_EXTRACTION_SYSTEM_PROMPT` - Paper extraction guide
  - `TALK_EXTRACTION_SYSTEM_PROMPT` - Talk extraction guide
  - `REPOSITORY_EXTRACTION_SYSTEM_PROMPT` - Repository extraction guide

Each prompt explicitly lists all required fields and extraction guidelines.

### POC Workflow Manager
- **`workflows/poc_workflow.py`** - 7-step POC workflow orchestration
  - Step 1: Collect Artifacts
  - Step 2: Define Projects
  - Step 3: Assign Agents
  - Step 4: Extract Knowledge
  - Step 5: Expert Review
  - Step 6: Iterate if Needed
  - Step 7: Output (+ Stretch: Compile)

### Expert Review System
- **`evaluation/expert_review.py`** - 5-dimension review framework
  - Factual Accuracy (1-5)
  - Completeness (1-5)
  - Faithfulness to Source (1-5)
  - Signal-to-Noise Ratio (1-5)
  - Reusability for AI (1-5)
  
Minimum passing score: 3.0/5.0

### Project Compilation (Stretch Goal)
- **`workflows/project_compilation.py`** - Multi-agent project synthesis
  - CollatorAgent - Aggregate artifacts
  - ResolverAgent - Identify contradictions/gaps
  - SynthesizerAgent - Generate unified knowledge

### Configuration
- **`config/settings.py`** - Centralized configuration
  - POC workflow settings
  - Agent model configuration
  - Evaluation settings
  - Observability settings

### Entry Point
- **`poc_runner.py`** - Main CLI entry point

## 🚀 Quick Start

### 1. Setup Environment

```powershell
# Install dependencies
pip install -r requirements.txt

# Set Azure credentials
$env:AZURE_API_KEY = "your-key"
```

### 2. Prepare Input Artifacts

Create input directory structure:
```
inputs/
  papers/       # Place PDF files here
  transcripts/  # Place TXT transcript files here
  repositories/ # Place repository directories here
```

### 3. Run POC Workflow

```powershell
# Basic workflow
python poc_runner.py

# With project compilation (stretch goal)
python poc_runner.py --compile

# Custom directories and settings
python poc_runner.py --inputs my_inputs/ --outputs results/ --min-score 3.5
```

### 4. Review Results

Results are saved to:
```
outputs/
  structured/        # Extracted knowledge artifacts (JSON)
    project_name/
      artifact1.json
      artifact2.json
  reviews/          # Expert reviews (JSON)
    project_name_artifact1_review.json
  *_COMPILED.json   # Project compilations (if --compile used)
```

## 📊 Workflow Details

### Step 1: Collect Artifacts
Scans `inputs/` directory and identifies all papers, talks, and repositories.

### Step 2: Define Projects
Groups artifacts by project using naming conventions (e.g., `project-a_paper.pdf`, `project-a_transcript.txt`).

### Step 3: Assign Agents
Creates specialized agents:
- PaperAgent for papers
- TalkAgent for talks
- RepositoryAgent for repos

### Step 4: Extract Knowledge
Runs extraction agents on all artifacts using spec-aligned prompts.

### Step 5: Expert Review
Evaluates extractions across 5 dimensions (1-5 scale):
1. Factual Accuracy
2. Completeness
3. Faithfulness to Source
4. Signal-to-Noise Ratio
5. Reusability for AI

### Step 6: Iterate if Needed
Re-extracts artifacts that scored below minimum threshold (default: 3.0).

Maximum iterations: 2 (configurable)

### Step 7: Output
Saves extracted knowledge as structured JSON. Optionally runs project-level compilation.

## 🎯 Spec Compliance

### ✅ Core Knowledge Schema (Baseline)
All artifacts include 12 baseline fields:
1. Contributors/Authors
2. Plain-Language Overview
3. Technical Problem Addressed
4. Key Methods/Approach
5. Primary Claims/Capabilities
6. Novelty vs Prior Work
7. Limitations/Constraints
8. Potential Impact
9. Open Questions/Future Work
10. Key Evidence/Citations
11. Confidence Score (0.0-1.0)
12. Confidence Reasoning

Plus: `provenance` dict and `additional_knowledge` dict

### ✅ Datatype-Specific Schemas

**Papers (Spec 6.1):**
- Publication venue, year, peer-review status
- Datasets used (name, size, availability)
- Evaluation benchmarks and metrics
- Key quantitative results
- Figures/tables referenced
- Influential prior work
- Author-acknowledged limitations
- Reproducibility notes

**Talks (Spec 6.2):**
- Talk type, duration, section breakdown
- Time-coded key segments
- Demo details (type, description)
- Experimental results discussed
- Technical challenges mentioned
- Open risks and pending experiments
- Collaboration requests

**Repositories (Spec 6.3):**
- Artifact type (SDK, service, model, etc.)
- Technical stack (languages, frameworks)
- Installation prerequisites and complexity
- Example use cases
- API surface summary
- Maintenance status
- License and data usage constraints

### ✅ Additional/Found Knowledge
All schemas include flexible `additional_knowledge` dict for:
- Unanticipated methods or techniques
- Side findings not in main results
- Domain cross-overs
- Emergent implications
- Off-script insights (talks)
- Strategic hints (talks)
- Implicit design decisions (repos)
- Performance caveats (repos)

## 🔧 Configuration Options

Edit `config/settings.py` or use environment variables:

```python
# POC Workflow Settings
poc_minimum_expert_rating = 3.0  # Minimum review score to pass
poc_max_iterations = 2           # Max extract-review cycles
poc_enable_compilation = False   # Enable project compilation

# Agent Settings
agent_model = "gpt-4o-mini"      # Model for extraction
agent_temperature = 0.3           # Low temp for precision

# Evaluation Settings
evaluation_model = "gpt-4"        # Model for expert review
```

## 📝 Example Usage

### Extract Single Paper
```python
from agents.modern_spec_agents import extract_paper

artifact = await extract_paper("inputs/papers/my_paper.pdf")
print(f"Title: {artifact.title}")
print(f"Confidence: {artifact.confidence_score}")
print(f"Claims: {artifact.primary_claims_capabilities}")
```

### Run Full Workflow
```python
from workflows.poc_workflow import run_poc_for_project

results = await run_poc_for_project(
    inputs_dir="inputs",
    outputs_dir="outputs",
    minimum_expert_rating=3.0,
    compile_projects=True  # Include stretch goal
)

print(f"Processed {results['total_artifacts']} artifacts")
print(f"Completed in {results['iterations']} iterations")
```

### Review Extraction
```python
from evaluation.expert_review import run_expert_review

review = await run_expert_review(artifact)
print(f"Overall Score: {review.overall_score}/5.0")
print(f"Weakest: {review.get_weakest_dimension().dimension}")
print(f"Approved: {review.approved}")
```

## 🎓 Next Steps

1. **Test with Sample Data**: Create sample artifacts in `inputs/` and run workflow
2. **Customize Prompts**: Edit `prompts/spec_prompts.py` for domain-specific extraction
3. **Tune Review**: Adjust review evaluators in `evaluation/expert_review.py`
4. **Enable Tracing**: Set `enable_tracing=True` in settings for observability
5. **Add Tools**: Integrate MCP tools in `tools/` for enhanced extraction

## 📚 Related Documentation

- **`MODERNIZATION_GUIDE.md`** - Agent Framework migration guide
- **`QUICKSTART.md`** - Quick start for modern infrastructure
- **`MODERNIZATION_SUMMARY.md`** - Summary of modernization changes
- **`spec.txt`** - Original POC specification document

## ⚠️ Known Limitations

- PDF extraction requires OCR for scanned documents (not implemented)
- Repository analysis limited to README, file structure, and dependencies
- Expert review uses heuristics (LLM-based review available but not default)
- Project compilation is simple (advanced LLM-powered version available)
- Re-extraction on iteration doesn't yet incorporate review feedback

## 🤝 Contributing

To extend this POC:
1. Add new artifact types in `core/schemas/`
2. Create corresponding agents in `agents/`
3. Add extraction prompts in `prompts/`
4. Update workflow in `workflows/poc_workflow.py`

## 📄 License

See main project README for license information.
