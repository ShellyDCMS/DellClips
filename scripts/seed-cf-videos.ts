import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Replace these with your actual Cloudflare Stream Video UIDs
const CF_VIDEOS = [
  {
    videoUid: "331dcd41b4e479550a688710467fb039",
    userEmail: "vishaka.mani@dell.com",
    userName: "Vishaka Mani",
    title: "DEV IQ Slack Bot",
    description: "An expert bot (created using DevIQ) in slack",
    hashtags: ["deviq", "bot", "slack"],
  },
  {
    videoUid: "1071b14705af5d9eee06fcfde2f5e75e",
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
  console.log("🌱 Seeding Cloudflare Stream videos...\n");

  for (const entry of CF_VIDEOS) {
    if (entry.videoUid.startsWith("REPLACE")) {
      console.log(`⏭️  Skipping "${entry.title}" — replace the video UID first`);
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

    // Check if video already exists
    const [existing] = await db
      .select()
      .from(schema.videos)
      .where(eq(schema.videos.videoAssetId, entry.videoUid))
      .limit(1);

    if (existing) {
      console.log(`⏭️  Skipping "${entry.title}" (already exists)`);
      continue;
    }

    // Create video record
    const [video] = await db
      .insert(schema.videos)
      .values({
        userId: user.id,
        title: entry.title,
        description: entry.description,
        videoAssetId: entry.videoUid,
        videoPlaybackId: entry.videoUid,
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

    console.log(`✅ "${entry.title}" → ${entry.userEmail} (CF: ${entry.videoUid})`);
  }

  console.log("\n🌱 Seeding complete!");
}

seed().catch(console.error);
