from microsoft.adapters.bot_adapter import BotAdapter
from microsoft.adapters.power_adapter import PowerAdapter


def test_bot_adapter_recommend():
    adapter = BotAdapter()
    result = adapter.handle_tool_call("recommend", {"interests": ["foundry"], "top": 1})
    assert result["status"] == "success"
    assert result["channel"] == "bot"


def test_power_adapter_explain():
    adapter = PowerAdapter()
    result = adapter.handle_tool_call(
        "explain",
        {"title": "Foundry Agent Basics", "interests": ["foundry"]},
    )
    assert result["Status"] == "success"
    assert result["Adapter"] == "power"
