import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const USER_VIDEOS = [
  {
    userEmail: "john.doe@dell.com",
    userName: "John Doe",
    videos: [
      {
        title: "Q4 Engineering Highlights",
        description: "A look back at our biggest achievements this quarter",
        hashtags: ["engineering", "highlights", "q4"],
      },
      {
        title: "New CI/CD Pipeline Demo",
        description: "How we cut build times by 50%",
        hashtags: ["devops", "cicd", "demo"],
      },
    ],
  },
  {
    userEmail: "jane.smith@dell.com",
    userName: "Jane Smith",
    videos: [
      {
        title: "Sales Kickoff 2026",
        description: "Key takeaways from this year's SKO",
        hashtags: ["sales", "sko", "2026"],
      },
    ],
  },
  {
    userEmail: "mike.chen@dell.com",
    userName: "Mike Chen",
    videos: [
      {
        title: "Customer Success Story",
        description: "How we helped Acme Corp transform their infrastructure",
        hashtags: ["customer", "success", "infrastructure"],
      },
    ],
  },
];

async function seed() {
  console.log("🌱 Seeding user videos...\n");

  for (const userData of USER_VIDEOS) {
    // Create user if they don't exist
    let [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, userData.userEmail))
      .limit(1);

    if (!user) {
      [user] = await db
        .insert(schema.users)
        .values({
          email: userData.userEmail,
          name: userData.userName,
          role: "user",
        })
        .returning();
      console.log(`👤 Created user: ${userData.userEmail}`);
    } else {
      console.log(`👤 Found existing user: ${userData.userEmail}`);
    }

    // Create videos for this user
    for (const videoData of userData.videos) {
      const assetId = `demo-${userData.userEmail.split("@")[0]}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      // Check if video already exists
      const [existing] = await db
        .select()
        .from(schema.videos)
        .where(eq(schema.videos.title, videoData.title))
        .limit(1);

      if (existing) {
        console.log(`  ⏭️  Skipping "${videoData.title}" (already exists)`);
        continue;
      }

      const [video] = await db
        .insert(schema.videos)
        .values({
          userId: user.id,
          title: videoData.title,
          description: videoData.description,
          videoAssetId: assetId,
          videoPlaybackId: assetId,
          status: "ready",
          duration: 30 + Math.floor(Math.random() * 30),
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

      console.log(`  ✅ "${videoData.title}" → attributed to ${userData.userEmail}`);
    }
  }

  console.log("\n🌱 Seeding complete!");
}

seed().catch(console.error);
