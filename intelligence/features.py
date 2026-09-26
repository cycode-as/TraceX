from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional

from .schemas import NormalizedEvent


@dataclass
class EventFeatures:
    """
    Features extracted from a normalized security event.

    These are intermediate intelligence signals.
    They are not themselves an anomaly or an incident.
    """

    event_id: str
    event_type: str

    hour: int
    day_of_week: int

    has_user: bool
    has_device: bool
    has_ip: bool
    has_location: bool
    has_session: bool
    has_resource: bool

    is_sensitive_resource: bool
    transfer_size_bytes: float

    mfa_failure: bool
    privilege_change: bool
    new_device: bool
    new_location: bool

    metadata: Dict[str, Any]


class FeatureExtractor:
    """
    Converts NormalizedEvent into EventFeatures.
    """

    SENSITIVE_RESOURCE_KEYWORDS = {
        "finance",
        "finance-db",
        "database",
        "admin",
        "admin-console",
        "production",
        "payroll",
        "credentials",
    }

    def extract(self, event: NormalizedEvent) -> EventFeatures:
        """
        Extract deterministic features from one event.
        """

        timestamp = event.timestamp

        metadata = event.metadata or {}

        resource = (event.resource or "").lower()

        transfer_size = self._extract_transfer_size(metadata)

        return EventFeatures(
            event_id=event.event_id,
            event_type=event.event_type,

            hour=timestamp.hour,
            day_of_week=timestamp.weekday(),

            has_user=bool(event.user_id),
            has_device=bool(event.device_id),
            has_ip=bool(event.ip_address),
            has_location=bool(event.location),
            has_session=bool(event.session_id),
            has_resource=bool(event.resource),

            is_sensitive_resource=self._is_sensitive_resource(resource),

            transfer_size_bytes=transfer_size,

            mfa_failure=event.event_type == "mfa_failure",
            privilege_change=event.event_type == "privilege_change",
            new_device=event.event_type == "new_device",
            new_location=event.event_type == "new_location",

            metadata=metadata,
        )

    def _is_sensitive_resource(self, resource: str) -> bool:
        if not resource:
            return False

        return any(
            keyword in resource
            for keyword in self.SENSITIVE_RESOURCE_KEYWORDS
        )

    def _extract_transfer_size(self, metadata: Dict[str, Any]) -> float:
        """
        Extract transfer size from event metadata.

        Supports:
            transfer_size
            transfer_size_bytes
            bytes_transferred
        """

        possible_keys = (
            "transfer_size_bytes",
            "transfer_size",
            "bytes_transferred",
        )

        for key in possible_keys:
            value = metadata.get(key)

            if value is None:
                continue

            try:
                return float(value)
            except (TypeError, ValueError):
                return 0.0

        return 0.0


def extract_features(event: NormalizedEvent) -> EventFeatures:
    """
    Convenience function for feature extraction.
    """

    extractor = FeatureExtractor()

    return extractor.extract(event)