# Roadmap & Cleanup Visual Guide

## 📊 Overall Roadmap Timeline

```
┌─ MVP (Week 1-2) ─┬─ Phase 1 (Week 3-4) ─┬─ Phase 2 (Week 5-6) ─┬─ Phase 3 (Week 7+) ──┐
│                  │                       │                     │                      │
│ • Legacy cleanup │ • Multi-artifact      │ • Production API    │ • Knowledge Graph    │
│ • Tests created  │   extraction          │ • Error handling    │ • Custom sources     │
│ • Core validated │ • Evaluation          │ • Deployment        │ • Copilot/Teams      │
│                  │ • Quality metrics     │ • Monitoring        │ • Expert-in-loop     │
└──────────────────┴───────────────────────┴─────────────────────┴──────────────────────┘
   2 weeks            2 weeks                2 weeks              4+ weeks
   Foundation         Multi-Artifact         Production Ready     Advanced Features
```

---

## 🎯 Feature Matrix by Scenario

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 1: Core Knowledge Extraction (MVP Priority)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Status: 80% complete                                                        │
│ Needed: Testing, hardening, sample data                                     │
│ Timeline: Week 1-2                                                          │
│                                                                              │
│ ✓ Paper extraction     ✓ Schema validation   ✓ Expert review               │
│ ✓ Talk extraction      ✓ Artifact output     ⚠ Iteration loop             │
│ ✓ Repo extraction      ✓ Quality framework   ⚠ Error handling             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 2: Multi-Artifact Projects (Phase 1)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Status: Framework ready, not implemented                                     │
│ Needed: Project compilation, deduplication, cross-references                │
│ Timeline: Week 3-4                                                          │
│                                                                              │
│ [ ] Project grouping      [ ] Artifact aggregation    [ ] Output formats    │
│ [ ] Per-artifact workflow [ ] Knowledge synthesis     [ ] Cross-linking     │
│ [ ] Batch processing      [ ] Deduplication          [ ] Validation        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 3: Multi-Agent Collaboration (Phase 1)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Status: Workflows infrastructure ready                                       │
│ Needed: Parallel orchestration, result merging                               │
│ Timeline: Week 3-4                                                          │
│                                                                              │
│ [ ] Concurrent execution   [ ] Result aggregation     [ ] Performance opt   │
│ [ ] Multiple models        [ ] Confidence weighting   [ ] Benchmarking      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 4: Continuous Evaluation (Phase 2)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Status: Evaluation SDK ready, needs orchestration                            │
│ Needed: Test datasets, dashboards, A/B testing                              │
│ Timeline: Week 5-6                                                          │
│                                                                              │
│ [ ] Test dataset creation  [ ] A/B testing            [ ] Dashboards        │
│ [ ] Metric tracking        [ ] Regression detection   [ ] Alerts            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 5: Production Deployment (Phase 2)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Status: Foundation ready, needs implementation                               │
│ Needed: API server, queue, monitoring                                        │
│ Timeline: Week 5-6                                                          │
│                                                                              │
│ [ ] HTTP API (FastAPI)    [ ] Queue system           [ ] Monitoring         │
│ [ ] Health checks         [ ] Error tracking         [ ] Deployment guides  │
│ [ ] Rate limiting         [ ] Retry logic            [ ] Docker/K8s         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 6: Knowledge Graph Integration (Phase 3)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Status: Schemas ready for extraction                                         │
│ Needed: Entity extraction, relationship detection                            │
│ Timeline: Week 7-8                                                          │
│                                                                              │
│ [ ] Entity extraction      [ ] Graph mapping          [ ] Deduplication     │
│ [ ] Relationship extract   [ ] Output formats         [ ] Entity resolution  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 7: Teams & Copilot Integration (Phase 3)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Status: API framework ready                                                  │
│ Needed: Bot framework adapter, UI                                            │
│ Timeline: Week 9+                                                           │
│                                                                              │
│ [ ] Bot Framework handler [ ] Adaptive cards         [ ] Notifications      │
│ [ ] Copilot actions       [ ] Feedback loops         [ ] Teams integration  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 8: Custom Data Sources (Phase 3)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Status: Base architecture ready                                              │
│ Needed: Source adapters, parsers                                             │
│ Timeline: Week 10+                                                          │
│                                                                              │
│ [ ] Blog post extractor   [ ] Slack/Teams extraction [ ] Custom adapters    │
│ [ ] Video transcripts      [ ] Internal docs         [ ] Testing per source │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SCENARIO 9: Expert-in-the-Loop (Phase 3)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Status: Review framework ready                                               │
│ Needed: UI, feedback workflow, fine-tuning                                   │
│ Timeline: Week 11+                                                          │
│                                                                              │
│ [ ] Review UI             [ ] Annotation workflow    [ ] Fine-tuning        │
│ [ ] Feedback storage      [ ] Metrics tracking       [ ] Prompt optimization│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗑️ Legacy Code Deletion Map

