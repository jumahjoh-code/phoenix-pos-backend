from fastapi import APIRouter
import requests
from mpesa_auth import get_access_token
from mpesa_config import (
    SHORTCODE, PASSKEY, CALLBACK_URL,
    get_timestamp, get_password
)

router = APIRouter()

@router.post("/mpesa/stk-push")
def stk_push(phone: str, amount: int):

    token = get_access_token()

    timestamp = get_timestamp()
    password = get_password(timestamp)

    url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"

    payload = {
        "BusinessShortCode": SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone,
        "PartyB": SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": CALLBACK_URL,
        "AccountReference": "PHOENIX_POS",
        "TransactionDesc": "POS Payment"
    }

    headers = {
        "Authorization": f"Bearer {token}"
    }

    response = requests.post(url, json=payload, headers=headers)

    return response.json()