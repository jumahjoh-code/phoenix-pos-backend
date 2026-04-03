export const theme = {
  yellow: "#FACC15",
  bg: "#F3F4F6",
  card: "#FFFFFF",
  border: "#E5E7EB",
  text: "#111827",
  subtext: "#6B7280",
  danger: "#DC2626"
};

export const layout = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 10
  },

  title: {
    color: "#FACC15",
    fontWeight: "bold"
  },

  card: {
    background: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    border: "1px solid #E5E7EB",
    marginTop: 20
  }
};

export const components = {

  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    width: "100%"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))",
    gap: 10
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 10
  },

  primaryBtn: {
    background: "#FACC15",
    border: "none",
    padding: 10,
    borderRadius: 8,
    cursor: "pointer"
  },

  grayBtn: {
    background: "#eee",
    border: "none",
    padding: 8,
    borderRadius: 6,
    cursor: "pointer"
  },

  dangerBtn: {
    background: "#DC2626",
    color: "white",
    border: "none",
    padding: 8,
    borderRadius: 6,
    cursor: "pointer"
  }
};
