from .anomaly import detect_anomaly
from .baseline import build_baseline
from .correlation import correlate_events
from .criticality import evaluate_resource_criticality
from .entities import resolve_entities
from .evidence import generate_evidence
from .features import extract_features
from .incident import decide_incident
from .priority import calculate_priority
from .schemas import (
    HistoricalContext,
    IntelligenceResult,
    NormalizedEvent,
)


class IntelligencePipeline:
    """
    Main TraceX Intelligence entry point.

    Current pipeline stages:

    Phase 2: Feature extraction
    Phase 3: Behavioral baseline
    Phase 4: Anomaly detection
    Phase 5: Entity resolution
    Phase 6: Event correlation
    Phase 7: Incident decision
    Phase 8: Evidence generation
    Phase 9: Resource criticality
    Phase 10: Priority calculation

    Future stage:

    Phase 11: Full pipeline hardening/integration
    """

    def process(
        self,
        normalized_event: NormalizedEvent,
        historical_context: HistoricalContext,
    ) -> IntelligenceResult:

        # --------------------------------------------------
        # Phase 2: Feature extraction
        # --------------------------------------------------

        features = extract_features(
            normalized_event
        )

        # --------------------------------------------------
        # Phase 3: Behavioral baseline
        # --------------------------------------------------

        baseline = build_baseline(
            event=normalized_event,
            features=features,
            context=historical_context,
        )

        # --------------------------------------------------
        # Phase 4: Anomaly detection
        # --------------------------------------------------

        anomaly = detect_anomaly(
            event=normalized_event,
            features=features,
            baseline=baseline,
        )

        # --------------------------------------------------
        # Phase 5: Entity resolution
        # --------------------------------------------------

        entities = resolve_entities(
            normalized_event,
        )

        # --------------------------------------------------
        # Phase 6: Event correlation
        # --------------------------------------------------

        correlations = correlate_events(
            event=normalized_event,
            context=historical_context,
        )

        # --------------------------------------------------
        # Phase 7: Incident decision
        # --------------------------------------------------

        incident = decide_incident(
            event=normalized_event,
            anomaly=anomaly,
            correlations=correlations,
            context=historical_context,
        )

        # --------------------------------------------------
        # Phase 8: Evidence generation
        # --------------------------------------------------

        evidence = generate_evidence(
            event=normalized_event,
            anomaly=anomaly,
            correlations=correlations,
            incident=incident,
        )

        # --------------------------------------------------
        # Phase 9: Resource criticality
        # --------------------------------------------------

        criticality = evaluate_resource_criticality(
            normalized_event
        )

        # --------------------------------------------------
        # Phase 10: Priority calculation
        # --------------------------------------------------

        priority = calculate_priority(
            anomaly=anomaly,
            correlations=correlations,
            incident=incident,
            evidence=evidence,
            criticality=criticality,
        )

        # --------------------------------------------------
        # Final intelligence result
        # --------------------------------------------------

        return IntelligenceResult(
            anomalies=[anomaly],
            entities=entities,
            correlations=correlations,
            incident=incident,
            evidence=evidence,
            priority=priority,
        )


def process_event(
    normalized_event: NormalizedEvent,
    historical_context: HistoricalContext,
) -> IntelligenceResult:
    """
    Convenience function for processing one normalized event.
    """

    pipeline = IntelligencePipeline()

    return pipeline.process(
        normalized_event,
        historical_context,
    )