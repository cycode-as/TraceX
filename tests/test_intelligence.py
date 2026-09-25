from app.intelligence.pipeline import process_event
from app.schemas.event import NormalizedEvent


def test_intelligence_pipeline_contract():

    event = NormalizedEvent(
        event_id="EVT-INT-001",
        timestamp="2026-09-25T09:12:00",
        event_type="login",
        user_id="USR-101",
    )

    historical_context = {
        "user_events": [],
        "device_events": [],
        "related_events": [],
        "existing_incident": None,
    }

    result = process_event(
        event,
        historical_context,
    )

    assert "anomalies" in result
    assert "entities" in result
    assert "correlations" in result
    assert "incident" in result
    assert "evidence" in result
    assert "priority" in result