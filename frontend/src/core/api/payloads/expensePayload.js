// /api/payloads/expensePayload.js

export function buildExpensePayload(data, user) {
  return {
    title: data.title,
    amount: Number(data.amount),
    category: data.category || "general",
    description: data.description || "",
    recorded_by: user?.id || null,
    timestamp: new Date().toISOString()
  };
}
