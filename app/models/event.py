from datetime import datetime

from sqlalchemy import DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Event(Base):
    __tablename__ = "events"

    event_id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    event_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
    )

    user_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    device_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    ip_address: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    session_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    resource: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    action: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    event_metadata: Mapped[dict] = mapped_column(
    "metadata",
    JSON,
    nullable=False,
    default=dict,
    )