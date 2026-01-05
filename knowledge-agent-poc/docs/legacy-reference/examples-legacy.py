"""
LEGACY EXAMPLES - Archived January 5, 2026

These examples use the legacy agent implementations (base_agent.py, paper_agent.py, etc.)
which have been removed from the codebase.

For modern examples, see: examples_modern.py

This file is kept for historical reference only.
DO NOT USE - Code will not work with current codebase.
"""

# LEGACY CODE - DO NOT USE
# The following examples use the old synchronous agent API
# which has been replaced by async Agent Framework implementations

# Legacy Example (DEPRECATED):
# from agents import PaperAgent  # ← This import will fail
# agent = PaperAgent(llm_provider="azure-openai")
# artifact = agent.extract("paper.pdf")  # ← Synchronous (blocking)

# Modern Equivalent (USE THIS):
# import asyncio
# from agents import ModernPaperAgent
# from config import get_settings
#
# async def main():
#     settings = get_settings()
#     agent = ModernPaperAgent(settings)
#     artifact = await agent.extract("paper.pdf")  # ← Async (non-blocking)
#
# asyncio.run(main())

# For complete migration guide, see: docs/MIGRATION_LEGACY_TO_MODERN.md
