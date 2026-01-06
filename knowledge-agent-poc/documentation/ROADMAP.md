# Knowledge Agent POC - Comprehensive Roadmap

**Status:** Modernized codebase with dual legacy/modern paths
**Current Date:** January 5, 2026
**Goal:** Consolidated, production-ready agent platform with clear feature roadmap

---

## 🎯 Executive Summary

### Current State
- **Modern path:** Agent Framework, workflows, evaluation, tools - all implemented ✅
- **Legacy path:** Direct LLM clients (paper_agent.py, talk_agent.py, repository_agent.py) - functional but not modern
- **Dual maintenance burden:** 2 versions of everything
- **No production test suite:** No validation that features actually work end-to-end

### Vision
**Unified, modern platform with:**
1. Single extraction pipeline (Agent Framework based)
2. Comprehensive test coverage (unit + integration)
3. Clear feature roadmap with staged delivery
4. Production-ready observability & error handling
5. Documented deployment paths

### Timeline
- **MVP (Sprint 1-2):** Remove legacy, validate core extraction
- **Phase 1 (Sprint 3-4):** Multi-agent orchestration + evaluation
- **Phase 2 (Sprint 5-6):** Production hardening + deployment
- **Phase 3 (Sprint 7+):** Advanced features + stretch goals

---

## 🗑️ LEGACY CODE CLEANUP

### Code to Remove

#### 1. Legacy Agent Implementations
```
agents/base_agent.py          (331 lines)
agents/paper_agent.py         (290 lines)
agents/talk_agent.py          (280 lines)
agents/repository_agent.py    (330 lines)
────────────────────────────────────────
TOTAL: 1,231 lines of legacy code
```

**Reasoning:** Fully replaced by `modern_spec_agents.py` with Agent Framework

**Migration Path:**
- ✅ Modern versions exist: ModernPaperAgent, ModernTalkAgent, ModernRepositoryAgent
- ✅ Modern versions use Agent Framework (better for production)
- ✅ Modern versions include tracing & tool support
- Delete legacy files and update all imports

#### 2. Legacy Example Files
```
examples.py                   (229 lines)  → Archive as examples_legacy.py
refactor_examples.py          (55 lines)   → Delete (outdated reference impl)
validate_imports.py           (50 lines)   → Move validation to tests/
quick_test.py                 (60 lines)   → Move to tests/test_integration.py
test_extraction.py            (300+ lines) → Archive and rewrite properly
```

**Reasoning:** Inconsistent patterns, outdated, some serve same purpose as examples_modern.py

#### 3. Outdated Entry Points
```
knowledge_agent.py            → Rewrite to use modern agents
knowledge_agent_bot.py        → Rewrite to use modern agents
knowledge_agent.json          → Review and update manifest
```

**Reasoning:** Both still reference legacy agents; need migration to modern stack

#### 4. Test Infrastructure Issues
```
tests/                        → Completely missing!
                              Integration tests needed
                              Unit tests for each component
                              End-to-end workflow tests
```

**Reasoning:** Cannot ship production code without test coverage

### Files to Keep & Modernize

| File | Keep? | Why | Action |
|------|-------|-----|--------|
| `core/schemas/*` | ✅ Yes | Core data model | Keep - required by spec |
| `prompts/*` | ✅ Yes | Extraction instructions | Keep - critical for quality |
| `config/settings.py` | ✅ Yes | Configuration | Keep - modern implementation |
| `observability/tracing.py` | ✅ Yes | Observability | Keep - production required |
| `evaluation/*` | ✅ Yes | Quality assurance | Keep - spec requirement |
| `workflows/*` | ✅ Yes | Orchestration | Keep - future features |
| `tools/*` | ✅ Yes | Tool integration | Keep - extensibility |
| `agents/modern_*` | ✅ Yes | Modern implementation | Keep - production ready |
| `core_interfaces.py` | ⚠️ Maybe | Ports & adapters pattern | Review - may conflict with Agent Framework |
| `poc_runner.py` | ✅ Yes (rewrite) | POC orchestration | Rewrite to use modern agents |

