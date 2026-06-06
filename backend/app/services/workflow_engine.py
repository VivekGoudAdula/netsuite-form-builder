from typing import Dict, Any, List, Optional
from datetime import datetime
from bson import ObjectId
from ..database import get_database
from .activity import log_activity
from .netsuite_service import send_to_netsuite
from .item_receipt_service import send_item_receipt_to_netsuite
from .vendor_bill_service import send_vendor_bill_to_netsuite
from .purchase_order_netsuite_service import (
    build_purchase_order_sync_update,
    send_purchase_order_to_netsuite,
)
import os
from dotenv import load_dotenv

load_dotenv()
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


async def _send_submission_to_netsuite(
    submission: Dict[str, Any],
    submission_id: str,
) -> Dict[str, Any]:
    tx = submission.get("transactionType")
    if tx == "item_receipt":
        return send_item_receipt_to_netsuite(submission)
    if tx == "vendor_bill":
        return send_vendor_bill_to_netsuite(submission)
    if tx == "purchase_order":
        return await send_purchase_order_to_netsuite(submission)
    payload = {
        "firstname": submission.get("values", {}).get("firstName", ""),
        "lastname": submission.get("values", {}).get("lastName", ""),
        "email": submission.get("values", {}).get("email", ""),
        "subsidiary": 1,
        "submissionId": submission_id,
        "formName": submission.get("formName"),
    }
    return send_to_netsuite(payload)


