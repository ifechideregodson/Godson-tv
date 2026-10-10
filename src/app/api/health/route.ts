import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "godsotv",
    timestamp: new Date().toISOString(),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    streamingConfigured: Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_STREAM_API_TOKEN),
  });
}
