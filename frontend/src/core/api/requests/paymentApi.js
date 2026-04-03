import { API } from "config";

export async function payCash(saleId, amount) {
  const res = await fetch(`${API}/payments/cash`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sale_id: saleId,
      amount
    })
  });

  if (!res.ok) {
    throw new Error("Cash payment failed");
  }

  return res.json();
}