```
┌─ AGENTS DIRECTORY ─────────────────────────────────────────┐
│                                                              │
│  base_agent.py                      ✗ DELETE (331 lines)    │
│  ├─ LLM client management (Azure, OpenAI, Anthropic)       │
│  ├─ Direct API calls                                        │
│  ├─ Manual error handling                                   │
│  └─ Replaced by: modern_base_agent.py                       │
│                                                              │
│  paper_agent.py                     ✗ DELETE (290 lines)    │
│  ├─ PDF text extraction via pdfplumber/PyPDF2              │
│  ├─ Metadata extraction                                     │
│  ├─ Legacy parsing logic                                    │
│  └─ Replaced by: ModernPaperAgent in modern_spec_agents.py │
│                                                              │
│  talk_agent.py                      ✗ DELETE (280 lines)    │
│  ├─ Transcript text reading (txt, md, json)                │
│  ├─ Talk-specific parsing                                   │
│  └─ Replaced by: ModernTalkAgent in modern_spec_agents.py  │
│                                                              │
│  repository_agent.py                ✗ DELETE (330 lines)    │
│  ├─ GitHub API integration                                  │
│  ├─ Local repo analysis                                     │
│  ├─ Directory structure parsing                             │
│  └─ Replaced by: ModernRepositoryAgent in modern_spec_agents.py
│                                                              │
│  ✓ Keep: modern_base_agent.py       (modern framework)     │
│  ✓ Keep: modern_spec_agents.py      (modern implementations)
│                                                              │
└─ TOTAL: 1,231 lines of legacy code to delete ──────────────┘

┌─ EXAMPLES & TESTS ─────────────────────────────────────────┐
│                                                              │
│  examples.py                        📦 ARCHIVE (229 lines)  │
│  ├─ Old usage patterns (still valid for reference)         │
│  ├─ Legacy syntax examples                                  │
│  └─ Archive to: docs/legacy-reference/examples-old.py      │
│                                                              │
│  quick_test.py                      ✗ DELETE (60 lines)    │
│  ├─ Quick validation script (outdated)                      │
│  ├─ Ad-hoc testing (no proper test framework)              │
│  └─ Replaced by: proper tests/ directory                   │
│                                                              │
│  test_extraction.py                 📦 ARCHIVE (300+ lines) │
│  ├─ Extraction tests (mixed legacy/modern)                  │
│  ├─ Needs complete rewrite for modern agents               │
│  └─ Archive to: docs/legacy-reference/test_extraction-old.py
│                                                              │
│  validate_imports.py                ✗ DELETE (50 lines)    │
│  ├─ Simple import validator                                 │
│  ├─ Can be replaced with pytest                            │
│  └─ Replaced by: test suite in tests/                       │
│                                                              │
│  refactor_examples.py               ✗ DELETE (55 lines)    │
│  ├─ Reference implementation (outdated)                     │
│  ├─ Uses ports & adapters pattern                          │
│  └─ Replace with: examples_modern.py                        │
│                                                              │
│  ✓ Keep: examples_modern.py         (modern examples)       │
│                                                              │
└─ TOTAL: 694 lines of examples/tests to archive or delete ──┘

┌─ ENTRY POINTS (REWRITE) ───────────────────────────────────┐
│                                                              │
│  knowledge_agent.py                 🔄 REWRITE (243 lines)  │
│  ├─ CLI interface (imports old agents)                      │
│  ├─ Uses legacy PaperAgent/TalkAgent/RepositoryAgent       │
│  └─ Update to: import ModernPaperAgent, ModernTalkAgent, etc│
│                                                              │
│  knowledge_agent_bot.py             🔄 REWRITE (180+ lines) │
│  ├─ Bot integration (imports old agents)                    │
│  ├─ Uses legacy agents                                      │
│  └─ Update to: modern agent imports                         │
│                                                              │
│  poc_runner.py                      🔄 REWRITE (489 lines)  │
│  ├─ POC workflow manager (imports old agents)               │
│  ├─ Uses legacy extraction pipeline                         │
│  └─ Update to: use ModernPaperAgent, ModernTalkAgent, etc   │
│                                                              │
│  poc_workflow.py                    🔄 UPDATE (489 lines)   │
│  ├─ Workflow orchestration (imports old agents)             │
│  ├─ Uses legacy agents                                      │
│  └─ Update imports to modern agents                         │
│                                                              │
└─ Must be rewritten, but business logic stays ───────────────┘

SUMMARY:
────────
✗ Delete: 1,231 lines (base_agent, paper/talk/repo agents)
📦 Archive: 694 lines (examples, old tests for reference)
🔄 Update: ~1,500 lines (entry points, imports only)

Total Elimination: ~1,925 lines
Total Code to Touch: ~1,500 lines (just import updates)
```

