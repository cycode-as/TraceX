from app.services.simulation_service import (
    get_simulation_state,
    reset_simulation_state,
    start_simulation,
)


def test_start_suspicious_simulation():
    reset_simulation_state()

    state = start_simulation("suspicious")

    assert state["scenario"] == "suspicious"
    assert len(state["events"]) == 6
    assert state["current_index"] == -1
    assert state["current_event"] is None
    assert state["processed_events"] == []
    assert state["state"] == "READY"


def test_start_benign_simulation():
    reset_simulation_state()

    state = start_simulation("benign")

    assert state["scenario"] == "benign"
    assert len(state["events"]) == 4
    assert state["state"] == "READY"


def test_invalid_simulation_scenario():
    reset_simulation_state()

    try:
        start_simulation("invalid")
        assert False
    except ValueError:
        assert True