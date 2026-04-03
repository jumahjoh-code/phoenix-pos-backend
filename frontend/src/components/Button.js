import colors from "../../design/colors";

export default function Button({ children, variant = "primary", ...props }) {

  const styles = {
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: "bold"
  };

  const variants = {
    primary: {
      background: colors.primary,
      color: "#111827"
    },
    danger: {
      background: colors.danger,
      color: "#fff"
    },
    secondary: {
      background: "#eee"
    }
  };

  return (
    <button
      {...props}
      style={{
        ...styles,
        ...variants[variant]
      }}
    >
      {children}
    </button>
  );
}
