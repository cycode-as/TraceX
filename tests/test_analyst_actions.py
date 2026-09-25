from datetime import datetime

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def create_test_event():
    event = {
        "event_id": "ACT-TEST-EVENT-001",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "event_type": "login",
        "user_id": "USR-ACTION-001",
        "device_id": "DEV-ACTION-001",
        "ip_address": "10.10.10.10",
        "location": "Indore",
        "session_id": "SES-ACTION-001",
        "resource": None,
        "action": "login",
        "metadata": {},
    }

    response = client.post("/api/events", json=event)

    assert response.status_code in (200, 201)

    return event["event_id"]


def create_test_incident():
    event_id = create_test_event()

    response = client.post(
        "/api/incidents",
        json={
            "incident_id": "INC-ACTION-001",
            "title": "Analyst action test incident",
            "status": "INCIDENT_CANDIDATE",
            "priority": 50,
            "event_ids": [event_id],
        },
    )

    assert response.status_code in (200, 201)

    return response


def test_action_endpoint_exists():
    response = client.post(
        "/api/incidents/INC-NONEXISTENT/action",
        json={
            "action": "INVESTIGATE",
        },
    )

    assert response.status_code == 404


def test_confirm_incident():
    create_test_incident()

    response = client.post(
        "/api/incidents/INC-ACTION-001/action",
        json={
            "action": "CONFIRM",
            "analyst_id": "analyst-001",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["data"]["action"] == "CONFIRM"
    assert data["data"]["incident"]["status"] == "CONFIRMED"


def test_dismiss_requires_reason():
    create_test_incident()

    response = client.post(
        "/api/incidents/INC-ACTION-001/action",
        json={
            "action": "DISMISS",
            "analyst_id": "analyst-001",
        },
    )

    assert response.status_code == 400


def test_dismiss_incident():
    create_test_incident()

    response = client.post(
        "/api/incidents/INC-ACTION-001/action",
        json={
            "action": "DISMISS",
            "reason": "approved_activity",
            "analyst_id": "analyst-001",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["data"]["action"] == "DISMISS"
    assert data["data"]["reason"] == "approved_activity"
    assert data["data"]["incident"]["status"] == "DISMISSED"


def test_escalate_incident():
    create_test_incident()

    response = client.post(
        "/api/incidents/INC-ACTION-001/action",
        json={
            "action": "ESCALATE",
            "analyst_id": "analyst-001",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["data"]["action"] == "ESCALATE"
    assert data["data"]["incident"]["status"] == "HIGH_PRIORITY"


def test_resolve_incident():
    create_test_incident()

    response = client.post(
        "/api/incidents/INC-ACTION-001/action",
        json={
            "action": "RESOLVE",
            "analyst_id": "analyst-001",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["data"]["action"] == "RESOLVE"
    assert data["data"]["incident"]["status"] == "RESOLVED"
    assert data["data"]["incident"]["resolved_at"] is not None


def test_investigate_incident():
    create_test_incident()

    response = client.post(
        "/api/incidents/INC-ACTION-001/action",
        json={
            "action": "INVESTIGATE",
            "analyst_id": "analyst-001",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["data"]["action"] == "INVESTIGATE"
    assert data["data"]["incident"]["status"] == "INCIDENT_CANDIDATE"