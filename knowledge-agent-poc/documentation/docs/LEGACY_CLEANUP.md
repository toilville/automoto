# Legacy Code Cleanup Execution Plan

This document provides step-by-step instructions for removing legacy code paths and consolidating to modern Agent Framework implementations.

## Overview

**Goal:** Remove 1,200+ lines of legacy code and 100+ lines of outdated examples
**Timeline:** ~4 hours of work
**Risk Level:** Medium (migration required, but modern code ready)
**Rollback:** Git tag at each phase

## Phase 1: Archive & Backup (30 minutes)

### Step 1: Create archive branch
```bash
cd d:\code\event-agent-example\knowledge-agent-poc
git checkout -b legacy-code-archive
git tag -a legacy-code-before-cleanup -m "Backup of all legacy code before cleanup"
```

### Step 2: Identify all legacy files
**Files to DELETE:**
```
agents/base_agent.py                 (331 lines - core legacy)
agents/paper_agent.py                (290 lines - legacy paper extraction)
agents/talk_agent.py                 (280 lines - legacy talk extraction)
agents/repository_agent.py           (330 lines - legacy repo extraction)
```

**Files to ARCHIVE (move to legacy directory):**
```
examples.py                          (229 lines - old patterns)
quick_test.py                        (60 lines - outdated test)
test_extraction.py                   (300+ lines - needs rewrite)
validate_imports.py                  (50 lines - import check)
```

**Files to DELETE (outdated demos):**
```
refactor_examples.py                 (55 lines - reference implementation)
```

**Files to REWRITE (still needed but use modern agents):**
```
knowledge_agent.py                   (243 lines - CLI entry point)
knowledge_agent_bot.py               (180+ lines - bot integration)
poc_runner.py                        (489 lines - workflow orchestration)
```

## Phase 2: Create Modern Alternatives (2 hours)

These already exist - just need to verify they work:

### ✅ Modern Agents
- `agents/modern_spec_agents.py` - ModernPaperAgent, ModernTalkAgent, ModernRepositoryAgent
- `agents/modern_base_agent.py` - Base framework agent

### ✅ Modern Examples
- `examples_modern.py` - Agent Framework examples
- `MODERNIZATION_GUIDE.md` - Setup and usage guide

### ✅ Modern Test Infrastructure
Need to create (but framework is ready):
- `tests/test_modern_agents.py` - Unit tests for modern agents
- `tests/test_integration_e2e.py` - End-to-end workflow tests
- `tests/test_schemas.py` - Schema validation tests
- `tests/fixtures/` - Sample test data

## Phase 3: Update Imports & Entry Points (1 hour)

### Update `agents/__init__.py`
```python
# BEFORE (exports legacy agents)
from .base_agent import BaseKnowledgeAgent
from .paper_agent import PaperAgent
from .talk_agent import TalkAgent
from .repository_agent import RepositoryAgent

__all__ = [
    "BaseKnowledgeAgent",
    "PaperAgent",
    "TalkAgent",
    "RepositoryAgent",
]

# AFTER (exports only modern agents)
from .modern_base_agent import ModernBaseAgent
from .modern_spec_agents import ModernPaperAgent, ModernTalkAgent, ModernRepositoryAgent

# For backwards compatibility during transition
PaperAgent = ModernPaperAgent
TalkAgent = ModernTalkAgent
RepositoryAgent = ModernRepositoryAgent
BaseKnowledgeAgent = ModernBaseAgent

__all__ = [
    "ModernBaseAgent",
    "ModernPaperAgent",
    "ModernTalkAgent",
    "ModernRepositoryAgent",
    # Backwards compat aliases
    "BaseKnowledgeAgent",
    "PaperAgent",
    "TalkAgent",
    "RepositoryAgent",
]
```

### Update `poc_runner.py` imports
```python
# Change from:
from agents.paper_agent import PaperAgent
from agents.talk_agent import TalkAgent
from agents.repository_agent import RepositoryAgent

# To:
from agents import ModernPaperAgent, ModernTalkAgent, ModernRepositoryAgent
```

### Update `poc_workflow.py` imports
Same pattern as poc_runner.py

### Update `knowledge_agent.py` imports
```python
# Change from:
from agents import PaperAgent, TalkAgent, RepositoryAgent

# To:
from agents import ModernPaperAgent as PaperAgent, ModernTalkAgent as TalkAgent, ModernRepositoryAgent as RepositoryAgent
```

### Update `knowledge_agent_bot.py` imports
Same pattern as knowledge_agent.py

## Phase 4: Delete Legacy Code (1.5 hours)

### Step 1: Delete agent files
```bash
rm agents/base_agent.py
rm agents/paper_agent.py
rm agents/talk_agent.py
rm agents/repository_agent.py
```

### Step 2: Delete outdated example files
```bash
rm refactor_examples.py
rm quick_test.py
```

### Step 3: Archive to legacy directory (for reference)
```bash
# Create legacy reference directory
mkdir -p docs/legacy-reference

# Copy for historical reference (no imports)
cp examples.py docs/legacy-reference/examples-pre-modernization.py
cp test_extraction.py docs/legacy-reference/test_extraction-old.py
cp validate_imports.py docs/legacy-reference/validate_imports-old.py

# Then delete originals
rm examples.py
rm test_extraction.py
rm validate_imports.py
```

