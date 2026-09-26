# TraceX — Shared Data Contracts

## 1. Purpose

This document defines the common data structures used across the TraceX backend, database, intelligence, and frontend.

All modules should follow these structures when exchanging data.

---

## 2. NormalizedEvent

Every telemetry source must be converted into this structure before entering the intelligence pipeline.

### Fields

| Field        | Type     | Required | Description                           |
| ------------ | -------- | -------: | ------------------------------------- |
| `event_id`   | string   |      Yes | Unique event identifier               |
| `timestamp`  | datetime |      Yes | Event occurrence time                 |
| `event_type` | string   |      Yes | Type of security/application event    |
| `user_id`    | string   |       No | User associated with event            |
| `device_id`  | string   |       No | Device associated with event          |
| `ip_address` | string   |       No | Source IP address                     |
| `location`   | string   |       No | Location associated with event        |
| `session_id` | string   |       No | Session identifier                    |
| `resource`   | string   |       No | Accessed resource                     |
| `action`     | string   |       No | Action performed                      |
| `metadata`   | object   |       No | Additional event-specific information |

### Example

```json
{
  "event_id": "EVT-001",
  "timestamp": "2026-09-24T09:12:00Z",
  "event_type": "login",
  "user_id": "USR-101",
  "device_id": "DEV-882",
  "ip_address": "10.0.0.15",
  "location": "Indore",
  "session_id": "SES-001",
  "resource": null,
  "action": "login",
  "metadata": {
    "authentication_method": "password"
  }
}
```

### Allowed event types

The initial implementation may support:

```text
login
logout
mfa_failure
mfa_success
new_device
new_location
resource_access
privilege_change
password_change
api_access
large_transfer
file_download
admin_action
session_start
session_end
```

New event types may be added later without changing the core event structure.

---

# 3. Incident

An incident represents a group of related events that TraceX considers worthy of investigation.

| Field         | Type          | Required | Description                     |
| ------------- | ------------- | -------: | ------------------------------- |
| `incident_id` | string        |      Yes | Unique incident identifier      |
| `title`       | string        |      Yes | Human-readable incident title   |
| `status`      | string        |      Yes | Current incident state          |
| `priority`    | number        |      Yes | Investigation priority          |
| `created_at`  | datetime      |      Yes | Incident creation time          |
| `updated_at`  | datetime      |      Yes | Last update time                |
| `event_ids`   | array[string] |      Yes | Events associated with incident |

### Allowed status values

```text
INCIDENT_CANDIDATE
HIGH_PRIORITY
CONFIRMED
DISMISSED
RESOLVED
```

### Example

```json
{
  "incident_id": "INC-001",
  "title": "Suspicious account activity",
  "status": "HIGH_PRIORITY",
  "priority": 86,
  "created_at": "2026-09-24T09:12:00Z",
  "updated_at": "2026-09-24T09:35:00Z",
  "event_ids": [
    "EVT-001",
    "EVT-002",
    "EVT-003",
    "EVT-004",
    "EVT-005",
    "EVT-006"
  ]
}
```

---

# 4. Evidence

Evidence explains why an incident was created or why its priority changed.

| Field         | Type   | Required | Description                |
| ------------- | ------ | -------: | -------------------------- |
| `evidence_id` | string |      Yes | Unique evidence identifier |
| `incident_id` | string |      Yes | Related incident           |
| `event_id`    | string |       No | Source event               |
| `type`        | string |      Yes | Evidence category          |
| `description` | string |      Yes | Human-readable explanation |
| `impact`      | string |      Yes | Effect on investigation    |

### Evidence types

```text
SUPPORTING
MITIGATING
CORRELATION
ANOMALY
PROGRESSION
```

### Example

```json
{
  "evidence_id": "EVD-005",
  "incident_id": "INC-001",
  "event_id": "EVT-005",
  "type": "SUPPORTING",
  "description": "Privilege change occurred after access to the finance resource.",
  "impact": "increases_priority"
}
```

---

# 5. Priority

Priority represents the level of analyst attention required.

It is NOT attack probability.

| Field     | Type   | Required |
| --------- | ------ | -------: |
| `score`   | number |      Yes |
| `label`   | string |      Yes |
| `factors` | object |      Yes |

### Score

Range:

```text
0–100
```

### Labels

```text
LOW
MEDIUM
HIGH
CRITICAL
```

### Example

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

The factors should explain the score rather than hiding the reasoning.

---

# 6. AnalystAction

Actions are performed by the human analyst through the frontend.

### Allowed actions

```text
INVESTIGATE
CONFIRM
DISMISS
ESCALATE
RESOLVE
```

### Optional dismissal reasons

```text
false_positive
approved_activity
known_admin
maintenance
other
```

### Example

```json
{
  "action": "INVESTIGATE",
  "reason": null
}
```

For dismissal:

```json
{
  "action": "DISMISS",
  "reason": "approved_activity"
}
```

---

# 7. General Rules

1. `event_id` must be unique.
2. Timestamps must use ISO 8601 datetime format.
3. Backend is the source of truth for incident state.
4. Frontend must not independently calculate incident priority.
5. Frontend must not modify intelligence results directly.
6. Intelligence must return structured data.
7. Evidence must reference its source whenever possible.
8. Priority is investigation priority, not attack probability.
9. An anomaly does not automatically mean an incident.
10. All important state changes should be auditable.