from datetime import datetime
from typing import Optional, Any, Dict
from ..database import get_database

async def log_activity(
    user_id: str,
    action: str,
    entity_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    db = get_database()
    activity = {
        "userId": user_id,
        "action": action,
        "entityId": entity_id,
        "entityType": entity_type,
        "timestamp": datetime.utcnow(),
        "metadata": metadata or {}
    }
    await db.activity_log.insert_one(activity)
