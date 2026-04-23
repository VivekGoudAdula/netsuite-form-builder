from typing import Dict, Any
from datetime import datetime
from bson import ObjectId
from ..database import get_database
from .activity import log_activity
import os
from dotenv import load_dotenv

load_dotenv()
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

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
    
    # Send email notifications
    from .token_service import generate_action_token
    from .email_service import send_email, generate_email_html
    
    db = get_database()
    for approver in approvers:
        # Fetch user email from DB
        user_doc = await db.users.find_one({"_id": ObjectId(approver["userId"])})
        if not user_doc or not user_doc.get("email"):
            print(f"Warning: Skipping email for {approver['name']} - No email found.")
            continue
            
        to_email = user_doc["email"]

        approve_token = generate_action_token(
            submission["_id"], approver["userId"], "approve"
        )

        reject_token = generate_action_token(
            submission["_id"], approver["userId"], "reject"
        )

        approve_url = f"{BASE_URL}/api/workflows/action?token={approve_token}"
        reject_url = f"{BASE_URL}/api/workflows/action?token={reject_token}"

        form_name = submission.get("formName", "Form Submission")
        user_name = submission.get("userName", "A user")
        transaction_type = submission.get("transactionType", "Unknown")
        submitted_at = submission.get("submittedAt")
        if isinstance(submitted_at, datetime):
            submitted_at = submitted_at.strftime("%Y-%m-%d %H:%M:%S UTC")
        else:
            submitted_at = str(submitted_at)

        html = generate_email_html(
            form_name,
            user_name,
            transaction_type,
            submitted_at,
            str(submission["_id"]),
            current_level,
            approve_url,
            reject_url
        )

        await send_email(to_email, "Approval Required", html)

async def approve_submission(submission_id: str, user: Dict[str, Any]):
    db = get_database()
    submission = await db.submissions.find_one({"_id": ObjectId(submission_id)})
    
    if not submission:
        raise Exception("Submission not found")
        
    if submission["status"] != "pending":
        raise Exception("Submission already completed")
        
    current_level = submission["currentLevel"]
    level_data = next(
        (l for l in submission["approvals"] if l["level"] == current_level),
        None
    )
    
    if not level_data:
        raise Exception("Current level data not found")
        
    approver = next(
        (a for a in level_data["approvers"] if a["userId"] == user["id"]),
        None
    )
    
    if not approver:
        raise Exception("Not authorized for this level")
        
    if approver["status"] != "pending":
        raise Exception("Already acted")
        
    # Mark APPROVED
    approver["status"] = "approved"
    approver["actionAt"] = datetime.utcnow()
    
    # Check if ALL approvers approved
    all_approved = all(
        a["status"] == "approved"
        for a in level_data["approvers"]
    )
    
    if not all_approved:
        await db.submissions.update_one(
            {"_id": ObjectId(submission_id)},
            {"$set": {"approvals": submission["approvals"]}}
        )
        return
        
    # MOVE TO NEXT LEVEL
    total_levels = len(submission["approvals"])
    if current_level < total_levels:
        submission["currentLevel"] += 1
        # Trigger next level notification
        await trigger_workflow_level(submission)
    else:
        submission["status"] = "approved"
        # Trigger NetSuite (Phase 5)
        
    await db.submissions.update_one(
        {"_id": ObjectId(submission_id)},
        {
            "$set": {
                "approvals": submission["approvals"],
                "currentLevel": submission["currentLevel"],
                "status": submission["status"]
            }
        }
    )
    
    await log_activity(user["id"], "APPROVE_FORM", submission_id, "submission")

async def reject_submission(submission_id: str, user: Dict[str, Any]):
    db = get_database()
    submission = await db.submissions.find_one({"_id": ObjectId(submission_id)})
    
    if not submission:
        raise Exception("Submission not found")
        
    if submission["status"] != "pending":
        raise Exception("Submission already completed")
        
    current_level = submission["currentLevel"]
    level_data = next(
        (l for l in submission["approvals"] if l["level"] == current_level),
        None
    )
    
    if not level_data:
        raise Exception("Current level data not found")
        
    approver = next(
        (a for a in level_data["approvers"] if a["userId"] == user["id"]),
        None
    )
    
    if not approver:
        raise Exception("Not authorized for this level")
        
    if approver["status"] != "pending":
        raise Exception("Already acted")
        
    # Mark REJECTED
    approver["status"] = "rejected"
    approver["actionAt"] = datetime.utcnow()
    
    # STOP WORKFLOW
    submission["status"] = "rejected"
    
    await db.submissions.update_one(
        {"_id": ObjectId(submission_id)},
        {
            "$set": {
                "approvals": submission["approvals"],
                "status": "rejected"
            }
        }
    )
    
    await log_activity(user["id"], "REJECT_FORM", submission_id, "submission")
