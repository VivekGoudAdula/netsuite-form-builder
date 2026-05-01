from fastapi import APIRouter, HTTPException
from app.services.netsuite_service import get_employees, send_to_netsuite

router = APIRouter(prefix="/api/netsuite", tags=["NetSuite"])

@router.get("/employees")
def fetch_employees():
    """
    Endpoint to fetch employees from NetSuite.
    """
    employees = get_employees()
    if not employees:
        # In a real scenario, you might want to return an empty list or a 500 depending on the failure
        return []
    return employees

@router.post("/test-submit")
def test_submit():
    """
    Test endpoint to simulate sending data to NetSuite.
    """
    payload = {
        "firstname": "Test",
        "lastname": "User",
        "email": "test@test.com",
        "subsidiary": 1
    }
    return send_to_netsuite(payload)
