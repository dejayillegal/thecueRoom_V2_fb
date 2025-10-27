export const runtime = "nodejs";
export const revalidate = 900;
import { NextResponse } from "next/server";
import { getSpotlight } from "@/lib/spotlight/fetchSpotlight";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit  = Math.min(120, Math.max(20, parseInt(searchParams.get("limit")||"80",10)));
  const offset = Math.max(0, parseInt(searchParams.get("offset")||"0",10));
  const items = await getSpotlight(limit, offset);
  return NextResponse.json(items, {
    headers: { "Cache-Control":"public, s-maxage=900, stale-while-revalidate=86400" }
  });
}
