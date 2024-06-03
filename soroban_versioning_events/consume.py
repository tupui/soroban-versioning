import sqlalchemy
import stellar_sdk

from database import db_models
from log import logger


@sqlalchemy.event.listens_for(db_models.Event, "after_insert")
def event_handler(mapper, connection, target):
    topics = target.topics
    value = stellar_sdk.scval.to_native(target.value)

    for key, topic in topics.items():
        topics[key] = stellar_sdk.scval.to_native(topic)

    logger.info(f"Event listener: {topics} {value}")
