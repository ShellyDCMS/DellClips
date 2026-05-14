import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema });

// ============================================
// EDIT THIS ARRAY WITH YOUR ACTUAL DATA
//
// cloudflareUid: The Video UID from Cloudflare Stream dashboard
//                (upload videos there first, then copy the UID)
//
// If you don't have Cloudflare UIDs yet, upload videos at:
//   https://dash.cloudflare.com → Stream → Videos → Upload
// ============================================
const USER_VIDEOS = [
  {
    userEmail: "Kevin.Mcmahon@Dell.com",
    userName: "Kevin Mcmahon",
    videos: [
      {
        cloudflareUid: "0576cd43a59c4c96a48db6bf1bda3683",
        title: "Contry name and time difference from country code",
        description:
          "Getting contry name and time difference from country code automatically",
        hashtags: ["supply-chain"],
      },
    ],
  },
];

// ============================================
// Helper: Generate name from email (for new users)
// ============================================
function generateNameFromEmail(email: string): string {
  const localPart = email.split("@")[0];
  return (
    localPart
      .replace(/[._-]/g, " ")
      .replace(/\d+/g, "")
      .trim()
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")
      .trim() || localPart
  );
}

async function seed() {
  // Validate that all Cloudflare UIDs are filled in
  const missingUids = USER_VIDEOS.flatMap((u) =>
    u.videos
      .filter((v) => v.cloudflareUid.startsWith("PASTE"))
      .map((v) => `${u.userEmail}: "${v.title}"`)
  );

  if (missingUids.length > 0) {
    console.error("❌ The following videos are missing Cloudflare UIDs:\n");
    missingUids.forEach((v) => console.error(`   - ${v}`));
    console.error("\n📹 Upload videos to Cloudflare Stream first:");
    console.error("   https://dash.cloudflare.com → Stream → Videos → Upload");
    console.error("   Then copy each Video UID and paste it into this script.\n");
    process.exit(1);
  }

  console.log("🌱 Seeding user videos...\n");

  for (const userData of USER_VIDEOS) {
    // Find or create user
    let [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, userData.userEmail))
      .limit(1);

    if (!user) {
      const name = userData.userName || generateNameFromEmail(userData.userEmail);
      [user] = await db
        .insert(schema.users)
        .values({
          email: userData.userEmail,
          name,
          role: "user",
        })
        .returning();
      console.log(`👤 Created user: ${userData.userEmail} (${name})`);
    } else {
      // Update name if user exists but has no name
      if (!user.name && userData.userName) {
        await db
          .update(schema.users)
          .set({ name: userData.userName })
          .where(eq(schema.users.id, user.id));
        console.log(`👤 Updated name for: ${userData.userEmail}`);
      } else {
        console.log(`👤 Found existing user: ${userData.userEmail}`);
      }
    }

    // Create videos
    for (const videoData of userData.videos) {
      // Check if video with this Cloudflare UID already exists
      const [existingByUid] = await db
        .select()
        .from(schema.videos)
        .where(eq(schema.videos.videoAssetId, videoData.cloudflareUid))
        .limit(1);

      if (existingByUid) {
        console.log(`  ⏭️  Skipping "${videoData.title}" (Cloudflare UID already in DB)`);
        continue;
      }

      // Also check by title (prevent duplicates from re-runs with different UIDs)
      const [existingByTitle] = await db
        .select()
        .from(schema.videos)
        .where(eq(schema.videos.title, videoData.title))
        .limit(1);

      if (existingByTitle) {
        console.log(`  ⏭️  Skipping "${videoData.title}" (title already exists)`);
        continue;
      }

      const [video] = await db
        .insert(schema.videos)
        .values({
          userId: user.id,
          title: videoData.title,
          description: videoData.description,
          videoAssetId: videoData.cloudflareUid,
          videoPlaybackId: videoData.cloudflareUid,
          status: "ready",
          duration: 30,
        })
        .returning({ id: schema.videos.id });

      // Attach hashtags
      for (const tag of videoData.hashtags) {
        let [hashtag] = await db
          .select()
          .from(schema.hashtags)
          .where(eq(schema.hashtags.name, tag))
          .limit(1);

        if (!hashtag) {
          [hashtag] = await db.insert(schema.hashtags).values({ name: tag }).returning();
        }

        await db
          .insert(schema.videoHashtags)
          .values({ videoId: video.id, hashtagId: hashtag.id })
          .onConflictDoNothing();
      }

      console.log(
        `  ✅ "${videoData.title}" → ${userData.userEmail} (CF: ${videoData.cloudflareUid.slice(0, 8)}...)`
      );
    }
  }

  console.log("\n🌱 Seeding complete!");
}

seed().catch(console.error);
