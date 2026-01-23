"""FastAPI app.

Connect all routers to the app and add error handling.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

from tansu.events.log import logger
from tansu.events.routers import system, events

ORIGINS = [
    "https://testnet.tansu.dev",
    "https://app.tansu.dev",
]


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Log all unhandled exceptions."""
    message = f"Internal API error: {exc}"
    logger.error(message)
    return JSONResponse(
        status_code=500,
        content={"message": "Internal API error. The error was reported to our team."},
    )


def create_app(debug: bool = False):
    app = FastAPI(
        title="Tansu - events backend",
        debug=debug,
        description="",
        version="1.0.0",
        middleware=[
            Middleware(
                CORSMiddleware,
                **{
                    "allow_origins": ORIGINS,
                    "allow_credentials": True,
                    "allow_methods": ["GET", "POST", "DELETE", "OPTIONS"],
                    "allow_headers": ["*"],
                },
            ),
        ],
    )

    app.add_exception_handler(Exception, unhandled_exception_handler)

    app.include_router(system.router, tags=["system"])
    app.include_router(events.router, tags=["events"])

    logger.info("Tansu RPC is running...")

    return app


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "tansu.events.main:app",
        host="127.0.0.1",
        reload=True,
        port=8080,
        access_log=True,
        log_level="debug",
    )
