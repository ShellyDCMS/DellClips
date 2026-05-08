import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Replace these with your actual Google Drive file IDs
const GDRIVE_VIDEOS = [
  {
    gdriveFileId: "1oYvLaJF-EjaX6tk2iEVT2tvZKJpK-nDc",
    userEmail: "vishaka.mani@dell.com",
    userName: "Vishaka Mani",
    title: "DEV IQ Slack Bot",
    description: "An expert bot (created using DevIQ) in slack",
    hashtags: ["deviq", "bot", "slack"],
  },
  {
    gdriveFileId: "1G9sy1QzIIAKAm0hkvnIQRrsQBYBQCWeb",
    userEmail: "shelly.goldblit@dell.com",
    userName: "Shell Goldblit",
    title: "Pokedex created with SWE 1.6",
    description:
      "prompt: build a pokemon catalog application using pokeapi. it should show the image of a current pokemon, allow the user to browse through pokemons using Prev and Nect buttons, display pokemon name. please builkd a single html page, use only js, no python or other dependencies. use the pokeapi as backend server",
    hashtags: ["good-first-project"],
  },
  // Add more videos...
];

async function seed() {
  console.log("🌱 Seeding Google Drive videos...\n");

  for (const entry of GDRIVE_VIDEOS) {
    // Skip placeholder entries
    if (entry.gdriveFileId.startsWith("REPLACE")) {
      console.log(`⏭️  Skipping "${entry.title}" — replace the file ID first`);
      continue;
    }

    // Create user if they don't exist
    let [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, entry.userEmail))
      .limit(1);

    if (!user) {
      [user] = await db
        .insert(schema.users)
        .values({
          email: entry.userEmail,
          name: entry.userName,
          role: "user",
        })
        .returning();
      console.log(`👤 Created user: ${entry.userEmail}`);
    }

    // Create video record with Google Drive asset ID
    const assetId = `gdrive-${entry.gdriveFileId}`;

    const [existing] = await db
      .select()
      .from(schema.videos)
      .where(eq(schema.videos.videoAssetId, assetId))
      .limit(1);

    if (existing) {
      console.log(`⏭️  Skipping "${entry.title}" (already exists)`);
      continue;
    }

    const [video] = await db
      .insert(schema.videos)
      .values({
        userId: user.id,
        title: entry.title,
        description: entry.description,
        videoAssetId: assetId,
        videoPlaybackId: assetId,
        status: "ready",
        duration: 30,
      })
      .returning({ id: schema.videos.id });

    // Attach hashtags
    for (const tag of entry.hashtags) {
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
      `✅ "${entry.title}" → ${entry.userEmail} (GDrive: ${entry.gdriveFileId})`
    );
  }

  console.log("\n🌱 Seeding complete!");
}

seed().catch(console.error);
