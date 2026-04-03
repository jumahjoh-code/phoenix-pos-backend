export const SaleItemSchema = {
  product_id: "number",
  quantity: "number",
  unit_price: "number"
};

export const SalePayloadSchema = {
  items: "array",
  total_amount: "number",
  amount_paid: "number",
  payment_method: "string",
  user_id: "number",
  status: "string"
};