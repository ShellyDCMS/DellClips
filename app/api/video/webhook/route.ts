import { databaseService, videoService } from "@/lib/services";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET — Endpoint health check
export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}

// HEAD — Verification ping
export async function HEAD() {
  return new Response(null, { status: 200 });
}

// POST — Handles verification challenges AND video-ready notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signatureHeader = request.headers.get("Webhook-Signature") || "";

    // Verify the webhook signature (vendor-specific)
    // This prevents spoofed webhook requests from malicious actors
    if (!videoService.verifyWebhookSignature(body, signatureHeader)) {
      console.error("[webhook] Signature verification FAILED — rejecting");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Delegate parsing to the video service adapter
    const result = videoService.parseWebhook(body);

    switch (result.type) {
      case "verification":
        console.log("[webhook] Verification challenge received");
        return new Response(result.challenge || "", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });

      case "video_ready":
        console.log(
          `[webhook] Video ${result.assetId} is ready. Duration: ${result.duration}s`
        );
        if (result.assetId) {
          await databaseService.updateVideoStatus(
            result.assetId,
            "ready",
            result.duration
          );
          revalidatePath("/feed");
          revalidatePath("/");
        }
        return NextResponse.json({ received: true, status: "ready" });

      case "video_error":
        console.error(`[webhook] Video ${result.assetId} failed: ${result.errorReason}`);
        if (result.assetId) {
          await databaseService.updateVideoStatus(result.assetId, "errored");
        }
        return NextResponse.json({ received: true, status: "errored" });

      case "unknown":
      default:
        console.log("[webhook] Unknown event, acknowledging");
        return NextResponse.json({ received: true, status: "acknowledged" });
    }
  } catch (error) {
    console.error("[webhook] Error:", error);
    return NextResponse.json(
      { received: true, error: "Processing failed" },
      { status: 200 }
    );
  }
}
