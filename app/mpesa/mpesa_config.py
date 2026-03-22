import base64
from datetime import datetime

CONSUMER_KEY = "YOUR_CONSUMER_KEY"
CONSUMER_SECRET = "YOUR_CONSUMER_SECRET"

SHORTCODE = "174379"  # sandbox
PASSKEY = "YOUR_PASSKEY"

CALLBACK_URL = "https://your-ngrok-url/mpesa/callback"


def get_timestamp():
    return datetime.now().strftime("%Y%m%d%H%M%S")


def get_password(timestamp):
    data = SHORTCODE + PASSKEY + timestamp
    return base64.b64encode(data.encode()).decode()