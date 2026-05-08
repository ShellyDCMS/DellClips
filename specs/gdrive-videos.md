# Video Management Guide

## How to Add Videos to DellClips via Google Drive

---

## Overview

Until Cloudflare Stream is activated, DellClips uses Google Drive as
temporary video storage. Videos are uploaded manually to a shared
Google Drive folder, and their file IDs are recorded in the DellClips
database.

This guide explains how to:

1. Upload videos to Google Drive
2. Extract the video file IDs
3. Add the videos to DellClips (attributed to the correct user)

---

## Prerequisites

- Access to the DellClips shared Google Drive folder
- Videos in MP4 format (recommended: vertical 9:16 aspect ratio,
  max 60 seconds, max 200 MB)
- Access to the DellClips codebase (for running seed scripts)
- The `.env.local` file with a valid `DATABASE_URL`

---

## Step 1: Prepare Your Videos

### Recommended Video Specifications

| Setting          | Recommended Value            |
| :--------------- | :--------------------------- |
| **Format**       | MP4 (H.264 codec)            |
| **Aspect Ratio** | 9:16 (vertical / portrait)   |
| **Resolution**   | 1080 x 1920 (1080p vertical) |
| **Duration**     | Max 60 seconds               |
| **File Size**    | Max 200 MB                   |
| **Frame Rate**   | 30 fps                       |

### Naming Convention

Name files using the uploader's email and a short description:

```
john.doe@dell.com - Q4 Engineering Highlights.mp4
jane.smith@dell.com - Sales Kickoff 2026.mp4
mike.chen@dell.com - Customer Success Story.mp4
```

---

## Step 2: Upload Videos to Google Drive

### From a Computer (Web Browser)

