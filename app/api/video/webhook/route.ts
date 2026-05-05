import { databaseService } from "@/lib/services";
import { NextRequest, NextResponse } from "next/server";

// Cloudflare Stream sends a POST when video processing completes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[webhook] Received:", JSON.stringify(body, null, 2));

    // Cloudflare Stream webhook payload structure
    // See: https://developers.cloudflare.com/stream/manage-video-library/using-webhooks/
    const uid = body?.uid;
    const status = body?.status;
    const duration = body?.duration;
    const readyToStream = body?.readyToStream;

    if (!uid) {
      console.error("[webhook] Missing uid in webhook payload");
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    if (readyToStream === true || status?.state === "ready") {
      console.log(`[webhook] Video ${uid} is ready. Duration: ${duration}s`);

      await databaseService.updateVideoStatus(uid, "ready", duration || undefined);

      return NextResponse.json({ received: true, status: "ready" });
    }

    if (status?.state === "error") {
      console.error(`[webhook] Video ${uid} failed:`, status?.errorReasonCode);

      await databaseService.updateVideoStatus(uid, "errored");

      return NextResponse.json({ received: true, status: "errored" });
    }

    // For any other status (e.g., "inprogress"), acknowledge but don't update
    console.log(`[webhook] Video ${uid} status: ${status?.state || "unknown"}`);
    return NextResponse.json({ received: true, status: "acknowledged" });
  } catch (error) {
    console.error("[webhook] Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// Cloudflare may send HEAD requests to verify the webhook URL
export async function HEAD() {
  return new Response(null, { status: 200 });
}
