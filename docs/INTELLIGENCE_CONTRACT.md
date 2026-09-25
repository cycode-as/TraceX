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
    historical_context,
)
```

---

# 3. Normalized Event

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

The exact internal representation may change, but the backend must provide relevant historical events and an existing related incident when available.

When an existing incident is available, the backend may provide:

```json
{
  "existing_incident": {
    "incident_id": "INC-7A31F92C",
    "status": "INCIDENT_CANDIDATE"
  }
}
```

The persistent incident identifier is owned by the Backend.

---

# 5. Intelligence Output

The Intelligence pipeline returns:

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

The Intelligence module produces structured reasoning results.

The Backend is responsible for:

* incident ID generation
* database persistence
* linking events to incidents
* persisting evidence
* persisting correlations
* persisting priority
* audit logging

---

# 6. Anomaly

Example:

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

The `correlation_id` identifies the correlation produced by the Intelligence module.

The Backend is responsible for persisting the correlation and its event relationships.

---

# 9. Incident Result

The Intelligence module determines whether the current event contributes to an incident.

Example:

```json
{
  "action": "CREATED",
  "status": "INCIDENT_CANDIDATE"
}
```

Possible actions:

```text
CREATED
UPDATED
NONE
```

Possible statuses:

```text
INCIDENT_CANDIDATE
HIGH_PRIORITY
CONFIRMED
DISMISSED
RESOLVED
```

## Important ownership rule

The Intelligence module does **not** generate the persistent database incident ID.

### New incident

When Intelligence returns:

```json
{
  "action": "CREATED",
  "status": "INCIDENT_CANDIDATE"
}
```

the Backend generates the incident ID.

Example:

```text
INC-7A31F92C
```

The flow is:

```text
Intelligence
    ↓
action = CREATED
    ↓
Backend generates incident_id
    ↓
Backend persists incident
```

### Existing incident

When Intelligence returns:

```json
{
  "action": "UPDATED",
  "status": "HIGH_PRIORITY"
}
```

the Backend uses the related existing incident from the historical context.

Example:

```text
existing_incident
    ↓
INC-7A31F92C
    ↓
Intelligence
    ↓
action = UPDATED
    ↓
Backend updates INC-7A31F92C
```

This keeps persistent database identity under Backend ownership.

---

# 10. Evidence Result

Example:

```json
{
  "evidence_id": "EVD-005",
  "event_id": "EVT-005",
  "type": "SUPPORTING",
  "description": "Privilege change followed sensitive resource access.",
  "impact": "increases_priority"
}
```

Supported evidence types:

```text
SUPPORTING
MITIGATING
CORRELATION
ANOMALY
PROGRESSION
```

Evidence must be based on TraceX events and Intelligence reasoning.

The Intelligence module must not fabricate evidence.

The Backend is responsible for associating persisted evidence with the relevant incident.

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

Priority represents **investigation attention**.

It is not:

* attack probability
* certainty that an attack occurred
* a prediction of malicious intent

Mitigating evidence must be considered where applicable.

---

# 12. Backend Integration Rule

The Backend must treat the Intelligence module as a service/component.

The Backend must not implement the Intelligence algorithms itself.

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
Persistence
  ↓
Database
  ↓
API Response
```

Responsibilities are separated as follows:

```text
Intelligence
    → behavioral analysis
    → anomaly detection
    → entity resolution
    → correlation
    → incident decision
    → evidence generation
    → priority calculation

Backend
    → event ingestion
    → historical context
    → orchestration
    → incident ID generation
    → persistence
    → audit
    → API response

Frontend
    → presentation
    → visualization
    → analyst interaction
```

---

# 13. Incident Processing Rules

## 13.1 CREATED

When Intelligence returns:

```json
{
  "incident": {
    "action": "CREATED",
    "status": "INCIDENT_CANDIDATE"
  }
}
```

the Backend must:

1. Generate a unique `incident_id`.
2. Create the incident.
3. Link the current event to the incident.
4. Persist correlations.
5. Persist evidence.
6. Persist priority when available.
7. Record the operation in the audit trail.

---

## 13.2 UPDATED

When Intelligence returns:

```json
{
  "incident": {
    "action": "UPDATED",
    "status": "HIGH_PRIORITY"
  }
}
```

the Backend must:

1. Identify the existing related incident from historical context.
2. Update the incident.
3. Link the current event to the incident.
4. Persist new correlations.
5. Persist new evidence.
6. Update priority when available.
7. Record the operation in the audit trail.

---

## 13.3 NONE

When Intelligence returns:

```json
{
  "incident": {
    "action": "NONE"
  }
}
```

the Backend must:

1. Keep the event persisted.
2. Not create an incident.
3. Not fabricate evidence.
4. Record normal event processing in the audit trail.

---

# 14. Persistence Principle

The Intelligence module returns structured results.

The Backend converts those results into persistent database records.

The Backend must not silently change the meaning of an Intelligence result.

For example:

```text
Intelligence:
priority = HIGH

Backend:
persist HIGH
```

The Backend must not independently change the result to:

```text
CRITICAL
```

unless an explicitly documented Backend rule requires that transformation.

---

# 15. Failure Handling

If Intelligence processing fails:

* The Backend must not fabricate an intelligence result.
* The error must be logged.
* The API should return an appropriate error response.
* The event should remain traceable.
* The Backend must not create an incident from a failed or incomplete Intelligence result.

---

# 16. Auditability

Every processed event must remain traceable.

Where Intelligence produces:

* anomaly
* correlation
* incident decision
* evidence
* priority

the resulting database records should remain traceable to the relevant event IDs and incident ID.

TraceX should be able to answer:

```text
Why was this incident created?
Which events contributed?
Why were the events connected?
What evidence supported the decision?
What evidence mitigated concern?
Why was the investigation priority assigned?
```

---

# 17. LLM Boundary

The LLM, if used, operates only as an explanation layer.

The LLM may explain:

* incident state
* event relationships
* supporting evidence
* mitigating evidence
* priority factors
* analyst-oriented next steps

The LLM must not:

* detect incidents
* calculate priority
* create evidence
* create correlations
* modify incident state
* generate persistent incident IDs
* replace the Intelligence module
* become the source of truth

---

# 18. Important Principle

> The Intelligence module produces structured evidence and reasoning signals. The Backend orchestrates and persists them. The Frontend presents them. The LLM explains structured TraceX output but does not replace the Intelligence pipeline or become the source of truth.