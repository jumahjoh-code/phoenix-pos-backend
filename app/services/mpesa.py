import requests
from datetime import datetime
import base64
import logging

logger = logging.getLogger(__name__)

# 🔥 SANDBOX CREDENTIALS
CONSUMER_KEY = "Z6CQPgAUCzVZIaiZSONFMLUm24yiqENScLQCcnjMGU1nOLsG"
CONSUMER_SECRET = "PxxUQjDKQoxA1iKAszI5zgWxEf5vVxOvmOZAtKaTDsTmCHFblsyIqjkSnZUS5lSc"

# 🔥 SANDBOX SHORTCODE
BUSINESS_SHORTCODE = "174379"

# 🔥 OFFICIAL SANDBOX PASSKEY
PASSKEY = "bfb279f9aa9bdbcf158e97dd5e7f1c2c5d9c7a8b6d4c5e6f7a8b9c0d1e2f3a4b"

# 🔥 REPLACE WITH YOUR NGROK URL
CALLBACK_URL = "https://your-ngrok-url/mpesa/callback"


# =========================
# 🔷 GET ACCESS TOKEN
# =========================
def get_access_token():
    url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"

    try:
        response = requests.get(url, auth=(CONSUMER_KEY, CONSUMER_SECRET))
        response.raise_for_status()

        token = response.json().get("access_token")
        logger.info("Access token acquired")

        return token

    except Exception as e:
        logger.error(f"Access Token Error: {str(e)}")
        return None


# =========================
# 🔷 STK PUSH
# =========================
def stk_push(phone: str, amount: float, sale_id: int):
    token = get_access_token()

    if not token:
        return {"error": "Failed to get access token"}

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

    # 🔥 PASSWORD GENERATION
    password_str = f"{BUSINESS_SHORTCODE}{PASSKEY}{timestamp}"
    password = base64.b64encode(password_str.encode()).decode()

    payload = {
        "BusinessShortCode": BUSINESS_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": phone,
        "PartyB": BUSINESS_SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": CALLBACK_URL,
        "AccountReference": str(sale_id),
        "TransactionDesc": f"Payment for sale {sale_id}"
    }

    headers = {
        "Authorization": f"Bearer {token}"
    }

    try:
        response = requests.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers=headers
        )

        res = response.json()

        logger.info(f"STK Response: {res}")

        # 🔴 HANDLE FAILED REQUEST
        if res.get("ResponseCode") != "0":
            return {
                "error": "STK push rejected",
                "details": res
            }

        # ✅ SUCCESS RESPONSE
        return {
            "CheckoutRequestID": res.get("CheckoutRequestID"),
            "ResponseCode": res.get("ResponseCode"),
            "ResponseDescription": res.get("ResponseDescription"),
            "CustomerMessage": res.get("CustomerMessage"),
            "raw": res
        }

    except Exception as e:
        logger.error(f"STK Push Error: {str(e)}")

        return {
            "error": "STK push failed",
            "details": str(e)
        }