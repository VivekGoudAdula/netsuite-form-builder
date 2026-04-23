from typing import Dict, Any

async def trigger_workflow_level(submission: Dict[str, Any]):
    """
    Triggers the current level of approval for a submission.
    For now, it just logs the notification.
    Phase 4 will implement actual email notifications.
    """
    current_level = submission["currentLevel"]

    # Find the data for the current level
    level_data = next(
        (l for l in submission["approvals"] if l["level"] == current_level),
        None
    )

    if not level_data:
        print(f"Error: Level {current_level} not found in submission approvals.")
        return

    approvers = level_data["approvers"]

    # For now -> just log
    print(f"Notify Level {current_level} approvers: {[a['name'] for a in approvers]}")
    
    # Placeholder for email logic in Phase 4
    # await send_approval_emails(approvers, submission)
