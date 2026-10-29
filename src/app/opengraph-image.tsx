import { ImageResponse } from "next/og";

export const alt =
  "Plainly: a prediction market concept. Chance the Gulls win: 71%. Likely: the market thinks this happens about 3 times in 4.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A made-up game's price path, for the preview chart.
const PATH = [
  0.55, 0.56, 0.55, 0.57, 0.56, 0.71, 0.72, 0.74, 0.73, 0.75, 0.74, 0.73, 0.52, 0.53, 0.5, 0.49,
  0.23, 0.22, 0.21, 0.5, 0.51, 0.49, 0.84, 0.9, 0.93, 0.95,
];

export default function OpengraphImage() {
  const w = 440;
  const h = 170;
  const d = PATH.map(
    (p, i) => `${i ? "L" : "M"}${((i / (PATH.length - 1)) * w).toFixed(1)},${((1 - p) * h).toFixed(1)}`,
  ).join("");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f6f4ef",
          color: "#15171a",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 560 }}>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>Plainly</div>
          <div
            style={{
              marginTop: 36,
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Prediction markets that explain themselves.
          </div>
          <div style={{ marginTop: 28, fontSize: 26, color: "#4a4d52", lineHeight: 1.35 }}>
            One live game, from discovery to cash-out. Every price in plain words.
          </div>
          <div style={{ marginTop: "auto", fontSize: 20, color: "#65686e" }}>
            Concept prototype · demo money
          </div>
        </div>

        <div
          style={{
            marginLeft: "auto",
            width: 500,
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            borderRadius: 36,
            border: "1px solid #e3dfd6",
            padding: "36px 30px 30px",
            boxShadow: "0 30px 80px rgba(21,23,26,0.12)",
          }}
        >
          <div style={{ fontSize: 22, color: "#4a4d52" }}>Chance the Gulls win</div>
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: 4 }}>
            <div style={{ fontSize: 110, fontWeight: 700, letterSpacing: -5, lineHeight: 1 }}>71</div>
            <div style={{ fontSize: 56, fontWeight: 700, marginBottom: 10 }}>%</div>
          </div>
          <div style={{ marginTop: 14, fontSize: 24, lineHeight: 1.3, display: "flex" }}>
            <span style={{ fontWeight: 700, marginRight: 8 }}>Likely.</span>
            <span style={{ color: "#4a4d52" }}>About 3 times in 4.</span>
          </div>
          <svg width={w} height={h} style={{ marginTop: 26 }} viewBox={`0 0 ${w} ${h}`}>
            <line x1="0" x2={w} y1={h / 2} y2={h / 2} stroke="#e3dfd6" strokeWidth="2" />
            <path d={d} fill="none" stroke="#2f5bea" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={(5 / (PATH.length - 1)) * w} cy={(1 - 0.71) * h} r="9" fill="#2f5bea" />
            <circle cx={(16 / (PATH.length - 1)) * w} cy={(1 - 0.23) * h} r="9" fill="#b9521c" />
            <circle cx={(22 / (PATH.length - 1)) * w} cy={(1 - 0.84) * h} r="9" fill="#2f5bea" />
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
