import { ImageResponse } from "next/og";

// Favicon generated at build/edge: dark square with "m" and the purple dot
// from the wordmark. Rendered by browsers at small sizes; keep it simple.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#09090b",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.04em",
          borderRadius: 7,
          position: "relative",
        }}
      >
        m
        <div
          style={{
            position: "absolute",
            right: 5,
            top: 6,
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#a78bfa",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
