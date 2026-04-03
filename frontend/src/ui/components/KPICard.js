import React from "react";
import colors from "../../design/colors";
import spacing from "../../design/spacing";

export default function KPICard({ title, value, icon }) {
  return (
    <div style={{
      background: colors.surface,
      padding: spacing.lg,
      borderRadius: 12,
      border: `1px solid ${colors.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>

      <div>
        <p style={{
          color: colors.subtext,
          marginBottom: 5
        }}>
          {title}
        </p>

        <h2 style={{
          color: colors.primary
        }}>
          {value}
        </h2>
      </div>

      <div style={{
        background: colors.primary,
        padding: 10,
        borderRadius: 10
      }}>
        {icon}
      </div>

    </div>
  );
}