## Phase 5: Verify & Test (Varies)

### Step 1: Check for broken imports
```bash
python validate_imports.py  # Wait - we deleted this
# Instead, use:
python -c "from agents import PaperAgent, TalkAgent, RepositoryAgent; print('✓ Imports work')"
```

### Step 2: Run quick smoke tests
```bash
# Test that agents can be imported
python -c "from agents import ModernPaperAgent; print('✓ ModernPaperAgent imported')"
python -c "from agents import ModernTalkAgent; print('✓ ModernTalkAgent imported')"
python -c "from agents import ModernRepositoryAgent; print('✓ ModernRepositoryAgent imported')"

# Test backwards compatibility aliases
python -c "from agents import PaperAgent; print('✓ Backwards compat alias works')"
```

### Step 3: Run test suite (once created)
```bash
pytest tests/ -v --tb=short
```

### Step 4: Verify poc_runner.py works
```bash
python poc_runner.py --help  # Should show CLI help
```

## Phase 6: Create Migration Guide (1 hour)

Create `docs/MIGRATION_LEGACY_TO_MODERN.md` with:

```markdown
# Migration Guide: Legacy to Modern Agents

## For Users

### Old Code (Legacy - DELETE)
\`\`\`python
from agents import PaperAgent

agent = PaperAgent(llm_provider="azure-openai")
artifact = agent.extract("paper.pdf")
\`\`\`

### New Code (Modern - USE)
\`\`\`python
import asyncio
from agents import ModernPaperAgent
from config import get_settings

async def main():
    settings = get_settings()
    agent = ModernPaperAgent(settings)
    artifact = await agent.extract("paper.pdf")

asyncio.run(main())
\`\`\`

## Key Differences

| Aspect | Legacy | Modern |
|--------|--------|--------|
| Base Class | BaseKnowledgeAgent | Agent Framework |
| Async | No (sync) | Yes (async/await) |
| Tracing | Manual logging | Built-in OpenTelemetry |
| Tool Support | None | Full tool calling |
| Multi-agent | Manual | Built-in workflows |
| Tests | None | Comprehensive |

## Migration Checklist

- [ ] Update imports (PaperAgent → ModernPaperAgent)
- [ ] Change to async/await
- [ ] Enable tracing via observability module
- [ ] Test with new syntax
- [ ] Update CI/CD scripts
- [ ] Run test suite
\`\`\`

## Checklist for Cleanup

- [ ] Phase 1: Archive & Backup
  - [ ] Create archive branch
  - [ ] Create git tag
  - [ ] List all files to delete/move

- [ ] Phase 2: Verify Modern Alternatives
  - [ ] Check modern_spec_agents.py is complete
  - [ ] Check examples_modern.py has all patterns
  - [ ] Verify MODERNIZATION_GUIDE.md is current

- [ ] Phase 3: Update Imports
  - [ ] Update agents/__init__.py
  - [ ] Update poc_runner.py
  - [ ] Update poc_workflow.py
  - [ ] Update knowledge_agent.py
  - [ ] Update knowledge_agent_bot.py
  - [ ] Search codebase for remaining legacy imports

- [ ] Phase 4: Delete Legacy Code
  - [ ] Delete agent files (base, paper, talk, repo)
  - [ ] Delete outdated examples
  - [ ] Archive to docs/legacy-reference/
  - [ ] Remove from git

- [ ] Phase 5: Verify & Test
  - [ ] Test imports work
  - [ ] Run smoke tests
  - [ ] Run full test suite
  - [ ] Verify poc_runner.py works
  - [ ] Check no remaining import errors

- [ ] Phase 6: Documentation
  - [ ] Create migration guide
  - [ ] Update QUICKSTART.md
  - [ ] Update README.md
  - [ ] Add migration section to MODERNIZATION_GUIDE.md
  - [ ] Document deprecated files in docs/

- [ ] Phase 7: Git & Tagging
  - [ ] Commit cleanup: "chore: remove legacy agent implementations"
  - [ ] Create git tag: legacy-cleanup-complete
  - [ ] Create PR for review
  - [ ] Merge to main

## Rollback Plan

If issues arise:

```bash
# Rollback to before cleanup
git reset --hard legacy-code-before-cleanup

# Or just restore specific files
git checkout legacy-code-before-cleanup -- agents/base_agent.py
```

## Timeline

| Phase | Duration | Owner |
|-------|----------|-------|
| 1: Archive | 30 min | Engineer |
| 2: Verify | 30 min | Engineer |
| 3: Update Imports | 1 hour | Engineer |
| 4: Delete | 30 min | Engineer |
| 5: Test | 1-2 hours | QA |
| 6: Documentation | 1 hour | Tech Lead |
| 7: PR Review & Merge | 1 hour | Tech Lead |
| **Total** | **5-6 hours** | |

## Success Criteria

✅ All legacy files deleted (except archived copies)
✅ Zero import errors
✅ All smoke tests pass
✅ poc_runner.py executable
✅ Modern examples work
✅ Migration guide available
✅ Git history preserved
✅ No breaking changes to public APIs (use backwards compat aliases)
