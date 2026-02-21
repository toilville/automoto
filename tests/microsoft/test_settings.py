from microsoft.settings import Settings


def test_foundry_errors_when_not_set():
    settings = Settings()
    errors = settings.get_foundry_errors()
    assert isinstance(errors, list)
    assert "FOUNDRY_PROJECT_ENDPOINT not set" in errors
