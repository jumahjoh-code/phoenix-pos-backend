export function buildOfflineReceipt(sale) {
  return {
    sale_id: `OFF-${sale.offline_id}`,
    receipt_number: `OFF-${sale.offline_id}`,
    source: "pos",
    status: "offline",
    date: sale.created_at,
    items: sale.items.map(i => ({
      product_id: i.product_id,
      product_name: "Item",
      quantity: i.quantity,
      price: i.unit_price,
      total: i.quantity * i.unit_price
    })),
    total_amount: sale.total_amount,
    amount_paid: sale.amount_paid,
    balance: 0,
    payment_method: sale.payment_method
  };
}