1. Go to [drive.google.com](https://drive.google.com) and sign in
2. Navigate to the shared folder: **DellClips Videos**
   (create it if it doesn't exist)
3. Click the **"+ New"** button in the top-left corner
4. Select **"File upload"**
5. Select the video file(s) from your computer
6. Wait for the upload to complete

Alternatively, **drag and drop** the video files directly into the
Google Drive browser window.

### From a Mobile Device

1. Open the **Google Drive** app
2. Navigate to the **DellClips Videos** folder
3. Tap the **"+"** (Plus) button in the bottom-right corner
4. Select **"Upload"** → **"Photos and Videos"**
5. Select the video and wait for the upload to finish

---

## Step 3: Set Sharing Permissions

**Each video must be shared with "Anyone with the link"** so that
the DellClips app can access it for playback.

1. Right-click the uploaded video file
2. Select **"Share"** → **"Share"**
3. Under **"General access"**, click **"Restricted"**
4. Change it to **"Anyone with the link"**
5. Set the role to **"Viewer"** (not Editor)
6. Click **"Done"**

> **Important:** If this step is skipped, the video will not play
> in DellClips. Users will see a blank/black video player.

---

## Step 4: Extract the Video File ID

Every file in Google Drive has a unique ID embedded in its URL.
You need to extract this ID for each video.

### Method 1: From the Share Link

1. Right-click the video → **"Share"** → **"Copy link"**
2. The link will look like this:

```
https://drive.google.com/file/d/1A2b3C4d5E6f7G8h9I0jKlMnOpQrStUvW/view?usp=sharing
```

3. The **File ID** is the long string between `/d/` and `/view`:

```
1A2b3C4d5E6f7G8h9I0jKlMnOpQrStUvW
```

### Method 2: From the Browser URL

1. Double-click the video file in Google Drive to open the preview
2. Look at your browser's address bar:

```
https://drive.google.com/file/d/1A2b3C4d5E6f7G8h9I0jKlMnOpQrStUvW/view
```

3. Copy the string between `/d/` and `/view`

### Method 3: Using Google Drive API (Bulk)

For multiple files, use the Google Drive API to list all files in
the folder:

```bash
# Requires: pip install google-api-python-client
# Or use Google's API Explorer:
# https://developers.google.com/drive/api/v3/reference/files/list
```

---

## Step 5: Record Video Information

For each video, record the following information in a spreadsheet
or CSV file. This data will be used to add the videos to DellClips.

### Template: `video-manifest.csv`

```csv
gdriveFileId,userEmail,userName,title,description,hashtags
1A2b3C4d5E6f7G8h9I0jKlMnOpQrStUvW,john.doe@dell.com,John Doe,Q4 Engineering Highlights,A look back at our biggest achievements this quarter,"engineering,highlights,q4"
2B3c4D5e6F7g8H9i0J1kLmNoPqRsTuVwX,jane.smith@dell.com,Jane Smith,Sales Kickoff 2026,Key takeaways from this year's SKO,"sales,sko,2026"
3C4d5E6f7G8h9I0j1K2lMnOpQrStUvWxY,mike.chen@dell.com,Mike Chen,Customer Success Story,How we helped Acme Corp transform their infrastructure,"customer,success,infrastructure"
```

### Field Descriptions

| Field          | Required | Description                                                    | Example                     |
| :------------- | :------- | :------------------------------------------------------------- | :-------------------------- |
| `gdriveFileId` | ✅ Yes   | The Google Drive file ID extracted in Step 4                   | `1A2b3C4d5E6f7G8h9I0j...`   |
| `userEmail`    | ✅ Yes   | The `@dell.com` email of the person who created/owns the video | `john.doe@dell.com`         |
| `userName`     | ✅ Yes   | Display name for the video author                              | `John Doe`                  |
| `title`        | ✅ Yes   | Video title (max 500 characters)                               | `Q4 Engineering Highlights` |
| `description`  | Optional | Video description (max 2000 characters)                        | `A look back at...`         |
| `hashtags`     | Optional | Comma-separated hashtags (no # prefix, max 10)                 | `engineering,highlights,q4` |

---

## Step 6: Add Videos to DellClips Database

There are two methods to add the videos to the DellClips database.

### Method A: Using the Seed Script (Recommended for Bulk)

1. Open `scripts/seed-gdrive-videos.ts` in your code editor

2. Update the `GDRIVE_VIDEOS` array with your video information:

```typescript
const GDRIVE_VIDEOS = [
  {
    gdriveFileId: "1A2b3C4d5E6f7G8h9I0jKlMnOpQrStUvW",
    userEmail: "john.doe@dell.com",
    userName: "John Doe",
    title: "Q4 Engineering Highlights",
    description: "A look back at our biggest achievements this quarter",
    hashtags: ["engineering", "highlights", "q4"],
  },
  {
    gdriveFileId: "2B3c4D5e6F7g8H9i0J1kLmNoPqRsTuVwX",
    userEmail: "jane.smith@dell.com",
    userName: "Jane Smith",
    title: "Sales Kickoff 2026",
    description: "Key takeaways from this year's SKO",
    hashtags: ["sales", "sko", "2026"],
  },
  // Add more videos here...
];
```

3. Run the seed script:

```bash
npm run seed:gdrive
```

4. Expected output:

```
🌱 Seeding Google Drive videos...

👤 Created user: john.doe@dell.com
✅ "Q4 Engineering Highlights" → john.doe@dell.com (GDrive: 1A2b3C...)
👤 Created user: jane.smith@dell.com
✅ "Sales Kickoff 2026" → jane.smith@dell.com (GDrive: 2B3c4D...)

🌱 Seeding complete!
```

### Method B: Using the Admin API (For Individual Videos)

If you are logged in as an admin, you can use the admin API endpoint
to add individual videos:

```bash
curl -X POST https://tiktok-three-psi.vercel.app/api/admin/videos \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -b "YOUR_SESSION_COOKIE" \
  --data '{
    "title": "Q4 Engineering Highlights",
    "description": "A look back at our biggest achievements",
    "videoAssetId": "gdrive-1A2b3C4d5E6f7G8h9I0jKlMnOpQrStUvW",
    "videoPlaybackId": "gdrive-1A2b3C4d5E6f7G8h9I0jKlMnOpQrStUvW",
    "userEmail": "john.doe@dell.com",
    "hashtags": ["engineering", "highlights", "q4"]
  }'
```

> **Note:** The `videoAssetId` and `videoPlaybackId` must be prefixed
> with `gdrive-` followed by the Google Drive file ID. This tells the
> video service adapter to construct the correct playback URL.

---

## Step 7: Verify Videos Appear in DellClips

1. Open DellClips: [tiktok-three-psi.vercel.app](https://tiktok-three-psi.vercel.app)
2. Sign in with your `@dell.com` email
3. Scroll through the feed — you should see the newly added videos
4. Verify each video plays correctly
5. Verify the author name and hashtags display correctly

---

## Troubleshooting

| Problem                              | Cause                                                  | Fix                                                                                      |
| :----------------------------------- | :----------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **Video shows black screen**         | Google Drive sharing not set to "Anyone with the link" | Right-click → Share → Change to "Anyone with the link"                                   |
| **Video doesn't appear in feed**     | Video status is "processing" not "ready"               | Check the seed script set `status: "ready"`                                              |
| **Wrong author name**                | `userEmail` doesn't match an existing user             | The seed script creates the user automatically — check spelling                          |
| **Hashtags don't appear**            | Hashtags not included in seed data                     | Re-run the seed script with hashtags included                                            |
| **"Video not found" error**          | File ID is incorrect                                   | Re-extract the file ID from the Google Drive URL                                         |
| **Video buffers/loads slowly**       | Google Drive serves raw MP4 (no adaptive bitrate)      | Expected behavior — will improve when we switch to Cloudflare Stream                     |
| **Video plays audio but no picture** | Video codec not supported by browser                   | Re-encode the video as H.264 MP4: `ffmpeg -i input.mp4 -c:v libx264 -c:a aac output.mp4` |

---

## Folder Structure

Organize the Google Drive folder like this:

```
DellClips Videos/
├── Uploaded/
│   ├── john.doe@dell.com - Q4 Highlights.mp4
│   ├── jane.smith@dell.com - Sales Kickoff.mp4
│   └── mike.chen@dell.com - Customer Story.mp4
├── Processing/
│   └── (videos being edited/reviewed before upload)
├── Rejected/
│   └── (videos that don't meet guidelines)
└── video-manifest.csv
```

---

## Content Guidelines for Video Submissions

Before uploading a video to DellClips, ensure it meets these
guidelines:

### ✅ Acceptable Content

- Engineering demos and product walkthroughs
- Team introductions and culture videos
- Knowledge sharing and tutorials
- Sales wins and customer success stories
- Company event highlights
- Professional development tips

### ❌ Prohibited Content

- Confidential or restricted Dell data
- Customer names without permission
- Personal attacks or harassment
- Content unrelated to Dell or work
- Videos with copyrighted music
- Content that violates Dell's Code of Conduct

### Video Quality Tips

- **Lighting:** Face a window or light source. Avoid backlit shots.
- **Audio:** Record in a quiet room. Speak clearly and at normal pace.
- **Framing:** Vertical (portrait) orientation. Center yourself in frame.
- **Length:** Keep it under 60 seconds. Shorter is better.
- **Background:** Clean, professional background. Blur if needed.

---

## Future: Migration to Cloudflare Stream

When Cloudflare Stream is activated, the video storage process will
change:

| Current (Google Drive)        | Future (Cloudflare Stream)             |
| :---------------------------- | :------------------------------------- |
| Manual upload to Google Drive | Upload directly through DellClips app  |
| Manual file ID extraction     | Automatic — API returns the ID         |
| Manual seed script            | Automatic — webhook saves to database  |
| Raw MP4 (may buffer)          | HLS adaptive bitrate (smooth playback) |
| 15 GB free storage            | Pay-as-you-go (~$5-10/mo)              |

The migration will require:

1. Changing one line in `lib/services.ts` (swap adapter)
2. Re-uploading videos to Cloudflare Stream
3. Updating the database with new playback IDs

No changes to the UI, API routes, or database schema are needed.

---

_Document Version: 1.0_
_Last Updated: [Date]_
_Related Documents: ARCHITECTURE.md, HLD.md, POWER_AUTOMATE_SETUP.md_
