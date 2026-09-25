from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.services.incident_service import (
    create_incident,
    get_incident,
)


def test_create_and_get_incident():

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    incident = create_incident(
        db=db,
        incident_id="INC-001",
        title="Suspicious account activity",
        status="INCIDENT_CANDIDATE",
        priority_score=72.0,
        priority_label="HIGH",
    )

    assert incident.incident_id == "INC-001"
    assert incident.title == "Suspicious account activity"
    assert incident.status == "INCIDENT_CANDIDATE"
    assert incident.priority_score == 72.0
    assert incident.priority_label == "HIGH"

    fetched = get_incident(
        db,
        "INC-001",
    )

    assert fetched is not None
    assert fetched.incident_id == "INC-001"

    db.close()