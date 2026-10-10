import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const allowed = (process.env.GODSOTV_ADMIN_EMAILS ?? "").split(",").map(x => x.trim().toLowerCase());
  if (!email || !allowed.includes(email)) {
    return NextResponse.json({ error: "Forbidden: administrator sign-in required." }, { status: 403 });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN;
  if (!accountId || !token) {
    return NextResponse.json({ error: "Cloudflare Stream credentials are not configured on the server." }, { status: 503 });
  }

  let title = "Godsotv Live";
  try {
    const body = await request.json();
    if (typeof body.title === "string" && body.title.trim()) title = body.title.trim().slice(0, 120);
  } catch {
    return NextResponse.json({ error: "Send a JSON body with a title." }, { status: 400 });
  }

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      enabled: true,
      meta: { name: title },
      preferLowLatency: false,
      recording: { mode: "automatic", requireSignedURLs: false, hideLiveViewerCount: false, timeoutSeconds: 0 }
    }),
    cache: "no-store",
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success || !result?.result?.uid) {
    return NextResponse.json({ error: "Cloudflare could not create the live input.", providerStatus: response.status }, { status: 502 });
  }

  const live = result.result;
  const playbackUrl = live?.meta?.playback?.hls ?? live?.playback?.hls ?? `https://customer-<your-customer-code>.cloudflarestream.com/${live.uid}/manifest/video.m3u8`;
  await prisma.mediaItem.upsert({
    where: { streamUid: live.uid },
    update: { title, status: "OFFLINE", type: "LIVE", playbackUrl, isPublished: true },
    create: { title, type: "LIVE", status: "OFFLINE", streamUid: live.uid, playbackUrl, isPublished: true, category: "Live TV" },
  });
  await prisma.auditLog.create({ data: { actor: email!, action: "CREATE_LIVE_INPUT", target: live.uid, details: { title } } });

  // Ingest keys are returned only to the authenticated operator who requested this input.
  return NextResponse.json({
    id: live.uid,
    title,
    ingest: live.rtmps ? { url: live.rtmps.url, streamKey: live.rtmps.streamKey } : null,
    playback: live.playback?.hls ?? playbackUrl,
    message: "Live input created. Keep the stream key secret and paste it only into your encoder (e.g. OBS Studio).",
  }, { status: 201 });
}
