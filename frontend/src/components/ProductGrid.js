import React, { useMemo, useCallback } from "react";

export default function ProductGrid({ products = [], onAdd }) {
  // =========================
  // 🧠 SAFE NORMALIZATION
  // =========================
  const safeProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products;
  }, [products]);

  // =========================
  // 💰 FORMATTER (MEMOIZED)
  // =========================
  const formatCurrency = useCallback(
    (value) => `KES ${Number(value || 0).toLocaleString()}`,
    []
  );

  // =========================
  // 🖱️ CLICK HANDLER (STABLE)
  // =========================
  const handleClick = useCallback(
    (product, disabled) => {
      if (disabled) return;
      onAdd?.(product);
    },
    [onAdd]
  );

  // =========================
  // 📭 EMPTY STATE
  // =========================
  if (safeProducts.length === 0) {
    return <p style={styles.empty}>No products loaded</p>;
  }

  return (
    <div style={styles.grid}>
      {safeProducts.map((product, index) => {
        const stock = Number(product.stock_quantity ?? 0);
        const price = Number(product.retail_price ?? 0);
        const cost = Number(product.cost_price ?? 0);

        const outOfStock = stock <= 0;
        const lowStock = stock > 0 && stock <= 5;
        const profit = price - cost;

        return (
          <button
            key={product.id ?? `p-${index}`}
            onClick={() => handleClick(product, outOfStock)}
            style={{
              ...styles.card,
              ...(lowStock ? styles.lowStock : {}),
              ...(outOfStock ? styles.disabled : {}),
            }}
          >
            {/* PRODUCT NAME */}
            <div style={styles.name}>
              {product.name ?? "Unnamed Product"}
            </div>

            {/* PRICE */}
            <div style={styles.price}>
              {formatCurrency(price)}
            </div>

            {/* STOCK */}
            <div style={styles.meta}>
              Stock: {stock}
            </div>

            {/* PROFIT */}
            <div
              style={{
                ...styles.meta,
                color: profit < 0 ? "red" : "#555",
                fontWeight: profit < 0 ? "bold" : "normal",
              }}
            >
              Profit: {formatCurrency(profit)}
            </div>

            {/* LOW STOCK */}
            {lowStock && !outOfStock && (
              <div style={styles.low}>Low stock</div>
            )}

            {/* OUT OF STOCK */}
            {outOfStock && (
              <div style={styles.out}>Out of stock</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// =========================
// 🎨 STYLES
// =========================
const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "10px",
  },

  card: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    background: "#fff",
    textAlign: "left",
    transition: "0.15s",
    cursor: "pointer",
  },

  disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  lowStock: {
    border: "1px solid orange",
    background: "#fff8e6",
  },

  name: {
    fontWeight: "bold",
    marginBottom: "5px",
    fontSize: "13px",
    lineHeight: "1.2",
  },

  price: {
    color: "#007bff",
    marginBottom: "5px",
    fontWeight: "bold",
  },

  meta: {
    fontSize: "12px",
    color: "#555",
  },

  low: {
    marginTop: "5px",
    color: "orange",
    fontSize: "12px",
    fontWeight: "bold",
  },

  out: {
    marginTop: "5px",
    color: "red",
    fontSize: "12px",
    fontWeight: "bold",
  },

  empty: {
    padding: "10px",
    color: "#777",
  },
};