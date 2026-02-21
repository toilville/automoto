from microsoft import core


def test_recommend_returns_ranked_items():
    result = core.recommend(["foundry", "agents"], top=2)
    assert len(result) == 2
    assert result[0]["score"] >= result[1]["score"]


def test_explain_for_known_title():
    explanation = core.explain("Foundry Agent Basics", ["foundry"])
    assert "matches your interests" in explanation
