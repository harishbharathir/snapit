from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import razorpay
import qrcode
import io
import base64
import time

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Razorpay Keys
RAZORPAY_KEY_ID = "rzp_test_TgA2wiiP87W7Hf"
RAZORPAY_KEY_SECRET = "Lxsw3z4s3j3xJ1iq6tuQrTKH"

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class OrderRequest(BaseModel):
    amount: int
    user_id: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    user_id: str
    amount: int

@router.post("/create-order")
async def create_order(req: OrderRequest):
    try:
        order_amount = req.amount * 100 # convert to paise
        order_currency = "INR"
        order_receipt = f"receipt_{req.user_id}_{int(time.time())}"
        
        order = razorpay_client.order.create({
            "amount": order_amount,
            "currency": order_currency,
            "receipt": order_receipt,
            "payment_capture": 1
        })
        return {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify")
async def verify_payment(req: VerifyPaymentRequest):
    try:
        # Verify signature
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': req.razorpay_order_id,
            'razorpay_payment_id': req.razorpay_payment_id,
            'razorpay_signature': req.razorpay_signature
        })
        
        # Payment is verified
        # Here we should update the wallet/order status in the DB
        # For now, we will just generate a QR code for the success screen
        
        qr_data = f"PAYMENT_ID:{req.razorpay_payment_id}|USER:{req.user_id}|AMOUNT:{req.amount}"
        
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert image to base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        return {
            "status": "success", 
            "message": "Payment successful",
            "qr_code_base64": f"data:image/png;base64,{img_str}"
        }
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
