import sys
import os

# Add backend directory to sys.path so absolute imports resolve correctly
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
sys.path.insert(0, backend_dir)

# Import the FastAPI application
from backend.app import app
