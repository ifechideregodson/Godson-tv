import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const admins = (process.env.GODSOTV_ADMIN_EMAILS ?? "").split(",").map(x => x.trim().toLowerCase());
  if (!email || !admins.includes(email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  if (!accountId || !token) return NextResponse.json({ error: "Cloudflare Stream is not configured." }, { status: 503 });

  let input: { title?: unknown; description?: unknown; category?: unknown };
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const title = typeof input.title === "string" ? input.title.trim().slice(0, 120) : "";
  if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });
  const description = typeof input.description === "string" ? input.description.slice(0, 2000) : "";
  const category = typeof input.category === "string" ? input.category.slice(0, 80) : "General";

  const upstream = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ maxDurationSeconds: 14400, expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(), meta: { name: title, description, category } }),
    cache: "no-store",
  });
  const result = await upstream.json().catch(() => null);
  if (!upstream.ok || !result?.success || !result?.result?.uid || !result?.result?.uploadURL) {
    return NextResponse.json({ error: "Could not create a Cloudflare upload URL.", providerStatus: upstream.status }, { status: 502 });
  }
  const uid = result.result.uid as string;
  await prisma.mediaItem.upsert({
    where: { streamUid: uid },
    update: { title, description, category, type: "VIDEO", status: "PROCESSING", isPublished: false },
    create: { title, description, category, type: "VIDEO", status: "PROCESSING", streamUid: uid, isPublished: false },
  });
  await prisma.auditLog.create({ data: { actor: email!, action: "CREATE_DIRECT_UPLOAD", target: uid, details: { title, category } } });
  return NextResponse.json({ uid, uploadURL: result.result.uploadURL, message: "Upload URL created. Upload the video directly to this URL from the authenticated studio UI." }, { status: 201 });
}
