from fastapi import APIRouter, Depends
from typing import List
from ..utils.deps import get_current_user

router = APIRouter(prefix="/submissions", tags=["Submissions"])

# Specific submission management routes can be added here
# Form-specific submissions are handled in routes/forms.py
