from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.correlation import Correlation
from app.models.correlation_event import CorrelationEvent
from app.models.event import Event
from app.models.incident import Incident
from app.models.incident_event import IncidentEvent
from app.services.graph_service import get_incident_graph


def test_get_incident_graph():

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    incident = Incident(
        incident_id="INC-GRAPH-001",
        title="Suspicious account activity",
        status="INCIDENT_CANDIDATE",
        priority_score=80.0,
        priority_label="HIGH",
    )

    event_1 = Event(
        event_id="EVT-GRAPH-001",
        timestamp=datetime.fromisoformat(
            "2026-09-25T10:00:00"
        ),
        event_type="login",
        user_id="USR-001",
        device_id="DEV-001",
        event_metadata={},
    )

    event_2 = Event(
        event_id="EVT-GRAPH-002",
        timestamp=datetime.fromisoformat(
            "2026-09-25T10:05:00"
        ),
        event_type="resource_access",
        user_id="USR-001",
        device_id="DEV-001",
        resource="finance_db",
        event_metadata={},
    )

    correlation = Correlation(
        correlation_id="CORR-GRAPH-001",
        reason="Same user and device",
        strength=0.90,
    )

    incident_event_1 = IncidentEvent(
        incident_id="INC-GRAPH-001",
        event_id="EVT-GRAPH-001",
        relationship="primary",
    )

    incident_event_2 = IncidentEvent(
        incident_id="INC-GRAPH-001",
        event_id="EVT-GRAPH-002",
        relationship="progression",
    )

    correlation_event_1 = CorrelationEvent(
        correlation_id="CORR-GRAPH-001",
        event_id="EVT-GRAPH-001",
        relationship="source",
    )

    correlation_event_2 = CorrelationEvent(
        correlation_id="CORR-GRAPH-001",
        event_id="EVT-GRAPH-002",
        relationship="related",
    )

    db.add_all(
        [
            incident,
            event_1,
            event_2,
            correlation,
            incident_event_1,
            incident_event_2,
            correlation_event_1,
            correlation_event_2,
        ]
    )

    db.commit()

    graph = get_incident_graph(
        db,
        "INC-GRAPH-001",
    )

    assert "nodes" in graph
    assert "edges" in graph

    node_ids = {
        node["id"]
        for node in graph["nodes"]
    }

    assert "EVT-GRAPH-001" in node_ids
    assert "EVT-GRAPH-002" in node_ids
    assert "CORR-GRAPH-001" in node_ids

    assert len(graph["nodes"]) == 3

    assert len(graph["edges"]) == 4

    db.close()