from fastapi import APIRouter

from tansu.events.database import SessionFactory, db_models
from tansu.events import api_models

router = APIRouter()


@router.post("/events")
async def events(request: api_models.EventRequest) -> list[api_models.Event | None]:
    async with SessionFactory() as session:
        events_ = (
            session.query(db_models.Event)
            .where(db_models.Event.project_key == request.project_key)
            .where(db_models.Event.action == request.action)
            .limit(request.limit)
            .all()
        )

    result = [
        api_models.Event(
            project_key=event_.project_key, action=event_.action, value=event_.value
        )
        for event_ in events_
    ]

    return result
