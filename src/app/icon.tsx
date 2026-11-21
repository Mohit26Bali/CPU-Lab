import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            border: "2.5px solid #3ea6ff",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 6, height: 6, background: "#a855f7", borderRadius: 1 }} />
        </div>
      </div>
    ),
    { ...size },
  );
}
