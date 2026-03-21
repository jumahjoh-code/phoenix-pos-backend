from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from pydantic import BaseModel

from app.core.database import get_db
from app.models.sale import Sale
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.chat import ChatMessage
from app.models.decision_log import DecisionLog

from app.services.ai_service import (
    analyze_system,
    business_advice,
    ai_chat_brain,
    calculate_growth,
    generate_intelligent_insights,
    detect_learning_patterns,
    predict_sales,
    forecast_risks,
    analyze_product_demand,
    analyze_pricing_intelligence,
    generate_autopilot_summary,
    generate_decisions
)

router = APIRouter(prefix="/ai", tags=["AI"])


# =========================
# SCHEMAS
# =========================
class ChatRequest(BaseModel):
    prompt: str


class DecisionAction(BaseModel):
    action: str
    reason: str
    status: str


# =========================
# CHAT HISTORY
# =========================
@router.get("/chat-history")
def chat_history(db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).order_by(ChatMessage.created_at).all()
    return [{"sender": m.sender, "text": m.message} for m in messages]


# =========================
# 🔥 AI DASHBOARD
# =========================
@router.get("/dashboard")
def ai_dashboard(db: Session = Depends(get_db)):

    today = date.today()
    yesterday = today - timedelta(days=1)

    total_sales = db.query(func.coalesce(func.sum(Sale.total_amount), 0))\
        .filter(func.date(Sale.created_at) == today).scalar()

    total_cost = db.query(func.coalesce(func.sum(Sale.cost_total), 0))\
        .filter(func.date(Sale.created_at) == today).scalar()

    yesterday_sales = db.query(func.coalesce(func.sum(Sale.total_amount), 0))\
        .filter(func.date(Sale.created_at) == yesterday).scalar()

    profit = float(total_sales - total_cost)
    profit_margin = (profit / total_sales * 100) if total_sales > 0 else 0
    growth = calculate_growth(float(total_sales), float(yesterday_sales))

    # 🔥 FIXED STOCK LOGIC
    low_stock_products = db.query(Inventory, Product)\
        .join(Product, Inventory.product_id == Product.id)\
        .filter(Inventory.quantity < 5).all()

    low_stock_names = [p.Product.name for p in low_stock_products]

    # 🔮 Forecast
    prediction = predict_sales(db)

    # ⚠️ Risks
    risks = forecast_risks(db)

    # 📦 Products
    products = analyze_product_demand(db)

    # 💰 Pricing
    pricing = analyze_pricing_intelligence(db)

    # 🧠 Decisions
    decisions = generate_decisions({
        "profit_margin": profit_margin,
        "growth": growth,
        "low_stock": low_stock_names
    })

    # 🧠 Health Score
    score = 100
    if profit_margin < 10:
        score -= 40
    if growth < 0:
        score -= 20
    if low_stock_names:
        score -= 10

    score = max(score, 0)

    return {
        "sales": float(total_sales),
        "profit": profit,
        "growth": growth,
        "health": score,
        "forecast": prediction,
        "risks": risks,
        "products": products,
        "pricing": pricing,
        "low_stock": low_stock_names,
        "decisions": decisions
    }


# =========================
# 🎯 DECISION ACTION
# =========================
@router.post("/decision-action")
def decision_action(payload: DecisionAction, db: Session = Depends(get_db)):

    log = DecisionLog(
        action=payload.action,
        reason=payload.reason,
        status=payload.status
    )

    db.add(log)
    db.commit()

    return {"message": "Decision recorded"}


# =========================
# 🧠 AI CHAT
# =========================
@router.post("/chat")
def ai_chat(request: ChatRequest, db: Session = Depends(get_db)):

    prompt = request.prompt.lower()
    today = date.today()
    yesterday = today - timedelta(days=1)

    total_sales = db.query(func.coalesce(func.sum(Sale.total_amount), 0))\
        .filter(func.date(Sale.created_at) == today).scalar()

    total_cost = db.query(func.coalesce(func.sum(Sale.cost_total), 0))\
        .filter(func.date(Sale.created_at) == today).scalar()

    transactions = db.query(func.count(Sale.id))\
        .filter(func.date(Sale.created_at) == today).scalar()

    yesterday_sales = db.query(func.coalesce(func.sum(Sale.total_amount), 0))\
        .filter(func.date(Sale.created_at) == yesterday).scalar()

    profit = float(total_sales - total_cost)
    profit_margin = (profit / total_sales * 100) if total_sales > 0 else 0
    growth = calculate_growth(float(total_sales), float(yesterday_sales))

    # 🔥 FIXED STOCK LOGIC
    low_stock_products = db.query(Inventory, Product)\
        .join(Product, Inventory.product_id == Product.id)\
        .filter(Inventory.quantity < 5).all()

    low_stock_names = [p.Product.name for p in low_stock_products]

    context = {
        "sales": float(total_sales),
        "profit": profit,
        "transactions": transactions,
        "profit_margin": profit_margin,
        "growth": growth,
        "low_stock": low_stock_names
    }

    # SAVE USER
    db.add(ChatMessage(sender="user", message=prompt))
    db.commit()

    # QUICK RESPONSES
    if "sales" in prompt:
        reply = f"📊 Sales today: {total_sales} from {transactions}"

    elif "profit" in prompt:
        reply = f"💰 Profit: {profit} ({profit_margin:.2f}%)"

    elif "stock" in prompt:
        reply = f"⚠️ Low stock: {', '.join(low_stock_names)}" if low_stock_names else "✅ Stock OK"

    else:
        insights = generate_intelligent_insights(context)
        patterns = detect_learning_patterns(db)

        enriched = {**context, "insights": insights + patterns}
        reply = ai_chat_brain(prompt, enriched)

    # SAVE AI RESPONSE
    db.add(ChatMessage(sender="ai", message=reply))
    db.commit()

    return {"reply": reply}