from fastapi import FastAPI

from app.api.events import router as events_router
from app.api.incidents import router as incidents_router
from app.core.database import Base, engine

from app.models.event import Event
from app.models.incident import Incident
from app.models.incident_event import IncidentEvent
from app.models.evidence import Evidence
from app.models.correlation import Correlation
from app.models.correlation_event import CorrelationEvent


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="TraceX API",
    description="Incident Intelligence Backend for Autonomous AI Systems",
    version="1.0.0",
)


app.include_router(events_router)
app.include_router(incidents_router)


@app.get("/")
def root():
    return {"message": "TraceX API is running"}