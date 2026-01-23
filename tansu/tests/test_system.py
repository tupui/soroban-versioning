import pytest


@pytest.mark.parametrize(
    "path",
    [
        "health",
        "",
    ],
)
@pytest.mark.asyncio
async def test_health(a_client, path):
    response = await a_client.get(path)

    assert response.status_code == 200
    loaded_text = response.text
    assert loaded_text == "OK"
