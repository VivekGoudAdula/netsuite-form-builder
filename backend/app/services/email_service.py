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
        # Port 587 with STARTTLS is generally more compatible with cloud environments like Render
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.set_debuglevel(1) # Enable debug output for clearer logs in production
            server.starttls() # Secure the connection
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
    except Exception as e:
        print(f"Failed to send email: {e}")
        # Log more details if possible
        if hasattr(e, 'args'):
            print(f"Error args: {e.args}")

def generate_email_html(form_name, user_name, transaction_type, submitted_at, submission_id, level, approve_url, reject_url):
    return f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); color: #333;">
        <div style="background: linear-gradient(135deg, #1a237e 0%, #283593 100%); padding: 30px; text-align: center; border-bottom: 1px solid #e0e0e0;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Level {level} Approval</h1>
            <p style="color: rgba(255,255,255,0.7); margin-top: 5px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">NetSuite Form Builder</p>
        </div>
        <div style="padding: 40px; background-color: #ffffff;">
            <p style="font-size: 16px; line-height: 1.6;">Hello,</p>
            <p style="font-size: 16px; line-height: 1.6;">A new <b>{form_name}</b> requires your authorization at Level {level}.</p>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0; border: 1px solid #edf2f7;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase;">By</td>
                        <td style="padding: 8px 0; font-weight: 600; color: #1a202c; text-align: right;">{user_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase;">Entity ID</td>
                        <td style="padding: 8px 0; font-family: monospace; color: #1a202c; text-align: right;">{submission_id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase;">Type</td>
                        <td style="padding: 8px 0; font-weight: 600; color: #1a202c; text-align: right; text-transform: capitalize;">{transaction_type.replace('_', ' ')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #718096; font-size: 13px; font-weight: 600; text-transform: uppercase;">Submitted</td>
                        <td style="padding: 8px 0; font-weight: 600; color: #1a202c; text-align: right;">{submitted_at}</td>
                    </tr>
                </table>
            </div>

            <p style="font-size: 14px; color: #4a5568; font-weight: 600; text-align: center; margin-bottom: 20px;">
                Decision Required: Shared Approval Level
            </p>
            
            <div style="text-align: center; margin-top: 10px; margin-bottom: 40px;">
                <a href="{approve_url}" style="padding: 15px 35px; background-color: #38a169; color: white; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; margin-right: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(56, 161, 105, 0.2);">
                    APPROVE
                </a>
                <a href="{reject_url}" style="padding: 15px 35px; background-color: #e53e3e; color: white; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(229, 62, 62, 0.2);">
                    REJECT
                </a>
            </div>
            
            <p style="font-size: 12px; color: #a0aec0; text-align: center; line-height: 1.5; border-top: 1px solid #edf2f7; padding-top: 20px;">
                Links expire in 30 mins. Clicking these will automatically process your decision.<br>
                <b>System: NetSuite-ERP Integration Core</b>
            </p>
        </div>
    </div>
    """

def generate_reset_password_html(reset_url):
    return f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); color: #333;">
        <div style="background: linear-gradient(135deg, #1a237e 0%, #283593 100%); padding: 30px; text-align: center; border-bottom: 1px solid #e0e0e0;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Security Protocol</h1>
            <p style="color: rgba(255,255,255,0.7); margin-top: 5px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">NetSuite Form Bridge</p>
        </div>
        <div style="padding: 40px; background-color: #ffffff;">
            <p style="font-size: 16px; line-height: 1.6;">Hello,</p>
            <p style="font-size: 16px; line-height: 1.6;">A password reset has been requested for your personnel account. Please use the secure link below to establish a new security key.</p>
            
            <div style="text-align: center; margin-top: 30px; margin-bottom: 40px;">
                <a href="{reset_url}" style="padding: 15px 35px; background-color: #1a237e; color: white; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(26, 35, 126, 0.2);">
                    RESET SECURITY KEY
                </a>
            </div>
            
            <p style="font-size: 13px; color: #718096; line-height: 1.6; background-color: #f8f9fa; padding: 15px; border-radius: 6px; border: 1px solid #edf2f7;">
                <b>Security Notice:</b> This link will expire in 1 hour. If you did not initiate this request, please contact your system administrator immediately and ensure your account is secured.
            </p>
            
            <p style="font-size: 12px; color: #a0aec0; text-align: center; line-height: 1.5; border-top: 1px solid #edf2f7; padding-top: 20px; margin-top: 30px;">
                <b>System: NetSuite-ERP Integration Core</b><br>
                This is an automated security notification.
            </p>
        </div>
    </div>
    """