---

## 📋 COMPREHENSIVE FEATURE ROADMAP

### Scenario Categories

#### **Scenario 1: Core Knowledge Extraction** (MVP)
Extract structured knowledge from 3 artifact types with quality validation

**Features:**
- ✅ Paper extraction (PDF → JSON)
- ✅ Talk extraction (Transcript → JSON)
- ✅ Repository extraction (GitHub → JSON)
- ✅ Schema validation
- ✅ Expert review (5-dimension scoring)
- ⚠️ Iteration loop (re-extract if < 3.0 score)
- ⚠️ Batch processing

**Status:** 80% complete - needs testing and hardening

**Needed:**
- [ ] Comprehensive test suite
- [ ] Error handling improvements
- [ ] Logging standardization
- [ ] Sample data + end-to-end tests
- [ ] Performance optimization

---

#### **Scenario 2: Multi-Artifact Projects** (Phase 1)
Group related artifacts (papers, talks, repos) by project and extract unified knowledge

**Features:**
- [ ] Project grouping logic (by filename prefix/metadata)
- [ ] Per-artifact extraction
- [ ] Expert review per artifact
- [ ] Iteration loop per artifact
- [ ] Project-level compilation (optional)
- [ ] Cross-artifact linking

**Enabled by:**
- ✅ POCWorkflowManager (7-step workflow)
- ✅ Evaluation framework
- ✅ Sequential workflows

**Needed:**
- [ ] Complete project_compilation.py implementation
- [ ] Artifact deduplication logic
- [ ] Cross-reference resolution
- [ ] Project output formats (JSON, markdown, structured)

---

#### **Scenario 3: Multi-Agent Collaboration** (Phase 1)
Run multiple agents in parallel for coverage + perspective diversity

**Features:**
- [ ] Parallel artifact processing
- [ ] Multiple model strategy (fast screening + deep analysis)
- [ ] Agent-specific prompts per model
- [ ] Result aggregation and deduplication
- [ ] Confidence-based weighting

**Enabled by:**
- ✅ Concurrent workflows
- ✅ Multi-agent support in Agent Framework

**Needed:**
- [ ] Concurrent execution orchestration
- [ ] Result merging strategy
- [ ] Performance benchmarking

---

#### **Scenario 4: Continuous Evaluation & Improvement** (Phase 2)
Automated quality metrics, A/B testing, regression detection

**Features:**
- [ ] Evaluation runner on entire corpus
- [ ] Metric tracking over time
- [ ] Model comparison (GPT-4 vs GPT-4o vs others)
- [ ] Prompt variant A/B testing
- [ ] Quality regressions alerts
- [ ] Automated prompt optimization

**Enabled by:**
- ✅ Evaluation SDK integration
- ✅ Evaluation runner infrastructure

**Needed:**
- [ ] Test dataset creation (50-100 artifacts)
- [ ] Metric dashboards
- [ ] Automated A/B test runner
- [ ] Performance optimization tracking

---

#### **Scenario 5: Production Deployment** (Phase 2)
Run as service with monitoring, retry logic, rate limiting

**Features:**
- [ ] HTTP API server (FastAPI/aiohttp)
- [ ] Queue-based processing
- [ ] Retry logic with exponential backoff
- [ ] Rate limiting & quota management
- [ ] Health checks & monitoring
- [ ] Structured logging
- [ ] Error tracking (Sentry/AppInsights)
- [ ] Performance metrics

**Enabled by:**
- ✅ Async/await in modern agents
- ✅ OpenTelemetry tracing

**Needed:**
- [ ] API server implementation
- [ ] Queue system (Redis/Azure Queue)
- [ ] Health check endpoints
- [ ] Metrics exporters
- [ ] Docker/Kubernetes support

---

#### **Scenario 6: Knowledge Graph Integration** (Phase 3)
Link extracted knowledge into enterprise knowledge graph

