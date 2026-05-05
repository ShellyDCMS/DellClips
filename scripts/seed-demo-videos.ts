import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";

const DEMO_VIDEOS = [
  {
    assetId: "demo-big-buck-bunny",
    playbackId: "demo-big-buck-bunny",
    title: "🚀 Welcome to DellClips!",
    description:
      "This is a demo video showing what DellClips looks like. Upload your own videos to replace these!",
    hashtags: ["welcome", "demo", "dellclips"],
  },
  {
    assetId: "demo-sintel",
    playbackId: "demo-sintel",
    title: "Q4 Engineering Highlights",
    description:
      "A look back at what the engineering team accomplished this quarter. #engineering #highlights",
    hashtags: ["engineering", "highlights", "q4"],
  },
  {
    assetId: "demo-tears-of-steel",
    playbackId: "demo-tears-of-steel",
    title: "New Hire Onboarding Tips",
    description:
      "Quick tips for new Dell employees on getting started. #onboarding #tips",
    hashtags: ["onboarding", "tips", "newhire"],
  },
  {
    assetId: "demo-elephant-dream",
    playbackId: "demo-elephant-dream",
    title: "Sales Team Q3 Wins 🎉",
    description: "Celebrating our biggest deals this quarter! #sales #wins",
    hashtags: ["sales", "wins", "celebration"],
  },
  {
    assetId: "demo-test-pattern",
    playbackId: "demo-test-pattern",
    title: "How to Use DellClips",
    description: "A quick walkthrough of all the features in DellClips. #tutorial #howto",
    hashtags: ["tutorial", "howto", "dellclips"],
  },
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  console.log("🌱 Seeding demo data...\n");

  // Create a demo user if none exists
  const existingUsers = await db.select().from(schema.users).limit(1);

  let userId: string;

  if (existingUsers.length > 0) {
    userId = existingUsers[0].id;
    console.log(`Using existing user: ${existingUsers[0].email}`);
  } else {
    const [newUser] = await db
      .insert(schema.users)
      .values({
        email: "demo@dell.com",
        name: "DellClips Demo",
        role: "user",
      })
      .returning({ id: schema.users.id });
    userId = newUser.id;
    console.log("Created demo user: demo@dell.com");
  }

  // Insert demo videos
  for (const video of DEMO_VIDEOS) {
    try {
      // Check if video already exists
      const existing = await db
        .select()
        .from(schema.videos)
        .where(require("drizzle-orm").eq(schema.videos.videoAssetId, video.assetId))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  Skipping "${video.title}" (already exists)`);
        continue;
      }

      // Insert video
      const [inserted] = await db
        .insert(schema.videos)
        .values({
          userId,
          title: video.title,
          description: video.description,
          videoAssetId: video.assetId,
          videoPlaybackId: video.playbackId,
          status: "ready",
          duration: 60,
        })
        .returning({ id: schema.videos.id });

      // Insert hashtags
      for (const tag of video.hashtags) {
        // Upsert hashtag
        let hashtagId: string;
        const [existing] = await db
          .select()
          .from(schema.hashtags)
          .where(require("drizzle-orm").eq(schema.hashtags.name, tag))
          .limit(1);

        if (existing) {
          hashtagId = existing.id;
        } else {
          const [created] = await db
            .insert(schema.hashtags)
            .values({ name: tag })
            .returning({ id: schema.hashtags.id });
          hashtagId = created.id;
        }

        // Link hashtag to video
        await db
          .insert(schema.videoHashtags)
          .values({ videoId: inserted.id, hashtagId })
          .onConflictDoNothing();
      }

      console.log(`✅ Inserted "${video.title}" with tags: ${video.hashtags.join(", ")}`);
    } catch (err) {
      console.error(`❌ Failed to insert "${video.title}":`, err);
    }
  }

  console.log("\n🌱 Seeding complete!");
}

seed().catch(console.error);
