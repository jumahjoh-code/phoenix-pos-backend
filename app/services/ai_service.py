from openai import OpenAI
import os
import json
from sqlalchemy import func

# ✅ SAFE INITIALIZATION (NO CRASH)
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None


# =========================
# 🔍 SYSTEM ANALYSIS
# =========================
def analyze_system(summary):
    if not client:
        return "AI service not configured"

    try:
        summary_text = json.dumps(summary, indent=2)
    except Exception:
        summary_text = str(summary)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a POS analyst. Be practical and specific."},
            {"role": "user", "content": summary_text}
        ],
        temperature=0.3
    )

    return response.choices[0].message.content


# =========================
# 💡 BUSINESS ADVICE
# =========================
def business_advice(context):
    if not client:
        return "AI service not configured"

    try:
        context_text = json.dumps(context, indent=2)
    except Exception:
        context_text = str(context)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a business advisor. Give actionable advice."},
            {"role": "user", "content": context_text}
        ],
        temperature=0.4
    )

    return response.choices[0].message.content


# =========================
# 🧠 MAIN AI CHAT BRAIN
# =========================
def ai_chat_brain(prompt, context):
    if not client:
        return "AI service not configured"

    try:
        context_text = json.dumps(context, indent=2)
    except Exception:
        context_text = str(context)

    system_prompt = f"""
You are Phoenix AI (advisor only).

- Analyze business
- Detect issues
- Suggest actions
- DO NOT execute anything

Focus:
- Profit
- Growth
- Stock
- Risks

Data:
{context_text}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        temperature=0.4
    )

    return response.choices[0].message.content


# =========================
# 📊 TREND ANALYSIS
# =========================
def calculate_growth(today, yesterday):
    try:
        if yesterday == 0:
            return 100.0 if today > 0 else 0.0
        return ((today - yesterday) / yesterday) * 100
    except Exception:
        return 0.0


# =========================
# 🧠 INSIGHTS
# =========================
def generate_intelligent_insights(data):

    insights = []

    if data.get("profit_margin", 0) < 10:
        insights.append({
            "level": "critical",
            "message": "Profit margin critically low"
        })

    if data.get("low_stock"):
        insights.append({
            "level": "warning",
            "message": "Low stock detected"
        })

    if data.get("growth", 0) < 0:
        insights.append({
            "level": "warning",
            "message": "Sales declining"
        })

    if data.get("growth", 0) > 20:
        insights.append({
            "level": "info",
            "message": "Strong growth detected"
        })

    return insights


# =========================
# 🧠 LEARNING
# =========================
def detect_learning_patterns(db):

    from app.models.ai_learning import AILearning

    records = db.query(AILearning).order_by(AILearning.date.desc()).limit(5).all()

    insights = []

    if len(records) >= 3:
        if all(r.profit_margin < 15 for r in records[:3]):
            insights.append({
                "level": "critical",
                "message": "Repeated low profit margin trend"
            })

        if all(r.growth < 0 for r in records[:3]):
            insights.append({
                "level": "warning",
                "message": "Consistent sales decline trend"
            })

    return insights


# =========================
# 🔮 SALES PREDICTION
# =========================
def predict_sales(db):

    from app.models.ai_learning import AILearning

    records = db.query(AILearning).order_by(AILearning.date.desc()).limit(7).all()

    if len(records) < 3:
        return None

    sales = [r.sales for r in records]
    avg = sum(sales) / len(sales)

    return round(avg, 2)


# =========================
# ⚠️ RISK FORECAST
# =========================
def forecast_risks(db):

    from app.models.ai_learning import AILearning

    records = db.query(AILearning).order_by(AILearning.date.desc()).limit(5).all()

    risks = []

    if len(records) >= 3:
        if all(r.growth < 0 for r in records[:3]):
            risks.append("Sales declining trend")

        if all(r.profit_margin < 10 for r in records[:3]):
            risks.append("Profit margin collapse risk")

    return risks


# =========================
# 📦 PRODUCT INTELLIGENCE
# =========================
def analyze_product_demand(db):

    from app.models.sale_item import SaleItem
    from app.models.product import Product

    results = db.query(
        Product.name,
        func.sum(SaleItem.quantity)
    ).join(SaleItem).group_by(Product.name).all()

    formatted = []

    for r in results:
        try:
            formatted.append({
                "product": r[0],
                "quantity": int(r[1] or 0)
            })
        except Exception:
            continue

    return formatted[:5]


# =========================
# 💰 PRICING INTELLIGENCE
# =========================
def analyze_pricing_intelligence(db):

    from app.models.product import Product

    products = db.query(Product).all()

    insights = []

    for p in products:

        price = getattr(p, "selling_price", None) or getattr(p, "price", None)
        cost = getattr(p, "cost_price", None)

        if not price or not cost:
            continue

        try:
            margin = ((price - cost) / price) * 100
        except Exception:
            continue

        if margin < 10:
            insights.append(f"{p.name}: low margin")

        elif margin > 40:
            insights.append(f"{p.name}: high margin (pricing opportunity)")

    return insights[:5]


# =========================
# 🎯 DECISION ENGINE
# =========================
def generate_decisions(context):

    decisions = []

    if context.get("profit_margin", 0) < 10:
        decisions.append({
            "priority": "high",
            "action": "Review pricing or supplier costs",
            "reason": "Profit margin is critically low"
        })

    if context.get("growth", 0) < 0:
        decisions.append({
            "priority": "high",
            "action": "Run promotions or improve sales channels",
            "reason": "Sales are declining"
        })

    if context.get("low_stock"):
        decisions.append({
            "priority": "medium",
            "action": f"Restock: {', '.join(context['low_stock'])}",
            "reason": "Products are running out"
        })

    if context.get("growth", 0) > 20:
        decisions.append({
            "priority": "low",
            "action": "Increase stock or optimize pricing",
            "reason": "Strong growth detected"
        })

    return decisions


# =========================
# 🧠 AUTOPILOT SUMMARY
# =========================
def generate_autopilot_summary(context):

    if not client:
        return "AI service not configured"

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "Summarize business performance and highlight key risks and actions."
            },
            {
                "role": "user",
                "content": json.dumps(context, indent=2)
            }
        ],
        temperature=0.4
    )

    return response.choices[0].message.content
