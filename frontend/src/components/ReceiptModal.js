import React, { useEffect, useRef, useMemo } from "react";

export default function ReceiptModal({ receipt, onClose }) {
  const hasPrinted = useRef(false);

  // =========================
  // 💰 FORMATTERS
  // =========================
  const formatCurrency = (value) =>
    `KES ${Number(value || 0).toLocaleString()}`;

  const formattedDate = useMemo(() => {
    return new Date(receipt?.date || Date.now()).toLocaleString();
  }, [receipt]);

  const items = useMemo(() => {
    if (!Array.isArray(receipt?.items)) return [];
    return receipt.items;
  }, [receipt]);

  // =========================
  // 🖨️ PRINT HANDLER (SAFE)
  // =========================
  useEffect(() => {
    if (!receipt || hasPrinted.current) return;

    hasPrinted.current = true;

    const printTimer = setTimeout(() => {
      window.print();

      const closeTimer = setTimeout(() => {
        onClose?.();
        hasPrinted.current = false;
      }, 1200);

      return () => clearTimeout(closeTimer);
    }, 250);

    return () => clearTimeout(printTimer);
  }, [receipt, onClose]);

  if (!receipt) return null;

  const subtotal = receipt.total_amount || receipt.total || 0;
  const paid = receipt.amount_paid || 0;
  const change = receipt.balance || 0;

  return (
    <div style={styles.overlay}>
      <div className="receipt-print" style={styles.receipt}>

        {/* PRINT CSS */}
        <style>
{`
@media print {
  body * {
    visibility: hidden;
  }

  .receipt-print, .receipt-print * {
    visibility: visible;
  }

  .receipt-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 80mm;
  }

  button {
    display: none !important;
  }
}
`}
        </style>

        {/* HEADER */}
        <div style={styles.center}>
          <strong style={{ fontSize: "14px" }}>PHOENIX POS</strong><br/>
          Nairobi, Kenya<br/>
          ------------------------------<br/>
          Receipt #{receipt.sale_id || receipt.id || "-"}<br/>
          {formattedDate}
        </div>

        <div style={styles.divider}></div>

        {/* ITEMS */}
        {items.length > 0 ? (
          items.map((item, index) => {
            const qty = Number(item.quantity || 0);
            const price = Number(item.price || item.unit_price || 0);
            const total = qty * price;

            return (
              <div key={index} style={styles.itemBlock}>
                <div style={styles.itemName}>
                  {item.product_name || `Item #${item.product_id}`}
                </div>

                <div style={styles.row}>
                  <span>{qty} x {formatCurrency(price)}</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div style={styles.center}>No items</div>
        )}

        <div style={styles.divider}></div>

        {/* TOTALS */}
        <div style={styles.row}>
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        <div style={styles.row}>
          <span>Paid</span>
          <span>{formatCurrency(paid)}</span>
        </div>

        <div style={styles.row}>
          <span>Change</span>
          <span>{formatCurrency(change)}</span>
        </div>

        <div style={styles.divider}></div>

        {/* FOOTER */}
        <div style={styles.center}>
          *** THANK YOU ***<br/>
          Visit Again!
        </div>

        {/* ACTION */}
        <button onClick={onClose} style={styles.closeBtn}>
          Close
        </button>

      </div>
    </div>
  );
}

// =========================
// 🎨 STYLES
// =========================
const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  receipt: {
    width: "260px",
    background: "#fff",
    padding: "12px",
    fontFamily: "monospace",
    fontSize: "12px",
    lineHeight: "1.5",
    borderRadius: "4px",
  },
  center: {
    textAlign: "center",
    marginBottom: "6px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "2px",
  },
  itemBlock: {
    marginBottom: "6px",
  },
  itemName: {
    fontWeight: "bold",
  },
  divider: {
    borderTop: "1px dashed black",
    margin: "6px 0",
  },
  closeBtn: {
    marginTop: "10px",
    width: "100%",
    padding: "6px",
    cursor: "pointer",
  },
};