**Features:**
- [ ] Entity extraction (concepts, researchers, techniques)
- [ ] Relationship extraction (novel/baseline/builds-on)
- [ ] Graph schema mapping (to customer's KG)
- [ ] Deduplication across artifacts
- [ ] Entity resolution (same concept, different names)
- [ ] Knowledge graph output formats

**Enabled by:**
- ✅ Structured schemas
- [ ] Entity extraction agents
- [ ] Graph output formatters

**Needed:**
- [ ] Entity extraction prompt engineering
- [ ] Relationship extraction logic
- [ ] Graph conversion utilities
- [ ] Entity deduplication strategy

---

#### **Scenario 7: Teams & Copilot Integration** (Phase 3)
Expose extraction as Teams bot or Copilot plugin

**Features:**
- [ ] Teams Bot Framework adapter
- [ ] Copilot Studio custom action
- [ ] Interactive refinement UI
- [ ] Adaptive cards for feedback
- [ ] Notification workflows

**Enabled by:**
- ✅ Adapter pattern in modern_base_agent
- ✅ HTTP API (once built)

**Needed:**
- [ ] Bot Framework handler
- [ ] Copilot action definitions
- [ ] UI/UX for feedback loops

---

#### **Scenario 8: Custom Data Sources** (Phase 3)
Support additional artifact types beyond papers/talks/repos

**Features:**
- [ ] Blog post extraction
- [ ] Video transcript extraction
- [ ] Slack/Teams message thread extraction
- [ ] Internal documentation extraction
- [ ] Pluggable source adapters

**Enabled by:**
- ✅ Agent Framework tool calling
- ✅ MCP integration

**Needed:**
- [ ] Source adapters for each type
- [ ] Generic extractor agent
- [ ] Test datasets for each

---

#### **Scenario 9: Expert-in-the-Loop** (Phase 3)
Human review and feedback refinement

**Features:**
- [ ] Expert review UI
- [ ] Annotation/correction workflow
- [ ] Feedback aggregation
- [ ] Fine-tuning on feedback
- [ ] Human loop metrics

**Enabled by:**
- ✅ Evaluation framework
- ✅ Expert review module

**Needed:**
- [ ] Web UI for review
- [ ] Feedback storage
- [ ] Fine-tuning pipeline

---

## 📅 STAGED TIMELINE

### **MVP (Week 1-2) - Foundation & Testing**
**Goal:** Clean codebase, validate core extraction, basic testing

#### Week 1: Legacy Cleanup
**Hours:** 16h | **Owner:** Platform Engineer

**Deliverables:**
- [ ] Remove legacy agent files (base_agent.py, paper_agent.py, talk_agent.py, repository_agent.py)
- [ ] Update agents/__init__.py to export only modern agents
- [ ] Migrate knowledge_agent.py to use ModernPaperAgent/TalkAgent/RepositoryAgent
- [ ] Archive legacy examples (examples.py → examples_legacy.md)
- [ ] Update all imports in poc_runner.py, poc_workflow.py
- [ ] Create git tag `legacy-cleanup`

**Risk:** Regressions in existing functionality
**Mitigation:** Keep legacy code in git history; run full test suite

#### Week 2: Test Infrastructure
**Hours:** 24h | **Owner:** QA Lead

**Deliverables:**
- [ ] Create tests/ directory structure
- [ ] Write `test_schemas.py` - Validate all 4 schema types
- [ ] Write `test_modern_agents.py` - Unit tests for each agent
- [ ] Create `tests/fixtures/` - Sample artifacts (1 paper, 1 transcript, 1 repo)
- [ ] Write `test_integration_e2e.py` - Full 7-step workflow
- [ ] Achieve 70% code coverage
- [ ] All tests passing

**Success Criteria:**
- All 3 extraction agents can process sample artifacts
- Expert review framework works
- Schema validation catches errors
- CI/CD pipeline validates on PR

**Blockers:** Sample data might be restricted; may need synthetic

---

### **Phase 1 (Week 3-4) - Multi-Artifact & Evaluation**
**Goal:** Enable project-level extraction and quality validation

#### Week 3: Multi-Artifact Processing
**Hours:** 20h | **Owner:** Platform Engineer

**Deliverables:**
- [ ] Enhance poc_workflow.py - Add project grouping logic
- [ ] Complete project_compilation.py - Aggregate and synthesize
- [ ] Write `test_workflows.py` - Test full 7-step workflow
- [ ] Create test dataset (5-10 complete projects)
- [ ] Add artifact deduplication logic
- [ ] Document POC workflow in QUICKSTART.md

**Feature Scope:**
- Batch processing multiple artifacts
- Per-project outputs
- Iteration with retry
- Comprehensive logging

#### Week 4: Evaluation & Iteration
**Hours:** 20h | **Owner:** Data/ML Engineer

**Deliverables:**
- [ ] Write test harness for evaluation module
- [ ] Complete EvaluationRunner implementation
- [ ] Create 20-30 artifact test dataset with quality scores
- [ ] Evaluate current extraction quality
- [ ] Document evaluation metrics and thresholds
- [ ] Create quality dashboard skeleton

**Success Criteria:**
- Can evaluate 30 artifacts and get scored results
- Metrics show extraction quality 3.0+/5.0
- Improvement recommendations documented

---

### **Phase 2 (Week 5-6) - Production Readiness**
**Goal:** Deploy-ready with monitoring, error handling, API

#### Week 5: API & Error Handling
**Hours:** 24h | **Owner:** Backend Engineer

**Deliverables:**
- [ ] Build FastAPI/aiohttp server (api/server.py)
- [ ] Implement 3 endpoints: /extract/paper, /extract/talk, /extract/repo
- [ ] Add comprehensive error handling
- [ ] Add request validation
- [ ] Add rate limiting & quota
- [ ] Write `test_api.py` - API integration tests
- [ ] API documentation (OpenAPI/Swagger)

**Features:**
- Async processing
- Job status endpoint
- Retry logic with exponential backoff
- Structured error responses

#### Week 6: Deployment & Monitoring
**Hours:** 20h | **Owner:** DevOps Engineer

**Deliverables:**
- [ ] Create Dockerfile (multi-stage)
- [ ] Create docker-compose.yml for local testing
- [ ] Create GitHub Actions CI/CD pipeline
- [ ] Add Application Insights integration
- [ ] Create health check endpoints
- [ ] Create deployment guide (Azure Container Apps or AKS)
- [ ] Load testing & performance baseline

**Artifacts:**
- Production-ready container
- Deployment documentation
- Monitoring/alerting setup

---

### **Phase 3 (Week 7+) - Advanced Features**
**Goal:** Extensibility, integration, intelligence

#### Week 7-8: Concurrent Processing
**Hours:** 16h

**Deliverables:**
- [ ] Implement concurrent workflow executor
- [ ] Add multi-model strategy (fast + deep)
- [ ] Benchmark parallel vs sequential
- [ ] Document performance gains

#### Week 9-10: Knowledge Graph Integration
**Hours:** 20h

**Deliverables:**
- [ ] Entity extraction agent
- [ ] Relationship extraction agent
- [ ] Graph schema mapper
- [ ] Output to Neo4j or property graph

#### Week 11+: Custom Sources & Integrations
**Hours:** Ongoing

**Deliverables:**
- [ ] Blog post extractor
- [ ] Video transcript extractor
- [ ] Slack/Teams extraction
- [ ] Copilot Studio integration

---

## 🎯 Success Metrics

### MVP Success (End of Week 2)
- [ ] Zero legacy code paths
- [ ] 100% test pass rate
- [ ] 70%+ code coverage
- [ ] Sample end-to-end extraction: < 30 seconds
- [ ] All 12 schema fields populated correctly
- [ ] Expert review scoring works

### Phase 1 Success (End of Week 4)
- [ ] Multi-artifact projects process correctly
- [ ] Evaluation runner scores 30 artifacts
- [ ] Average quality score ≥ 3.0/5.0
- [ ] Iteration loop improves low scores
- [ ] Full POC workflow documented

### Phase 2 Success (End of Week 6)
- [ ] HTTP API passes contract tests
- [ ] Can handle 10 concurrent requests
- [ ] All errors logged with correlation IDs
- [ ] Deployment successful to staging
- [ ] Monitoring dashboards populated
- [ ] Load test: 1000 requests/minute

### Phase 3 Success (End of Week 10+)
- [ ] 2+ concurrent execution patterns working
- [ ] Knowledge graph export validated
- [ ] 3+ data sources supported
- [ ] Performance optimized: 5-10x throughput

---

## 🚨 Key Dependencies & Risks

### High Risk
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Agent Framework API changes | Medium | High | Pin version; maintain compatibility layer |
| LLM API rate limits | High | Medium | Implement queue + backoff; request increase |
| Test data licensing | Medium | High | Use synthetic data; request permissions early |
| Scope creep on features | High | High | Strict phase gates; document trade-offs |

### Medium Risk
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| PDF parsing failures | Medium | Medium | Fallback to OCR; skip unsupported |
| Transcript encoding issues | Low | Low | Handle UTF-8 + Latin1 fallbacks |
| Schema validation strictness | Medium | Medium | Pydantic with coercion; logging |

### Assumptions
1. **Agent Framework remains stable** - Using preview API
2. **LLM costs are acceptable** - ~$0.01-0.05 per artifact
3. **Sample data is available or can be created** - Needed for testing
4. **Team has Azure/Foundry access** - Required for LLM calls
5. **Production deployment target is clear** - Affects architecture decisions

---

## 📊 Resource Estimate

| Phase | Duration | FTE | Cost* | Dependencies |
|-------|----------|-----|-------|--------------|
| MVP | 2 weeks | 1.5 | $4,500 | None |
| Phase 1 | 2 weeks | 1.5 | $4,500 | MVP complete |
| Phase 2 | 2 weeks | 2.0 | $6,000 | Phase 1 complete |
| Phase 3+ | 4+ weeks | 1.5 | $18,000+ | Phase 2 complete |
| **Total** | **10+ weeks** | **1.7 avg** | **$33,000+** | Staged approach |

*Estimates based on $75/hour contractor rate; adjust for internal staff

---

## 📝 Decision Log

### Decision 1: Remove Legacy Code
**Date:** January 5, 2026
**Rationale:** 
- Modern implementations complete and tested
- Legacy maintenance burden
- Avoids confusion and import errors
**Alternative:** Keep both → rejected (maintenance overhead)
**Status:** Approved for MVP

### Decision 2: Agent Framework as Standard
**Date:** January 5, 2026
**Rationale:**
- Better observability (built-in tracing)
- Tool support out of box
- Multi-agent orchestration ready
- Microsoft-supported
**Alternative:** Keep OpenAI client → rejected (less production ready)
**Status:** Approved

### Decision 3: Evaluation Framework Required
**Date:** January 5, 2026
**Rationale:**
- Spec explicitly requires expert review
- Cannot ship without quality validation
- Drives prompt improvements
**Alternative:** Manual review only → rejected (doesn't scale)
**Status:** Approved for MVP

---

## 🔗 Related Documents

- [MODERNIZATION_GUIDE.md](MODERNIZATION_GUIDE.md) - Architecture deep dive
- [POC_IMPLEMENTATION.md](POC_IMPLEMENTATION.md) - Current implementation status
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Legacy implementations (for reference)
- [QUICKSTART.md](QUICKSTART.md) - Get started guide
- [README.md](README.md) - Project overview

---

## ✍️ Next Steps

1. **Approve Roadmap** - Review this document with stakeholders
2. **Assign MVP Team** - 1-2 engineers for Week 1-2
3. **Create GitHub Issues** - Break down each phase into issues
4. **Setup Project Board** - Track progress
5. **Schedule Reviews** - Weekly sync at phase gates
6. **Kick-off Week 1** - Legacy cleanup sprint

---

**Document Owner:** Platform Engineering
**Last Updated:** January 5, 2026
**Version:** 1.0
