from app.services.simulation_service import (
    get_simulation_state,
    reset_simulation_state,
    start_simulation,
    process_previous_event,
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
    assert state["processed_results"] == {}
    assert state["incident"] is None
    assert state["priority"] is None
    assert state["state"] == "IDLE"
    assert state["changes"] == {}


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
    assert state["current_index"] == -1
    assert state["state"] == "READY"


def test_invalid_simulation_scenario():
    reset_simulation_state()

    try:
        start_simulation("invalid")
        assert False
    except ValueError:
        assert True


def test_previous_at_beginning():
    reset_simulation_state()

    start_simulation("suspicious")

    try:
        process_previous_event()
        assert False
    except ValueError:
        assert True


def test_previous_after_processed_state():
    reset_simulation_state()

    start_simulation("suspicious")

    from app.services import simulation_service

    events = simulation_service._simulation_state["events"]

    simulation_service._simulation_state["current_index"] = 1
    simulation_service._simulation_state["current_event"] = events[1]

    simulation_service._simulation_state["processed_events"] = [
        events[0].event_id,
        events[1].event_id,
    ]

    simulation_service._simulation_state["processed_results"] = {
        events[0].event_id: {
            "event": {
                "event_id": events[0].event_id,
            }
        },
        events[1].event_id: {
            "event": {
                "event_id": events[1].event_id,
            }
        },
    }

    result = process_previous_event()

    assert result["simulation"]["current_index"] == 0

    assert (
        result["simulation"]["current_event"].event_id
        == "SIM-SUS-001"
    )