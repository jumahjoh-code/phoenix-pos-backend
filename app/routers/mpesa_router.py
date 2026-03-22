from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import base64
import datetime
import os

router = APIRouter(prefix="/mpesa", tags=["Mpesa"])

# =========================
# CONFIG (SET THESE IN ENV)
# =========================
CONSUMER_KEY = os.getenv("MPESA_CONSUMER_KEY")
CONSUMER_SECRET = os.getenv("MPESA_CONSUMER_SECRET")
SHORTCODE = os.getenv("MPESA_SHORTCODE")
PASSKEY = os.getenv("MPESA_PASSKEY")
CALLBACK_URL = os.getenv("MPESA_CALLBACK_URL")

# =========================
# REQUEST MODEL
# =========================
class STKPushRequest(BaseModel):
    phone: str
    amount: float

# =========================
# ACCESS TOKEN
# =========================
def get_access_token():
    url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"

    response = requests.get(url, auth=(CONSUMER_KEY, CONSUMER_SECRET))

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get access token")

    return response.json().get("access_token")

# =========================
# PASSWORD GENERATION
# =========================
def generate_password():
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    data_to_encode = SHORTCODE + PASSKEY + timestamp
    password = base64.b64encode(data_to_encode.encode()).decode("utf-8")
    return password, timestamp

# =========================
# STK PUSH ENDPOINT
# =========================
@router.post("/stk-push")
def stk_push(payload: STKPushRequest):
    try:
        access_token = get_access_token()
        password, timestamp = generate_password()

        url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        data = {
            "BusinessShortCode": SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(payload.amount),
            "PartyA": payload.phone,
            "PartyB": SHORTCODE,
            "PhoneNumber": payload.phone,
            "CallBackURL": CALLBACK_URL,
            "AccountReference": "PhoenixPOS",
            "TransactionDesc": "Payment"
        }

        response = requests.post(url, json=data, headers=headers)

        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="STK push failed")

        return {
            "status": "success",
            "data": response.json()
        }

    except Exception as e:
        print(f"Mpesa STK Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Mpesa request failed")

# =========================
# CALLBACK ENDPOINT
# =========================
@router.post("/callback")
def mpesa_callback(data: dict):
    try:
        print("Mpesa Callback Received:", data)

        # Extract useful info safely
        body = data.get("Body", {}).get("stkCallback", {})
        result_code = body.get("ResultCode")
        result_desc = body.get("ResultDesc")

        if result_code == 0:
            print("Payment successful")
        else:
            print(f"Payment failed: {result_desc}")

        return {"status": "received"}

    except Exception as e:
        print(f"Callback error: {str(e)}")
        return {"status": "error"}