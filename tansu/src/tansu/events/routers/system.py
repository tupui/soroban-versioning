from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

router = APIRouter()


@router.get("/favicon.ico")
@router.get("/health")
@router.get("/")
async def health_check() -> PlainTextResponse:
    return PlainTextResponse("OK")
