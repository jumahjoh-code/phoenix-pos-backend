export function validateSalePayload(payload) {
  if (!payload.items || !Array.isArray(payload.items)) {
    throw new Error("Items must be an array");
  }

  payload.items.forEach(item => {
    if (typeof item.product_id !== "number") {
      throw new Error("Invalid product_id");
    }

    if (typeof item.quantity !== "number" || item.quantity <= 0) {
      throw new Error("Invalid quantity");
    }

    if (typeof item.unit_price !== "number" || item.unit_price <= 0) {
      throw new Error("Invalid unit_price");
    }
  });

  if (typeof payload.total_amount !== "number") {
    throw new Error("Invalid total amount");
  }

  return true;
}