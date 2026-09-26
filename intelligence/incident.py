from typing import List

from .schemas import (
    AnomalyResult,
    CorrelationResult,
    HistoricalContext,
    IncidentResult,
    NormalizedEvent,
)


class IncidentDecisionEngine:
    """
    Determines whether suspicious activity should become
    an incident candidate.

    This module does NOT:
    - calculate investigation priority
    - determine attack probability
    - write to the database
    - modify backend incident state

    It only produces a structured intelligence decision.
    """

    ANOMALY_THRESHOLD = 0.40
    STRONG_ANOMALY_THRESHOLD = 0.70
    CORRELATION_THRESHOLD = 0.50

    def decide(
        self,
        event: NormalizedEvent,
        anomaly: AnomalyResult,
        correlations: List[CorrelationResult],
        context: HistoricalContext,
    ) -> IncidentResult:
        """
        Decide whether the current activity should create,
        update, or leave an incident unchanged.
        """

        # If Backend already supplied an existing incident,
        # suspicious activity should update that incident
        # rather than create a duplicate.
        if context.existing_incident:
            return self._existing_incident_decision(
                event=event,
                anomaly=anomaly,
                correlations=correlations,
            )

        # An event that is not anomalous does not create
        # an incident candidate.
        if not anomaly.is_anomaly:
            return IncidentResult(
                action="NO_INCIDENT",
                status=None,
                reason="No significant behavioral anomaly detected.",
                event_ids=[],
            )

        strong_correlations = [
            correlation
            for correlation in correlations
            if correlation.strength >= self.CORRELATION_THRESHOLD
        ]

        # A strong anomaly can independently justify
        # creating an incident candidate.
        if anomaly.score >= self.STRONG_ANOMALY_THRESHOLD:
            return IncidentResult(
                action="CREATE",
                status="INCIDENT_CANDIDATE",
                reason="Strong behavioral anomaly detected.",
                event_ids=[event.event_id],
            )

        # A moderate anomaly supported by meaningful
        # correlation should become an incident candidate.
        if (
            anomaly.score >= self.ANOMALY_THRESHOLD
            and strong_correlations
        ):
            return IncidentResult(
                action="CREATE",
                status="INCIDENT_CANDIDATE",
                reason=(
                    "Behavioral anomaly is supported by "
                    "correlated activity."
                ),
                event_ids=self._collect_event_ids(
                    event=event,
                    correlations=strong_correlations,
                ),
            )

        return IncidentResult(
            action="NO_INCIDENT",
            status=None,
            reason=(
                "Anomaly was detected but did not meet "
                "incident decision criteria."
            ),
            event_ids=[],
        )

    def _existing_incident_decision(
        self,
        event: NormalizedEvent,
        anomaly: AnomalyResult,
        correlations: List[CorrelationResult],
    ) -> IncidentResult:
        """
        Decide whether suspicious activity should update
        an existing incident.
        """

        strong_correlation = any(
            correlation.strength >= self.CORRELATION_THRESHOLD
            for correlation in correlations
        )

        if anomaly.is_anomaly or strong_correlation:
            return IncidentResult(
                action="UPDATE",
                status="INCIDENT_CANDIDATE",
                reason=(
                    "Suspicious activity is related to "
                    "an existing incident."
                ),
                event_ids=self._collect_event_ids(
                    event=event,
                    correlations=correlations,
                ),
            )

        return IncidentResult(
            action="NO_CHANGE",
            status=None,
            reason=(
                "Current activity does not provide "
                "sufficient evidence to update the incident."
            ),
            event_ids=[],
        )

    def _collect_event_ids(
        self,
        event: NormalizedEvent,
        correlations: List[CorrelationResult],
    ) -> List[str]:
        """
        Collect unique event IDs belonging to the
        current incident candidate.
        """

        event_ids = {event.event_id}

        for correlation in correlations:
            event_ids.update(correlation.event_ids)

        return sorted(event_ids)


def decide_incident(
    event: NormalizedEvent,
    anomaly: AnomalyResult,
    correlations: List[CorrelationResult],
    context: HistoricalContext,
) -> IncidentResult:
    """
    Convenience function for incident decision.
    """

    engine = IncidentDecisionEngine()

    return engine.decide(
        event=event,
        anomaly=anomaly,
        correlations=correlations,
        context=context,
    )