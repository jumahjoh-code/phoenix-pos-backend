import React from "react";

export default function ProductGrid({ products = [], onAdd }) {

  // 🔹 EMPTY STATE
  if (!Array.isArray(products) || products.length === 0) {
    return <p style={styles.empty}>No products loaded</p>;
  }

  const formatCurrency = (value) =>
    `KES ${Number(value || 0).toLocaleString()}`;

  const handleClick = (product, disabled) => {
    if (disabled) return;
    onAdd?.(product);
  };

  return (
    <div style={styles.grid}>
      {products.map((product, index) => {

        const stock = Number(product.stock_quantity ?? 0);
        const price = Number(product.retail_price ?? 0);
        const cost = Number(product.cost_price ?? 0);

        const outOfStock = stock <= 0;
        const lowStock = stock > 0 && stock <= 5;
        const profit = price - cost;

        return (
          <button
            key={product.id ?? index}
            onClick={() => handleClick(product, outOfStock)}
            style={{
              ...styles.card,
              ...(lowStock ? styles.lowStock : {}),
              ...(outOfStock ? styles.disabled : {})
            }}
          >

            {/* 🔹 PRODUCT NAME */}
            <div style={styles.name}>
              {product.name ?? "Unnamed Product"}
            </div>

            {/* 🔹 PRICE */}
            <div style={styles.price}>
              {formatCurrency(price)}
            </div>

            {/* 🔹 STOCK */}
            <div style={styles.meta}>
              Stock: {stock}
            </div>

            {/* 🔹 PROFIT (IMPORTANT FOR YOU AS BUSINESS OWNER) */}
            <div style={styles.meta}>
              Profit: {formatCurrency(profit)}
            </div>

            {/* 🔹 LOW STOCK WARNING */}
            {lowStock && !outOfStock && (
              <div style={styles.low}>Low stock</div>
            )}

            {/* 🔹 OUT OF STOCK */}
            {outOfStock && (
              <div style={styles.out}>Out of stock</div>
            )}

          </button>
        );
      })}
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: "10px"
  },

  card: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    background: "#fff",
    textAlign: "left",
    transition: "0.15s",
    cursor: "pointer"
  },

  disabled: {
    opacity: 0.5,
    cursor: "not-allowed"
  },

  lowStock: {
    border: "1px solid orange",
    background: "#fff8e6"
  },

  name: {
    fontWeight: "bold",
    marginBottom: "5px"
  },

  price: {
    color: "#007bff",
    marginBottom: "5px",
    fontWeight: "bold"
  },

  meta: {
    fontSize: "12px",
    color: "#555"
  },

  low: {
    marginTop: "5px",
    color: "orange",
    fontSize: "12px"
  },

  out: {
    marginTop: "5px",
    color: "red",
    fontSize: "12px"
  },

  empty: {
    padding: "10px"
  }
};
