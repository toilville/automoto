"""
MSR Channel Onboarding Questionnaire

Interactive wizard that helps partners choose the right channel template.
Compatible with vibekit CLI: `vibekit install msr-channel`

Powered by vibe-kit.
"""
from dataclasses import dataclass


@dataclass
class Question:
    id: str
    prompt: str
    options: list[str]
    descriptions: list[str]


QUESTIONS = [
    Question(
        id="role",
        prompt="What is your role?",
        options=["producer", "consumer"],
        descriptions=[
            "I want to connect a NEW platform (Slack, WhatsApp, portal) to the MSR Agent",
            "I want to EMBED MSR Agent capabilities into my existing app/site",
        ],
    ),
    # Producer questions
    Question(
        id="producer_type",
        prompt="What kind of platform integration?",
        options=["express", "bot-framework", "webhook"],
        descriptions=[
            "HTTP server with REST endpoints (Express/Fastify — most common)",
            "Bot Framework Activity-based (Teams, M365, Copilot Studio)",
            "Simple webhook receiver (minimal, no streaming)",
        ],
    ),
    Question(
        id="streaming",
        prompt="Does your platform support streaming responses?",
        options=["yes", "no"],
        descriptions=[
            "SSE or WebSocket streaming (real-time token-by-token)",
            "Request-response only (buffered complete responses)",
        ],
    ),
    # Consumer questions
    Question(
        id="consumer_type",
        prompt="How do you want to consume?",
        options=["react-embed", "api-client", "direct-line-embed"],
        descriptions=[
            "Embed React chat UI (vendor @msr/chat-ui + @msr/data-client)",
            "Call REST API directly (TypeScript, Python, curl examples)",
            "Drop-in web chat widget (iframe/script tag, no framework needed)",
        ],
    ),
]


def ask(question: Question) -> str:
    """Prompt the user to select from a list of options."""
    print(f"\n{'─' * 60}")
    print(f"  {question.prompt}\n")
    for i, (opt, desc) in enumerate(
        zip(question.options, question.descriptions), 1
    ):
        print(f"  [{i}] {opt}")
        print(f"      {desc}\n")

    while True:
        try:
            choice = input("  Select (number): ").strip()
            idx = int(choice) - 1
            if 0 <= idx < len(question.options):
                selected = question.options[idx]
                print(f"  → {selected}")
                return selected
        except (ValueError, IndexError):
            pass
        print("  Invalid selection, try again.")


def get_question(qid: str) -> Question:
    return next(q for q in QUESTIONS if q.id == qid)


def run_questionnaire() -> dict:
    """Run the interactive questionnaire and return selections."""
    print("=" * 60)
    print("  MSR Channel Onboarding Kit")
    print("  Powered by vibe-kit 🎯")
    print("=" * 60)

    answers: dict[str, str] = {}

    # Step 1: Producer or Consumer?
    answers["role"] = ask(get_question("role"))

    if answers["role"] == "producer":
        # Step 2a: What kind of producer?
        answers["template"] = ask(get_question("producer_type"))
        answers["streaming"] = ask(get_question("streaming"))

        template_map = {
            "express": "templates/producer/express-channel",
            "bot-framework": "templates/producer/bot-framework-channel",
            "webhook": "templates/producer/webhook-channel",
        }
        answers["template_path"] = template_map[answers["template"]]

    else:
        # Step 2b: What kind of consumer?
        answers["template"] = ask(get_question("consumer_type"))

        template_map = {
            "react-embed": "templates/consumer/react-embed",
            "api-client": "templates/consumer/api-client",
            "direct-line-embed": "templates/consumer/direct-line-embed",
        }
        answers["template_path"] = template_map[answers["template"]]

    # Summary
    print(f"\n{'=' * 60}")
    print(f"  ✅ Selected: {answers['role']} / {answers['template']}")
    print(f"  📁 Template: {answers['template_path']}")
    print(f"\n  Next steps:")
    print(f"  1. Copy the template to your project")
    print(f"  2. Replace __CHANNEL_NAME__ placeholders")
    print(f"  3. See the template's README.md for setup checklist")
    print(f"{'=' * 60}")

    return answers


if __name__ == "__main__":
    run_questionnaire()
