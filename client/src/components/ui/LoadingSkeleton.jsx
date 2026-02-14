import React from "react";

export default function LoadingSkeleton({
  width = "100%",
  height = "16px",
  borderRadius = "4px",
  className = "",
  style = {},
}) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "#e0e0e0",
        animation: "pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}
