import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.services.simulation_service import reset_simulation_state


@pytest.fixture
def client():
    """
    Create a completely isolated database and simulation state
    for every API test.
    """

    # Fresh in-memory database for this test.
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    TestingSessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )

    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()

        try:
            yield db
        finally:
            db.close()

    # Reset global simulation state.
    reset_simulation_state()

    # Tell FastAPI to use the test database.
    app.dependency_overrides[get_db] = override_get_db

    test_client = TestClient(app)

    yield test_client

    # Clean up after the test.
    app.dependency_overrides.clear()
    reset_simulation_state()
    engine.dispose()


def test_next_returns_changes(client):
    response = client.post(
        "/api/simulation/start",
        json={"scenario": "suspicious"},
    )

    assert response.status_code == 200

    response = client.post("/api/simulation/next")

    if response.status_code != 200:
        print(response.json())

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "changes" in data["data"]["simulation"]

    changes = data["data"]["simulation"]["changes"]

    assert "event_processed" in changes
    assert "incident_changed" in changes
    assert "priority_changed" in changes
    assert "status_changed" in changes
    assert "new_evidence" in changes
    assert "new_correlations" in changes


def test_previous_returns_changes(client):
    response = client.post(
        "/api/simulation/start",
        json={"scenario": "suspicious"},
    )

    assert response.status_code == 200

    response = client.post("/api/simulation/next")

    if response.status_code != 200:
        print(response.json())

    assert response.status_code == 200

    response = client.post("/api/simulation/next")

    if response.status_code != 200:
        print(response.json())

    assert response.status_code == 200

    response = client.post("/api/simulation/previous")

    if response.status_code != 200:
        print(response.json())

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "changes" in data["data"]["simulation"]

    changes = data["data"]["simulation"]["changes"]

    assert "event_processed" in changes
    assert "incident_changed" in changes
    assert "priority_changed" in changes
    assert "status_changed" in changes
    assert "new_evidence" in changes
    assert "new_correlations" in changes