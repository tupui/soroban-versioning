import sqlalchemy

from tansu.events import api_models
from tansu.events.database import db_models
from tansu.events.log import logger


@sqlalchemy.event.listens_for(db_models.Event, "after_insert")
def event_handler(mapper, connection, target: db_models.Event):
    event = api_models.Event(
        project_key=target.project_key, action=target.action, value=target.value
    )

    logger.debug(
        f"Event listener: {event.project_key} :: {event.action} :: {event.value} :: {event.ledger}"
    )
