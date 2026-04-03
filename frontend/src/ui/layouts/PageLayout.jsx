import colors from "../design/colors";
import spacing from "../design/spacing";

export default function PageLayout({ title, subtitle, actions, children }) {
  return (
    <div
      style={{
        padding: spacing.lg,
        background: colors.background,
        minHeight: "100vh"
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: spacing.lg }}>
        <h1>{title}</h1>
        {subtitle && (
          <p style={{ color: "#6b7280" }}>{subtitle}</p>
        )}
      </div>

      {/* ACTION BAR */}
      {actions && (
        <div style={{ marginBottom: spacing.md }}>
          {actions}
        </div>
      )}

      {/* CONTENT */}
      <div>{children}</div>
    </div>
  );
}