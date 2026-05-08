import { NeonDatabaseService } from "@/lib/adapters/neon-database-service";
import { GDriveVideoService } from "./adapters/gdrive-video-service";
// import { GmailEmailService } from "./adapters/gmail-email-service";
import { ResendEmailService } from "@/lib/adapters/resend-email-service";

// ============================================
// COMPOSITION ROOT
// ============================================
// This is the ONLY file that knows about specific vendors.
// To swap ANY provider, change ONLY the import + instantiation here.
// Zero changes to business logic, API routes, or UI components.
// ============================================

// export const videoService = new CloudflareVideoService();
// export const videoService = new DemoVideoService();
export const videoService = new GDriveVideoService();
export const emailService = new ResendEmailService();

// export const emailService = new GmailEmailService();
export const databaseService = new NeonDatabaseService();

// Future swaps (examples):
// import { MuxVideoService } from "@/lib/adapters/mux-video-service";
// export const videoService = new MuxVideoService();
//
// import { SendGridEmailService } from "@/lib/adapters/sendgrid-email-service";
// export const emailService = new SendGridEmailService();
//
// import { SupabaseDatabaseService } from "@/lib/adapters/supabase-database-service";
// export const databaseService = new SupabaseDatabaseService();
