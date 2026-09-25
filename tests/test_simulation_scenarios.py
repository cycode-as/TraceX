from app.services.simulation_service import (
    get_simulation_state,
    reset_simulation_state,
)


def test_initial_simulation_state():
    state = get_simulation_state()

    assert state["scenario"] is None
    assert state["current_index"] == -1
    assert state["current_event"] is None
    assert state["processed_events"] == []
    assert state["state"] == "IDLE"


def test_reset_simulation_state():
    state = reset_simulation_state()

    assert state["scenario"] is None
    assert state["events"] == []
    assert state["current_index"] == -1
    assert state["current_event"] is None
    assert state["processed_events"] == []
    assert state["incident"] is None
    assert state["priority"] is None
    assert state["state"] == "IDLE"
    assert state["changes"] == {}