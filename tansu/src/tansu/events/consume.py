import sqlalchemy
import stellar_sdk

from tansu.events.database import db_models
from tansu.events.log import logger


@sqlalchemy.event.listens_for(db_models.Event, "after_insert")
def event_handler(mapper, connection, target: db_models.Event):
    project_key = stellar_sdk.scval.to_native(target.project_key)
    action = stellar_sdk.scval.to_native(target.action)
    value = stellar_sdk.scval.to_native(target.value)

    logger.info(f"Event listener: {project_key} :: {action} :: {value}")
