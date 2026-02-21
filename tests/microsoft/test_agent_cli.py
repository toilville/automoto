from microsoft.agent import build_parser, run_recommend


def test_recommend_command_parses_and_runs():
    parser = build_parser()
    args = parser.parse_args(["recommend", "--interests", "foundry,agents", "--top", "2"])
    output = run_recommend(args)
    assert "recommendations" in output
    assert len(output["recommendations"]) == 2
