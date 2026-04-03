export default function MetricCard({
  title,
  value,
  variant = "primary",
  className = ""
}) {
  return (
    <div className={`metric-card metric-${variant} ${className}`}>
      <p className="metric-title">{title}</p>
      <h2 className="metric-value">{value}</h2>
    </div>
  );
}