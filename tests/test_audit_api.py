from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.models.incident import Incident
from app.services.audit_service import create_audit_log


def create_test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )

    return SessionLocal()


def test_get_incident_audit():
    db = create_test_db()

    incident = Incident(
        incident_id="INC-AUDIT-001",
        title="Audit test incident",
        status="INCIDENT_CANDIDATE",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(incident)
    db.commit()

    create_audit_log(
        db=db,
        audit_id="AUD-001",
        incident_id="INC-AUDIT-001",
        action="INCIDENT_CREATED",
        actor="system",
        details={
            "event_id": "EVT-001",
        },
    )

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    client = TestClient(app)

    response = client.get(
        "/api/incidents/INC-AUDIT-001/audit"
    )

    assert response.status_code == 200

    body = response.json()

    assert body["success"] is True
    assert body["error"] is None
    assert len(body["data"]) == 1

    audit = body["data"][0]

    assert audit["audit_id"] == "AUD-001"
    assert audit["incident_id"] == "INC-AUDIT-001"
    assert audit["action"] == "INCIDENT_CREATED"
    assert audit["actor"] == "system"
    assert audit["details"]["event_id"] == "EVT-001"

    app.dependency_overrides.clear()
    db.close()


def test_get_incident_audit_incident_not_found():
    db = create_test_db()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    client = TestClient(app)

    response = client.get(
        "/api/incidents/DOES-NOT-EXIST/audit"
    )

    assert response.status_code == 404

    app.dependency_overrides.clear()
    db.close()