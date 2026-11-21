import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#060714",
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            border: "6px solid #3ea6ff",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "linear-gradient(135deg, #3ea6ff, #a855f7)",
              borderRadius: 8,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
