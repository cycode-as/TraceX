from app.schemas.event import EventType, NormalizedEvent


def test_valid_event():
    event = NormalizedEvent(
        event_id="EVT-001",
        timestamp="2026-09-24T09:12:00",
        event_type="login",
        user_id="USR-101",
        device_id="DEV-882",
        ip_address="192.168.1.10",
        location="Indore",
        session_id="SES-001",
        action="login",
    )

    assert event.event_id == "EVT-001"
    assert event.event_type == EventType.LOGIN


def test_optional_fields():
    event = NormalizedEvent(
        event_id="EVT-002",
        timestamp="2026-09-24T09:18:00",
        event_type="mfa_failure",
    )

    assert event.user_id is None
    assert event.device_id is None


def test_metadata():
    event = NormalizedEvent(
        event_id="EVT-003",
        timestamp="2026-09-25T09:25:00",
        event_type="resource_access",
        metadata={
            "application": "finance-app",
            "method": "read",
        },
    )

    assert event.metadata["application"] == "finance-app"