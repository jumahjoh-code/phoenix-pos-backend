export default function Button({
  children,
  onClick,
  type = "primary",
  size = "md",
  disabled = false
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${type} ${size !== "md" ? `btn-${size}` : ""}`}
    >
      {children}
    </button>
  );
}