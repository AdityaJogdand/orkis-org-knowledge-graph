"""Email delivery for OTP codes via Gmail SMTP (TLS on port 587).

If SMTP_USER / SMTP_PASSWORD are not set, falls back to printing the OTP
on the server console so development works without credentials.
"""

import base64
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from ..config import settings

# Embed banner as base64 so it renders in all email clients without hosting
_BANNER_PATH = Path(__file__).parent.parent.parent / "orkis-banner.png"

def _banner_data_uri() -> str:
    if _BANNER_PATH.exists():
        data = base64.b64encode(_BANNER_PATH.read_bytes()).decode()
        return f"data:image/png;base64,{data}"
    return ""


def send_otp_email(to_email: str, recipient_name: str, otp_code: str) -> None:
    """Send OTP to *to_email*.  Falls back to console if SMTP is not configured."""
    if not settings.smtp_user or not settings.smtp_password:
        _console_fallback(to_email, otp_code)
        return

    sender = settings.smtp_from or settings.smtp_user
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Orkis Login Code"
    msg["From"] = f"Orkis Security <{sender}>"
    msg["To"] = to_email

    plain = (
        f"Hello {recipient_name},\n\n"
        f"Your one-time login code is:\n\n"
        f"  {otp_code}\n\n"
        f"It expires in {settings.otp_expire_minutes} minutes.\n"
        f"Do not share this code with anyone.\n\n"
        f"If you did not request this, ignore this email.\n\n"
        f"— The Orkis Team"
    )
    banner_uri = _banner_data_uri()
    banner_html = (
        f'<tr><td style="padding:0;line-height:0;">'
        f'<img src="{banner_uri}" alt="Orkis" width="560" '
        f'style="display:block;width:100%;max-width:560px;"/>'
        f'</td></tr>'
        if banner_uri else ""
    )

    html = f"""\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Your Orkis Login Code</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f9f7;
             font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background-color:#f9f9f7;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="max-width:560px;width:100%;background:#ffffff;
                      border-radius:12px;overflow:hidden;
                      border:1px solid #ede8e3;
                      box-shadow:0 2px 12px rgba(0,0,0,0.06);">

          <!-- BANNER -->
          {banner_html}

          <!-- HEADER -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <span style="font-size:20px;font-weight:700;color:#f97316;">Orkis</span>
              <span style="font-size:13px;color:#a8a29e;margin-left:8px;">— Your Institution, Connected.</span>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#f0ebe5;"></div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 6px;font-size:13px;color:#a8a29e;">Hello</p>
              <p style="margin:0 0 28px;font-size:16px;font-weight:600;color:#1c1917;">
                {recipient_name}
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#78716c;line-height:1.6;">
                Use the code below to sign in to your Orkis account.
                It is valid for <strong style="color:#1c1917;">{settings.otp_expire_minutes} minutes</strong>
                and can only be used once.
              </p>

              <!-- OTP BOX -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center"
                      style="padding:28px 24px;border-radius:8px;
                             background:#fafaf8;border:1px solid #ede8e3;">
                    <p style="margin:0 0 10px;font-size:11px;font-weight:600;
                               color:#a8a29e;letter-spacing:2.5px;
                               text-transform:uppercase;">Verification Code</p>
                    <p style="margin:0;font-size:40px;font-weight:700;
                               letter-spacing:12px;color:#1c1917;
                               font-family:'Courier New',monospace;">{otp_code}</p>
                  </td>
                </tr>
              </table>

              <!-- DIVIDER -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="margin:28px 0;">
                <tr><td style="height:1px;background:#f0ebe5;"></td></tr>
              </table>

              <p style="margin:0;font-size:12px;color:#a8a29e;line-height:1.7;">
                If you didn't request this code, you can safely ignore this email.
                Never share this code with anyone.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:20px 40px 28px;">
              <p style="margin:0;font-size:12px;color:#c4bdb8;">
                &copy; Orkis &mdash; Organizational Intelligence Platform.
                Do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.smtp_user, settings.smtp_password_clean)
        server.sendmail(sender, to_email, msg.as_string())

    print(f"[email] OTP sent to {to_email}", flush=True)


def _console_fallback(to_email: str, otp_code: str) -> None:
    print(
        f"\n{'='*50}\n"
        f"  OTP LOGIN (no SMTP configured)\n"
        f"  To : {to_email}\n"
        f"  OTP: {otp_code}  (valid {settings.otp_expire_minutes} min)\n"
        f"{'='*50}\n",
        flush=True,
    )
