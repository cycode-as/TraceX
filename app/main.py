from fastapi import FastAPI

from app.api.events import router as events_router
from app.core.database import Base, engine
from app.models.event import Event


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="TraceX API",
    description="Incident Intelligence Backend for Autonomous AI Systems",
    version="1.0.0",
)


app.include_router(events_router)


@app.get("/")
def root():
    return {
        "message": "TraceX API is running"
    }