def try_build_workflow_approvals(workflow: Optional[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
    """
    Return approval levels when a company workflow is fully configured.
    Returns None when no workflow exists or it has no usable approver levels.
    """
    if not workflow:
        return None

    levels = workflow.get("levels") or []
    if not levels:
        return None

    approvals: List[Dict[str, Any]] = []
    for level in levels:
        approvers = level.get("approvers") or []
        if not approvers:
            return None
        approvals.append(
            {
                "level": level["level"],
                "status": "pending",
                "approvers": [
                    {
                        "userId": u["userId"],
                        "name": u["name"],
                        "email": u.get("email"),
                        "role": u.get("role"),
                        "status": "pending",
                        "actionAt": None,
                    }
                    for u in approvers
                ],
            }
        )
    return approvals


def _netsuite_sync_update_fields(submission: Dict[str, Any]) -> Dict[str, Any]:
    update_fields: Dict[str, Any] = {
        "status": submission["status"],
        "updatedAt": datetime.utcnow(),
    }
    for key in (
        "netsuiteResponse",
        "netsuiteError",
        "netsuiteSyncError",
        "poId",
        "documentNumber",
        "submissionId",
    ):
        if key in submission:
            update_fields[key] = submission[key]
    return update_fields


async def _update_transaction_shadow_status(
    submission_id: str,
    submission: Dict[str, Any],
) -> None:
    db = get_database()
    tx = submission.get("transactionType")
    if tx == "item_receipt":
        await db.item_receipt_submissions.update_one(
            {"_id": ObjectId(submission_id)},
            {
                "$set": {
                    "workflowStatus": submission["status"],
                    "currentLevel": submission.get("currentLevel", 0),
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
    if tx == "vendor_bill":
        await db.vendor_bill_submissions.update_one(
            {"_id": ObjectId(submission_id)},
            {
                "$set": {
                    "workflowStatus": submission["status"],
                    "currentLevel": submission.get("currentLevel", 0),
                    "updatedAt": datetime.utcnow(),
                }
            },
        )


async def _log_netsuite_sync_activity(
    user_id: str,
    submission_id: str,
    submission: Dict[str, Any],
) -> None:
    tx = submission.get("transactionType")
    status = submission.get("status")
    if tx == "purchase_order":
        if status == "SYNCED_TO_NETSUITE":
            await log_activity(
                user_id,
                "NETSUITE_PO_SYNCED",
                entity_id=submission_id,
                entity_type="submission",
                metadata={
                    "poId": submission.get("poId"),
                    "documentNumber": submission.get("documentNumber"),
                },
            )
        elif status == "NETSUITE_SYNC_FAILED":
            await log_activity(
                user_id,
                "NETSUITE_PO_SYNC_FAILED",
                entity_id=submission_id,
                entity_type="submission",
                metadata={"error": submission.get("netsuiteSyncError")},
            )
        return

    if status == "submitted":
        await log_activity(
            user_id,
            "SENT_TO_NETSUITE",
            entity_id=submission_id,
            entity_type="submission",
        )
    elif status == "failed":
        await log_activity(
            user_id,
            "NETSUITE_SYNC_FAILED",
            entity_id=submission_id,
            entity_type="submission",
            metadata={"error": submission.get("netsuiteError")},
        )


async def complete_submission_netsuite_sync(
    submission: Dict[str, Any],
    submission_id: str,
    user_id: str,
) -> Dict[str, Any]:
    """Send a submission directly to NetSuite and persist sync status."""
    db = get_database()
    ns_response = await _send_submission_to_netsuite(submission, submission_id)
    _apply_netsuite_sync_to_submission(submission, submission_id, ns_response)

    sync_fields = _netsuite_sync_update_fields(submission)
    if submission.get("displayValues"):
        sync_fields["displayValues"] = submission["displayValues"]

    await db.submissions.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": sync_fields},
    )
    await _update_transaction_shadow_status(submission_id, submission)
    await _log_netsuite_sync_activity(user_id, submission_id, submission)

    return {
        "status": submission["status"],
        "poId": submission.get("poId"),
        "documentNumber": submission.get("documentNumber"),
        "netsuiteSyncError": submission.get("netsuiteSyncError") or submission.get("netsuiteError"),
    }


def _apply_netsuite_sync_to_submission(
    submission: Dict[str, Any],
    submission_id: str,
    ns_response: Dict[str, Any],
) -> None:
    tx = submission.get("transactionType")
    if tx == "purchase_order":
        sync_update = build_purchase_order_sync_update(ns_response, submission_id)
        submission.update(sync_update)
        return

    if ns_response.get("status") == "success":
        submission["status"] = "submitted"
        submission["netsuiteResponse"] = ns_response
    else:
        submission["status"] = "failed"
        submission["netsuiteError"] = ns_response.get("message")

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
        # Fetch user email from DB with robustness for ID types
        user_id = approver["userId"]
        user_doc = None
        
        try:
            # Try as ObjectId first
            user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
        except:
            # Fallback to string ID
            user_doc = await db.users.find_one({"_id": user_id})
            
        to_email = None
        if user_doc and user_doc.get("email"):
            to_email = user_doc["email"]
        elif approver.get("email"):
            # Fallback to email stored in the submission
            to_email = approver["email"]
            
        if not to_email:
            print(f"Warning: Skipping email for {approver['name']} - No email found.")
            continue
            
        to_email = to_email # Redundant but keeps flow

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
        ns_response = await _send_submission_to_netsuite(submission, submission_id)
        _apply_netsuite_sync_to_submission(submission, submission_id, ns_response)

    update_fields: Dict[str, Any] = {
        "approvals": submission["approvals"],
        "currentLevel": submission["currentLevel"],
        **_netsuite_sync_update_fields(submission),
    }
    if submission.get("displayValues"):
        update_fields["displayValues"] = submission["displayValues"]

    await db.submissions.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": update_fields},
    )

    await _update_transaction_shadow_status(submission_id, submission)

    await log_activity(user["id"], "APPROVE_FORM", entity_id=submission_id, entity_type="submission")
    if current_level >= total_levels:
        await _log_netsuite_sync_activity(user["id"], submission_id, submission)

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

    if submission.get("transactionType") == "item_receipt":
        await db.item_receipt_submissions.update_one(
            {"_id": ObjectId(submission_id)},
            {
                "$set": {
                    "workflowStatus": "rejected",
                    "updatedAt": datetime.utcnow(),
                }
            },
        )
    if submission.get("transactionType") == "vendor_bill":
        await db.vendor_bill_submissions.update_one(
            {"_id": ObjectId(submission_id)},
            {
                "$set": {
                    "workflowStatus": "rejected",
                    "updatedAt": datetime.utcnow(),
                }
            },
        )

    await log_activity(user["id"], "REJECT_FORM", entity_id=submission_id, entity_type="submission")
