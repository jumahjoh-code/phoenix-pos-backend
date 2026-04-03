import colors from "../../design/colors";
import spacing from "../../design/spacing";

export default function Card({ children }) {
  return (
    <div style={{
      background: colors.surface,
      padding: spacing.lg,
      borderRadius: 12,
      border: `1px solid ${colors.border}`
    }}>
      {children}
    </div>
  );
}
