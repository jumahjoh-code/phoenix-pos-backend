import React from "react";

export default function CartTable({
  cart = [],
  increaseQty,
  decreaseQty,
  removeFromCart
}) {

  return (
    <table width="100%" style={{ borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th align="left">Item</th>
          <th align="center">Qty</th>
          <th align="right">Price</th>
          <th></th>
        </tr>
      </thead>

      <tbody>

        {cart.length === 0 && (
          <tr>
            <td colSpan="4" style={{ textAlign: "center", padding: "10px" }}>
              No items in cart
            </td>
          </tr>
        )}

        {cart.map((item, index) => {
          // ✅ FIXED FIELDS
          const qty = Number(item.quantity || 1);
          const price = Number(item.retail_price || 0);
          const total = qty * price;

          return (
            <tr key={item.id ?? index}>
              <td>{item.name}</td>

              {/* QUANTITY */}
              <td align="center">
                <div style={styles.qtyBox}>
                  <button
                    onClick={() => decreaseQty(item.id)}
                    style={styles.qtyBtn}
                  >
                    -
                  </button>

                  <span style={styles.qty}>{qty}</span>

                  <button
                    onClick={() => increaseQty(item.id)}
                    style={styles.qtyBtn}
                  >
                    +
                  </button>
                </div>
              </td>

              {/* PRICE */}
              <td align="right">
                {total.toLocaleString()}
              </td>

              <td>
                <button
                  onClick={() => removeFromCart(item.id)}
                  style={styles.removeBtn}
                >
                  X
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const styles = {
  qtyBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  },

  qtyBtn: {
    padding: "2px 8px",
    fontSize: "14px",
    cursor: "pointer"
  },

  qty: {
    minWidth: "20px",
    textAlign: "center"
  },

  removeBtn: {
    background: "red",
    color: "white",
    border: "none",
    padding: "4px 8px",
    cursor: "pointer"
  }
};