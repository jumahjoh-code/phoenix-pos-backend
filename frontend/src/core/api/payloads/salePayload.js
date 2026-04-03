export function buildSalePayload(cart, user) {

  // =========================
  // BASIC VALIDATION
  // =========================
  if (!Array.isArray(cart) || cart.length === 0) {
    throw new Error("Cart is empty");
  }

  // =========================
  // ITEMS
  // =========================
  const items = cart.map(item => {
    const product_id = Number(item.id);
    const quantity = Number(item.quantity ?? 1);

    // 🔥 FIX: SUPPORT BOTH price + retail_price
    const unit_price = Number(item.price ?? item.retail_price ?? 0);

    if (!product_id || product_id <= 0) {
      throw new Error(`Invalid product ID for ${item.name}`);
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Invalid quantity for ${item.name}`);
    }

    if (!Number.isFinite(unit_price) || unit_price <= 0) {
      throw new Error(`Invalid price for ${item.name}`);
    }

    return {
      product_id,
      quantity,
      unit_price,
      total: quantity * unit_price
    };
  });

  // =========================
  // TOTAL
  // =========================
  const total_amount = items.reduce(
    (sum, i) => sum + i.total,
    0
  );

  if (!Number.isFinite(total_amount) || total_amount <= 0) {
    throw new Error("Invalid total amount");
  }

  // =========================
  // USER / PAYMENT
  // =========================
  const user_id = Number(user?.id || 1);
  const payment_method = "cash";
  const amount_paid = total_amount;

  // =========================
  // FINAL PAYLOAD
  // =========================
  return {
    items,
    total_amount,
    amount_paid,
    payment_method,
    user_id,
    status: "paid",
    timestamp: new Date().toISOString()
  };
}