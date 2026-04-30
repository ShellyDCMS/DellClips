import { CloudflareVideoService } from "@/lib/adapters/cloudflare-video-service";
import { ResendEmailService } from "@/lib/adapters/resend-email-service";

// ============================================
// COMPOSITION ROOT
// ============================================
// This is the ONLY file that knows about specific vendors.
// To swap ANY provider, change ONLY the import + instantiation here.
// Zero changes to business logic, API routes, or UI components.
// ============================================

export const videoService = new CloudflareVideoService();
export const emailService = new ResendEmailService();

// Future swaps (example):
// import { MuxVideoService } from "@/lib/adapters/mux-video-service";
// export const videoService = new MuxVideoService();