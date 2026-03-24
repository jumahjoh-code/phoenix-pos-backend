from openai import OpenAI
import os
import json
from sqlalchemy import func


# =========================
# 🔑 SAFE CLIENT (WITH DEBUG)
# =========================
def get_client():
    api_key = os.getenv("OPENAI_API_KEY")

    print("========== AI DEBUG ==========")
    print("OPENAI_API_KEY:", api_key)
    print("TYPE:", type(api_key))
    print("LENGTH:", len(api_key) if api_key else 0)

    if not api_key:
        print("❌ API KEY MISSING")
        return None

    api_key = api_key.strip()

    if not api_key.startswith("sk-"):
        print("❌ INVALID API KEY FORMAT")
        return None

    print("✅ API KEY LOADED")

    return OpenAI(api_key=api_key)


# =========================
# 🔍 SYSTEM ANALYSIS
# =========================
def analyze_system(summary):
    client = get_client()
    if not client:
        return "❌ AI not configured (check API key)"

    try:
        summary_text = json.dumps(summary, indent=2)
    except Exception:
        summary_text = str(summary)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a POS analyst. Be practical and specific."},
                {"role": "user", "content": summary_text}
            ],
            temperature=0.3
        )

        return response.choices[0].message.content

    except Exception as e:
        print("❌ OPENAI ERROR:", str(e))
        return "❌ AI request failed"


# =========================
# 💡 BUSINESS ADVICE
# =========================
def business_advice(context):
    client = get_client()
    if not client:
        return "❌ AI not configured"

    try:
        context_text = json.dumps(context, indent=2)
    except Exception:
        context_text = str(context)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a business advisor. Give actionable advice."},
                {"role": "user", "content": context_text}
            ],
            temperature=0.4
        )

        return response.choices[0].message.content

    except Exception as e:
        print("❌ OPENAI ERROR:", str(e))
        return "❌ AI request failed"


# =========================
# 🧠 MAIN AI CHAT
# =========================
def ai_chat_brain(prompt, context):
    client = get_client()
    if not client:
        return "❌ AI service not configured"

    try:
        context_text = json.dumps(context, indent=2)
    except Exception:
        context_text = str(context)

    system_prompt = f"""
You are Phoenix AI (business advisor).

- Analyze business
- Detect problems
- Suggest clear actions
- Be practical

Focus:
- Profit
- Growth
- Stock
- Risks

DATA:
{context_text}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4
        )

        return response.choices[0].message.content

    except Exception as e:
        print("❌ OPENAI ERROR:", str(e))
        return "❌ AI request failed"


# =========================
# 📊 GROWTH
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
# 🔮 PREDICTION
# =========================
def predict_sales(db):
    from app.models.ai_learning import AILearning

    records = db.query(AILearning).order_by(AILearning.date.desc()).limit(7).all()

    if len(records) < 3:
        return None

    sales = [r.sales for r in records]
    return round(sum(sales) / len(sales), 2)


# =========================
# ⚠️ RISKS
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
# 🎯 DECISIONS
# =========================
def generate_decisions(context):

    decisions = []

    if context.get("profit_margin", 0) < 10:
        decisions.append({
            "priority": "high",
            "action": "Review pricing or supplier costs",
            "reason": "Low profit margin"
        })

    if context.get("growth", 0) < 0:
        decisions.append({
            "priority": "high",
            "action": "Run promotions",
            "reason": "Sales declining"
        })

    if context.get("low_stock"):
        decisions.append({
            "priority": "medium",
            "action": f"Restock: {', '.join(context['low_stock'])}",
            "reason": "Low stock"
        })

    return decisions
