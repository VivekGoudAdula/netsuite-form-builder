import sys
import os
sys.path.append(os.getcwd())
from app.services.netsuite_service import get_oauth, requests
from app.config import settings

url = f"{settings.NETSUITE_BASE_URL}/app/site/hosting/restlet.nl"
params = {
    "script": settings.NETSUITE_GET_SCRIPT,
    "deploy": settings.NETSUITE_DEPLOY,
    "type": "vendor",
    "recordtype": "vendor",
    "recordType": "vendor"
}

headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

response = requests.get(url, auth=get_oauth(), params=params, headers=headers)
print("Status:", response.status_code)
try:
    data = response.json()
    print("Keys in response:", data.keys())
    if "vendors" in data:
        print("First vendor:", data["vendors"][0] if data["vendors"] else "Empty")
    if "departments" in data:
        print("First department:", data["departments"][0] if data["departments"] else "Empty")
    if "subsidiaries" in data:
        print("First subsidiary:", data["subsidiaries"][0] if data["subsidiaries"] else "Empty")
except Exception as e:
    print("Error parsing json or keys:", e)
