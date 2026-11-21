import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "#060714",
          backgroundImage:
            "radial-gradient(circle at 20% 15%, rgba(62,166,255,0.25), transparent 55%), radial-gradient(circle at 85% 85%, rgba(168,85,247,0.22), transparent 55%)",
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            border: "7px solid #3ea6ff",
            borderRadius: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              background: "linear-gradient(135deg, #3ea6ff, #a855f7)",
              borderRadius: 10,
            }}
          />
        </div>
        <div style={{ fontSize: 76, fontWeight: 600, color: "#e8e9f5", letterSpacing: -2 }}>
          CPU Lab
        </div>
        <div style={{ fontSize: 30, color: "#8f92b3" }}>
          Learn how modern processors actually execute code
        </div>
      </div>
    ),
    { ...size },
  );
}
