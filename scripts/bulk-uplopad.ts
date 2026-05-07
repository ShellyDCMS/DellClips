import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

// This script will be used when Cloudflare Stream is activated
// For now, it serves as a template

interface VideoEntry {
  filePath: string;
  userEmail: string;
  title: string;
  description: string;
  hashtags: string[];
}

// Read from manifest CSV or define inline
const VIDEOS_TO_UPLOAD: VideoEntry[] = [
  {
    filePath: "./collected-videos/john.doe@dell.com/q4-highlights.mp4",
    userEmail: "john.doe@dell.com",
    title: "Q4 Engineering Highlights",
    description: "Our biggest wins this quarter",
    hashtags: ["engineering", "q4", "wins"],
  },
  // Add more entries...
];

async function bulkUpload() {
  const _adminToken = process.env.ADMIN_API_TOKEN; // You'll create this
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  console.log(`📹 Uploading ${VIDEOS_TO_UPLOAD.length} videos...\n`);

  for (const entry of VIDEOS_TO_UPLOAD) {
    try {
      console.log(`Uploading: "${entry.title}" for ${entry.userEmail}`);

      // Step 1: Get upload URL from Cloudflare
      // (This will work when Cloudflare Stream is activated)
      // const uploadRes = await fetch(`${appUrl}/api/video/upload-url`, {
      //   method: "POST",
      //   headers: { Authorization: `Bearer ${adminToken}` },
      // });
      // const { uploadUrl, assetId } = await uploadRes.json();

      // Step 2: Upload the file to Cloudflare
      // const fileBuffer = fs.readFileSync(entry.filePath);
      // await fetch(uploadUrl, {
      //   method: "PUT",
      //   body: fileBuffer,
      //   headers: { "Content-Type": "video/mp4" },
      // });

      // Step 3: Create the database record attributed to the user
      // For now with demo adapter, use demo asset IDs
      const demoAssetId = `uploaded-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const res = await fetch(`${appUrl}/api/admin/videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: "YOUR_ADMIN_SESSION_COOKIE", // You'll get this from browser
        },
        body: JSON.stringify({
          title: entry.title,
          description: entry.description,
          videoAssetId: demoAssetId,
          videoPlaybackId: demoAssetId,
          userEmail: entry.userEmail,
          hashtags: entry.hashtags,
        }),
      });

      if (res.ok) {
        console.log(`  ✅ Uploaded and attributed to ${entry.userEmail}`);
      } else {
        const error = await res.json();
        console.log(`  ❌ Failed: ${error.error}`);
      }
    } catch (err) {
      console.error(`  ❌ Error: ${(err as Error).message}`);
    }
  }

  console.log("\n📹 Bulk upload complete!");
}

bulkUpload();
