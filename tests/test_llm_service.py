import pytest

from app.services.llm_service import LLMService


def test_llm_service_disabled_by_default(monkeypatch):
    monkeypatch.setenv(
        "TRACEX_LLM_ENABLED",
        "false",
    )

    monkeypatch.delenv(
        "OPENROUTER_API_KEY",
        raising=False,
    )

    service = LLMService()

    assert service.is_available() is False


def test_llm_service_disabled_without_api_key(monkeypatch):
    monkeypatch.setenv(
        "TRACEX_LLM_ENABLED",
        "true",
    )

    monkeypatch.delenv(
        "OPENROUTER_API_KEY",
        raising=False,
    )

    service = LLMService()

    assert service.is_available() is False


def test_llm_service_requires_configuration(monkeypatch):
    monkeypatch.setenv(
        "TRACEX_LLM_ENABLED",
        "false",
    )

    monkeypatch.delenv(
        "OPENROUTER_API_KEY",
        raising=False,
    )

    service = LLMService()

    with pytest.raises(RuntimeError):
        service.generate_explanation(
            context={
                "incident": {},
                "timeline": [],
                "supporting_evidence": [],
                "mitigating_evidence": [],
                "correlations": [],
            }
        )


def test_prompt_contains_tracex_context(monkeypatch):
    monkeypatch.setenv(
        "TRACEX_LLM_ENABLED",
        "false",
    )

    monkeypatch.delenv(
        "OPENROUTER_API_KEY",
        raising=False,
    )

    service = LLMService()

    context = {
        "incident": {
            "incident_id": "INC-001",
            "status": "HIGH_PRIORITY",
            "priority": 86,
        },
        "timeline": [
            {
                "event_id": "EVT-001",
                "event_type": "login",
            }
        ],
        "supporting_evidence": [
            {
                "description": "Unusual login location"
            }
        ],
        "mitigating_evidence": [],
        "correlations": [],
    }

    prompt = service._build_prompt(context)

    assert "INC-001" in prompt
    assert "HIGH_PRIORITY" in prompt
    assert "86" in prompt
    assert "EVT-001" in prompt
    assert "Unusual login location" in prompt


def test_llm_service_does_not_make_request_when_disabled(
    monkeypatch,
):
    monkeypatch.setenv(
        "TRACEX_LLM_ENABLED",
        "false",
    )

    monkeypatch.setenv(
        "OPENROUTER_API_KEY",
        "fake-test-key",
    )

    service = LLMService()

    assert service.is_available() is False