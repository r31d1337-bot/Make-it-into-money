import { ImageResponse } from "next/og";

// 180×180 PNG served as iOS home-screen icon. Same glyph as the favicon,
// scaled up so it reads cleanly on a phone home screen.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 120,
          fontWeight: 700,
          fontFamily: "system-ui, -apple-system, sans-serif",
          letterSpacing: "-0.04em",
          position: "relative",
        }}
      >
        m
        <div
          style={{
            position: "absolute",
            right: 28,
            top: 36,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#a78bfa",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