---

## 🔄 Migration Path Flow

```
┌─────────────────────────────────────────────────────────────┐
│ YOUR CURRENT CODE (Using Legacy Agents)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  from agents import PaperAgent                              │
│  agent = PaperAgent(llm_provider="azure-openai")            │
│  artifact = agent.extract("paper.pdf")  # Sync              │
│  agent.save_artifact(artifact, "./out")                     │
│                                                              │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼──────────────────┐
                    │ STEP 1: Update Imports (5 min)     │
                    │ Replace:                           │
                    │  from agents import PaperAgent     │
                    │ With:                              │
                    │  from agents import ModernPaperAgent
                    │  as PaperAgent                     │
                    │                                    │
                    │ OR use modern names directly       │
                    │  from agents import               │
                    │    ModernPaperAgent as PaperAgent │
                    └─────────────────┬──────────────────┘
                                      │
                    ┌─────────────────▼──────────────────┐
                    │ STEP 2: Convert to Async (15 min)  │
                    │ Make function async:               │
                    │  async def extract():              │
                    │    ...                             │
                    │ Add await:                         │
                    │  artifact = await agent.extract()  │
                    │ Wrap call:                         │
                    │  asyncio.run(extract())            │
                    └─────────────────┬──────────────────┘
                                      │
                    ┌─────────────────▼──────────────────┐
                    │ STEP 3: Add Tracing (5 min)        │
                    │ At app startup:                    │
                    │  from observability import        │
                    │    setup_tracing                   │
                    │  setup_tracing()                   │
                    │                                    │
                    │ Optional: Start trace collector    │
                    │  (AI Toolkit → Start Trace...)     │
                    └─────────────────┬──────────────────┘
                                      │
                    ┌─────────────────▼──────────────────┐
                    │ STEP 4: Update Config (5 min)      │
                    │ In .env:                           │
                    │  FOUNDRY_PROJECT_ENDPOINT=...      │
                    │  FOUNDRY_MODEL_DEPLOYMENT=gpt-4o   │
                    │ Or Settings class                  │
                    └─────────────────┬──────────────────┘
                                      │
                    ┌─────────────────▼──────────────────┐
                    │ STEP 5: Test (Varies)              │
                    │ Run: python your_code.py           │
                    │ Check: tracing in AI Toolkit       │
                    │ Verify: output JSON valid          │
                    └─────────────────┬──────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────┐
│ MODERN CODE (Ready for Production)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  import asyncio                                              │
│  from agents import ModernPaperAgent                        │
│  from config import get_settings                            │
│  from observability import setup_tracing                    │
│                                                              │
│  async def main():                                           │
│    setup_tracing()                                           │
│    settings = get_settings()                                │
│    agent = ModernPaperAgent(settings)                       │
│    artifact = await agent.extract("paper.pdf")  # Async!   │
│    artifact.save_json("./outputs")                          │
│                                                              │
│  asyncio.run(main())                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘

Migration Time: ~30-60 minutes per file (depending on complexity)
```

---

## 📈 Code Metrics Before/After

