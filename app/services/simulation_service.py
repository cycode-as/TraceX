from typing import Any

from sqlalchemy.orm import Session

from app.simulation.scenarios import get_scenario
from app.services.processing_service import process_incoming_event


_simulation_state: dict[str, Any] = {
    "scenario": None,
    "events": [],
    "current_index": -1,
    "current_event": None,
    "processed_events": [],
    "processed_results": {},
    "incident": None,
    "priority": None,
    "state": "IDLE",
    "changes": {},
}


def get_simulation_state() -> dict[str, Any]:
    return _simulation_state.copy()


def reset_simulation_state() -> dict[str, Any]:
    _simulation_state.update(
        {
            "scenario": None,
            "events": [],
            "current_index": -1,
            "current_event": None,
            "processed_events": [],
            "processed_results": {},
            "incident": None,
            "priority": None,
            "state": "IDLE",
            "changes": {},
        }
    )

    return get_simulation_state()


def start_simulation(scenario: str) -> dict[str, Any]:
    events = get_scenario(scenario)

    _simulation_state.update(
        {
            "scenario": scenario,
            "events": events,
            "current_index": -1,
            "current_event": None,
            "processed_events": [],
            "processed_results": {},
            "incident": None,
            "priority": None,
            "state": "READY",
            "changes": {},
        }
    )

    return get_simulation_state()


def process_next_event(db: Session) -> dict[str, Any]:
    if _simulation_state["scenario"] is None:
        raise ValueError("Simulation has not been started")

    next_index = _simulation_state["current_index"] + 1
    events = _simulation_state["events"]

    if next_index >= len(events):
        raise ValueError("Simulation has no more events")

    event = events[next_index]

    # If this event was already processed earlier,
    # reuse its existing result instead of inserting it again.
    if event.event_id in _simulation_state["processed_results"]:
        result = _simulation_state["processed_results"][
            event.event_id
        ]
    else:
        result = process_incoming_event(
            db,
            event,
        )

        _simulation_state["processed_results"][
            event.event_id
        ] = result

        if event.event_id not in _simulation_state["processed_events"]:
            _simulation_state["processed_events"].append(
                event.event_id
            )

    _simulation_state["current_index"] = next_index
    _simulation_state["current_event"] = event
    _simulation_state["changes"] = result
    _simulation_state["state"] = "PROCESSING"

    return {
        "simulation": get_simulation_state(),
        "processing_result": result,
    }


def process_previous_event() -> dict[str, Any]:
    if _simulation_state["scenario"] is None:
        raise ValueError("Simulation has not been started")

    current_index = _simulation_state["current_index"]

    if current_index <= -1:
        raise ValueError("Simulation is already at the beginning")

    previous_index = current_index - 1

    _simulation_state["current_index"] = previous_index

    if previous_index == -1:
        _simulation_state["current_event"] = None
        _simulation_state["changes"] = {}
        _simulation_state["state"] = "READY"

    else:
        event = _simulation_state["events"][previous_index]

        _simulation_state["current_event"] = event
        _simulation_state["changes"] = (
            _simulation_state["processed_results"].get(
                event.event_id,
                {},
            )
        )
        _simulation_state["state"] = "PROCESSING"

    return {
        "simulation": get_simulation_state(),
    }