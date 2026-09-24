# TraceX — Intelligence Contract

## 1. Purpose

This document defines the interface between the TraceX backend and the Intelligence module.

The backend should not depend on the internal implementation of intelligence components.

The Intelligence module may internally use:

* feature extraction
* behavioral baselines
* anomaly detection
* entity resolution
* correlation
* incident construction
* evidence generation
* resource criticality
* priority calculation

The backend only depends on the defined input and output contract.

---

# 2. Intelligence Input

The intelligence pipeline receives:

```text
normalized_event
historical_context
```

Conceptual interface:

```python
result = intelligence_pipeline.process(
    normalized_event,
    historical_context
)
```

---

## 3. Normalized Event

The event must follow the `NormalizedEvent` structure defined in `CONTRACTS.md`.

Example:

```json
{
  "event_id": "EVT-005",
  "timestamp": "2026-09-24T09:31:00Z",
  "event_type": "privilege_change",
  "user_id": "USR-101",
  "device_id": "DEV-882",
  "ip_address": "10.0.0.15",
  "location": "Indore",
  "session_id": "SES-001",
  "resource": "finance-db",
  "action": "privilege_change",
  "metadata": {}
}
```

---

# 4. Historical Context

Historical context may contain:

```json
{
  "user_events": [],
  "device_events": [],
  "related_events": [],
  "existing_incident": null
}
```

The exact internal representation may change, but the backend must be able to provide relevant historical events and an existing related incident when available.

---

# 5. Intelligence Output

The intelligence pipeline returns:

```json
{
  "anomalies": [],
  "entities": [],
  "correlations": [],
  "incident": null,
  "evidence": [],
  "priority": null
}
```

---

# 6. Anomaly

```json
{
  "event_id": "EVT-005",
  "is_anomaly": true,
  "score": 0.82,
  "reasons": [
    "Unusual privilege change for user",
    "Occurred shortly after sensitive resource access"
  ]
}
```

`score` represents the anomaly score produced by the detection method.

It must not be presented as attack probability.

---

# 7. Entity

Entities identify important actors or objects associated with events.

Supported initial entity types:

```text
USER
DEVICE
IP
SESSION
RESOURCE
APPLICATION
```

Example:

```json
{
  "entity_id": "DEV-882",
  "entity_type": "DEVICE",
  "value": "DEV-882"
}
```

---

# 8. Correlation

A correlation explains why two or more events are considered related.

Example:

```json
{
  "correlation_id": "COR-004",
  "event_ids": [
    "EVT-004",
    "EVT-005"
  ],
  "reason": "Same user and session; privilege change followed finance database access.",
  "strength": 0.91
}
```

Correlation must expose a reason.

Do not return unexplained relationships.

---

# 9. Incident Result

If the event contributes to an incident:

```json
{
  "incident_id": "INC-001",
  "action": "UPDATED",
  "status": "HIGH_PRIORITY"
}
```

Possible actions:

```text
CREATED
UPDATED
NONE
```

---

# 10. Evidence Result

Example:

```json
{
  "evidence_id": "EVD-005",
  "incident_id": "INC-001",
  "event_id": "EVT-005",
  "type": "SUPPORTING",
  "description": "Privilege change followed sensitive resource access.",
  "impact": "increases_priority"
}
```

---

# 11. Priority Result

Example:

```json
{
  "score": 86,
  "label": "HIGH",
  "factors": {
    "behavioral_anomaly": 24,
    "correlation_strength": 18,
    "asset_criticality": 17,
    "incident_progression": 14,
    "evidence_strength": 13
  }
}
```

Mitigating evidence must be considered where applicable.

---

# 12. Backend Integration Rule

The backend must treat the intelligence module as a service/component.

The backend should NOT implement the intelligence algorithms itself.

Conceptually:

```text
Event
  ↓
Backend
  ↓
Intelligence Pipeline
  ↓
Structured Intelligence Result
  ↓
Backend
  ↓
Database
  ↓
API Response
```

---

# 13. Failure Handling

If intelligence processing fails:

* The backend must not fabricate an intelligence result.
* The error must be logged.
* The API should return an appropriate error response.
* The event should remain traceable.

---

# 14. Important Principle

> The Intelligence module produces structured evidence and reasoning signals. The Backend orchestrates and persists them. The Frontend presents them.

The LLM, if used later, explains structured intelligence output. It does not replace the intelligence pipeline or create evidence.