import smtplib
import os
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

async def send_email(to_email, subject, html_content):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("SMTP credentials missing. Email not sent.")
        return

    msg = MIMEText(html_content, "html")
    msg["Subject"] = subject
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
    except Exception as e:
        print(f"Failed to send email: {e}")

def generate_email_html(form_name, user_name, approve_url, reject_url):
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
            <h2 style="margin: 0; color: #333;">Form Approval Required</h2>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #555;">Hello,</p>
            <p style="font-size: 16px; color: #555;"><b>{user_name}</b> has submitted a new form: <b>{form_name}</b>.</p>
            <p style="font-size: 16px; color: #555;">Please review the submission and take appropriate action by clicking one of the buttons below.</p>
            <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
                <a href="{approve_url}" style="padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px; display: inline-block;">
                    Approve
                </a>
                <a href="{reject_url}" style="padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Reject
                </a>
            </div>
            <p style="font-size: 14px; color: #888; text-align: center; margin-top: 30px;">
                These links are secure and will expire. Do not share them.
            </p>
        </div>
    </div>
    """
