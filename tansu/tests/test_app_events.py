import pytest

from tansu.events import api_models
from tests.conftest import TANSU_PROJECT_KEY


@pytest.mark.asyncio
async def test_events(a_client):
    payload = api_models.EventRequest(
        project_key=TANSU_PROJECT_KEY,
    ).model_dump_json()
    response = await a_client.post("events", data=payload)

    assert response.status_code == 200
    result = response.json()
    _ = [api_models.Event(**event) for event in result]
