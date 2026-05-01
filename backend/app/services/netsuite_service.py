from requests_oauthlib import OAuth1
import requests
from app.config import settings

def get_oauth():
    """
    Generate OAuth1 object for NetSuite authentication.
    """
    return OAuth1(
        settings.NETSUITE_CONSUMER_KEY,
        settings.NETSUITE_CONSUMER_SECRET,
        settings.NETSUITE_TOKEN,
        settings.NETSUITE_TOKEN_SECRET,
        realm=settings.NETSUITE_REALM,
        signature_method="HMAC-SHA256"
    )

def get_employees():
    """
    Fetch employees from NetSuite to populate a dropdown.
    """
    url = f"{settings.NETSUITE_BASE_URL}/app/site/hosting/restlet.nl"
    
    params = {
        "script": settings.NETSUITE_GET_SCRIPT,
        "deploy": settings.NETSUITE_DEPLOY
    }

    try:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        response = requests.get(url, auth=get_oauth(), params=params, headers=headers)
        
        try:
            data = response.json()
        except ValueError:
            print(f"!!! NetSuite GET Error: Failed to parse JSON response")
            data = {}

        response.raise_for_status()
        
        employees = data.get("employees", [])
        print(f"Successfully fetched {len(employees)} employees from NetSuite.")

        return [
            {
                "label": f"{emp.get('firstName', '')} {emp.get('lastName', '')}".strip(),
                "value": emp.get("id"),
                "email": emp.get("email")
            }
            for emp in employees
        ]
    except Exception as e:
        print(f"!!! Error fetching employees from NetSuite: {e}")
        if 'response' in locals() and hasattr(response, 'text'):
             print(f"!!! Response text: {response.text}")
        return []

def send_to_netsuite(payload: dict):
    """
    Send form submission data to NetSuite.
    """
    url = f"{settings.NETSUITE_BASE_URL}/app/site/hosting/restlet.nl"
    
    params = {
        "script": settings.NETSUITE_POST_SCRIPT,
        "deploy": settings.NETSUITE_DEPLOY
    }

    try:
        print(f"--- SENDING DATA TO NETSUITE ---")
        
        response = requests.post(
            url,
            auth=get_oauth(),
            params=params,
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        try:
            data = response.json()
        except ValueError:
            data = {"status": "error", "message": "Invalid JSON response from NetSuite"}

        response.raise_for_status()
        return data
    except Exception as e:
        print(f"!!! Error sending data to NetSuite: {e}")
        if 'response' in locals() and hasattr(response, 'text'):
             print(f"!!! Response text: {response.text}")
        return {"status": "error", "message": str(e)}
