import asyncio
import random
from uuid import uuid4
from typing import Dict, Any

async def send_to_netsuite_mock(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simulates sending data to NetSuite API.
    Returns a mock response with success/failure status and a mock NetSuite ID.
    """
    # Simulate network delay
    await asyncio.sleep(1)

    # 75% success rate
    is_success = random.choice([True, True, True, False])

    if is_success:
        return {
            "success": True,
            "netsuiteId": f"NS-{uuid4()}"
        }
    else:
        return {
            "success": False,
            "error": "Mock NetSuite Connection Timeout: The remote server did not respond in time."
        }
