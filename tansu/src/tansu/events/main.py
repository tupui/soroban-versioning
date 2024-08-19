"""Main entry point for the FastAPI server."""

import os
from tansu.events.app import create_app

env = os.getenv("ENV", "production")
debug = True if env == "testing" else False
app = create_app(debug=debug)
