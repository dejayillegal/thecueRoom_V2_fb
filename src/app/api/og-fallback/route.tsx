import { ImageResponse } from "next/og";
export const runtime = "edge";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") ?? "Underground Signals").slice(0,120);
  return new ImageResponse(
    (
      <div style={{
        width:"1200px", height:"630px", display:"flex", flexDirection:"column",
        justifyContent:"flex-end", padding:"48px", color:"#fff",
        background:"radial-gradient(40% 60% at 20% 10%, rgba(215,255,60,.18), transparent 60%), radial-gradient(40% 60% at 80% 10%, rgba(155,92,255,.20), transparent 60%), linear-gradient(180deg, #000 0%, #0A0A0A 100%)"
      }}>
        <div style={{ fontSize: 16, opacity:.8, textTransform:"uppercase" }}>thecueRoom</div>
        <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}