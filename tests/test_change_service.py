from app.services.change_service import calculate_changes


def test_no_previous_result_reports_current_state():
    current_result = {
        "incident": {
            "incident_id": "INC-001",
            "status": "INCIDENT_CANDIDATE",
        },
        "priority": {
            "score": 40,
            "label": "MEDIUM",
        },
        "evidence": [
            {
                "evidence_id": "EVD-001",
                "type": "ANOMALY",
                "description": "Unusual login detected",
            }
        ],
        "correlations": [
            {
                "correlation_id": "COR-001",
                "reason": "Same user and device",
                "strength": 0.9,
            }
        ],
    }

    changes = calculate_changes(
        previous_result={},
        current_result=current_result,
    )

    assert changes["event_processed"] is True
    assert changes["incident_changed"] is True
    assert changes["priority_changed"] is True
    assert changes["status_changed"] is True

    assert changes["new_evidence"] == current_result["evidence"]
    assert changes["new_correlations"] == current_result["correlations"]

    assert changes["current_priority"] == current_result["priority"]
    assert changes["current_status"] == "INCIDENT_CANDIDATE"


def test_incremental_changes_are_detected():
    previous_result = {
        "incident": {
            "incident_id": "INC-001",
            "status": "INCIDENT_CANDIDATE",
        },
        "priority": {
            "score": 40,
            "label": "MEDIUM",
        },
        "evidence": [
            {
                "evidence_id": "EVD-001",
                "type": "ANOMALY",
                "description": "Unusual login detected",
            }
        ],
        "correlations": [
            {
                "correlation_id": "COR-001",
                "reason": "Same user and device",
                "strength": 0.9,
            }
        ],
    }

    current_result = {
        "incident": {
            "incident_id": "INC-001",
            "status": "HIGH_PRIORITY",
        },
        "priority": {
            "score": 80,
            "label": "HIGH",
        },
        "evidence": [
            {
                "evidence_id": "EVD-001",
                "type": "ANOMALY",
                "description": "Unusual login detected",
            },
            {
                "evidence_id": "EVD-002",
                "type": "PROGRESSION",
                "description": "Privilege change followed resource access",
            },
        ],
        "correlations": [
            {
                "correlation_id": "COR-001",
                "reason": "Same user and device",
                "strength": 0.9,
            },
            {
                "correlation_id": "COR-002",
                "reason": "Events occurred within the same session",
                "strength": 0.8,
            },
        ],
    }

    changes = calculate_changes(
        previous_result=previous_result,
        current_result=current_result,
    )

    assert changes["event_processed"] is True

    assert changes["incident_changed"] is True

    assert changes["priority_changed"] is True
    assert changes["previous_priority"] == previous_result["priority"]
    assert changes["current_priority"] == current_result["priority"]

    assert changes["status_changed"] is True
    assert changes["previous_status"] == "INCIDENT_CANDIDATE"
    assert changes["current_status"] == "HIGH_PRIORITY"

    assert changes["new_evidence"] == [
        {
            "evidence_id": "EVD-002",
            "type": "PROGRESSION",
            "description": "Privilege change followed resource access",
        }
    ]

    assert changes["new_correlations"] == [
        {
            "correlation_id": "COR-002",
            "reason": "Events occurred within the same session",
            "strength": 0.8,
        }
    ]


def test_no_structural_changes_are_reported():
    result = {
        "incident": {
            "incident_id": "INC-001",
            "status": "INCIDENT_CANDIDATE",
        },
        "priority": {
            "score": 40,
            "label": "MEDIUM",
        },
        "evidence": [
            {
                "evidence_id": "EVD-001",
                "type": "ANOMALY",
                "description": "Unusual login detected",
            }
        ],
        "correlations": [
            {
                "correlation_id": "COR-001",
                "reason": "Same user and device",
                "strength": 0.9,
            }
        ],
    }

    changes = calculate_changes(
        previous_result=result,
        current_result=result,
    )

    assert changes["event_processed"] is True
    assert changes["incident_changed"] is False
    assert changes["priority_changed"] is False
    assert changes["status_changed"] is False
    assert changes["new_evidence"] == []
    assert changes["new_correlations"] == []