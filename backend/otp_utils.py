import smtplib
from email.mime.text import MIMEText
import random
import time

# In-memory OTP store: {email: (otp, expiry_time)}
otp_store = {}

EMAIL_ADDRESS = "ayushmangemini@gmail.com"  # <-- Set your Gmail address here
EMAIL_PASSWORD = "zztm mziv fkbe iklv"    # <-- Set your Gmail App Password here

# Send OTP email using Gmail SMTP

def send_otp_email(recipient_email, otp_code):
    msg = MIMEText(f"Your OTP code is: {otp_code}")
    msg['Subject'] = "Your Voting OTP"
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = recipient_email

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, recipient_email, msg.as_string())

# Generate and store OTP (always overwrite previous OTP for the email)
def generate_and_store_otp(email):
    otp = str(random.randint(100000, 999999))
    expiry = time.time() + 300  # OTP valid for 5 minutes
    otp_store[email] = (otp, expiry)
    send_otp_email(email, otp)
    return otp

# Verify OTP (accept latest OTP if not expired, allow retry after wrong attempt)
def verify_otp(email, otp):
    if email in otp_store:
        stored_otp, expiry = otp_store[email]
        if time.time() < expiry:
            if stored_otp == otp:
                del otp_store[email]
                return True
            else:
                return False  # Wrong OTP, but allow retry until expiry
    return False