```
┌──────────────────────────────────────────────────────────┐
│ BEFORE (Legacy) - Multiple implementations                │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Code:                                                    │
│    base_agent.py           331 lines  ┐                  │
│    paper_agent.py          290 lines  │                  │
│    talk_agent.py           280 lines  ├─ 1,231 legacy   │
│    repository_agent.py     330 lines  │                  │
│                                        ┘                  │
│  Examples:                                                │
│    examples.py             229 lines  (old patterns)     │
│    refactor_examples.py     55 lines  (reference impl)   │
│                                                           │
│  Tests:                                                   │
│    test_extraction.py      300 lines  (needs rewrite)    │
│    validate_imports.py      50 lines  (ad-hoc)          │
│    quick_test.py            60 lines  (ad-hoc)          │
│                                                           │
│  Total Legacy: ~1,925 lines across 7+ files             │
│  Maintenance: 2 versions of each agent                   │
│  Issues: Inconsistent patterns, manual logging           │
│                                                           │
└──────────────────────────────────────────────────────────┘
                                │
                 CLEANUP & CONSOLIDATION
                                │
                                ▼
┌──────────────────────────────────────────────────────────┐
│ AFTER (Modern) - Single implementation                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Code:                                                    │
│    modern_base_agent.py    [efficient modern base]       │
│    modern_spec_agents.py   [3 agents in modern style]    │
│                                                           │
│  Examples:                                                │
│    examples_modern.py      239 lines  (modern patterns)  │
│                                                           │
│  Tests:                                                   │
│    tests/test_*.py         (comprehensive + structured)  │
│                                                           │
│  Configuration:                                           │
│    config/settings.py      (centralized, validated)      │
│                                                           │
│  Observability:                                           │
│    observability/          (OpenTelemetry built-in)      │
│                                                           │
│  Total Code: ~35% reduction (1,925 → ~1,250 lines)      │
│  Maintenance: Single version with modern patterns        │
│  Benefits: Built-in tracing, tools, multi-agent, async  │
│                                                           │
└──────────────────────────────────────────────────────────┘

METRICS:
────────
Code Size:        1,925 lines → 1,250 lines (-35%)
Maintenance:      2 versions → 1 version (-50%)
Test Coverage:    ~10% → 70% target (+700%)
Async Support:    ✗ None → ✓ Full (+100%)
Tracing:          ✗ Manual → ✓ Built-in (+100%)
Tool Support:     ✗ None → ✓ Full (+100%)
```

---

## 🎯 Success Criteria Checklist

```
MVP SUCCESS (After Week 2):
┌─────────────────────────────────────────┐
│ ✓ All legacy code removed               │
│ ✓ Zero import errors                    │
│ ✓ All smoke tests pass                  │
│ ✓ poc_runner.py executable              │
│ ✓ Basic extraction works                │
│ ✓ Expert review framework validates     │
│ ✓ Schema validation passes              │
│ ✓ Git history preserved                 │
│ ✓ Migration guide documented            │
│ ✓ Team trained on modern patterns       │
└─────────────────────────────────────────┘

PHASE 1 SUCCESS (After Week 4):
┌─────────────────────────────────────────┐
│ ✓ Multi-artifact extraction working     │
│ ✓ Project grouping logic implemented    │
│ ✓ Evaluation runner functional          │
│ ✓ Test dataset (20-30 artifacts) ready  │
│ ✓ Quality metrics 3.0+/5.0              │
│ ✓ 70% test coverage                     │
│ ✓ Full 7-step workflow documented       │
│ ✓ Performance baselines established     │
└─────────────────────────────────────────┘

PHASE 2 SUCCESS (After Week 6):
┌─────────────────────────────────────────┐
│ ✓ HTTP API passing contract tests       │
│ ✓ Handles 10 concurrent requests        │
│ ✓ All errors logged w/ correlation IDs  │
│ ✓ Deployed to staging successfully      │
│ ✓ Monitoring dashboards populated       │
│ ✓ Load tested: 1000 req/min             │
│ ✓ Deployment guide complete             │
│ ✓ Health checks operational             │
└─────────────────────────────────────────┘
```

---

**Last Updated:** January 5, 2026
**Status:** Ready for Execution
**Next:** Review ROADMAP.md and approve to begin Week 1
