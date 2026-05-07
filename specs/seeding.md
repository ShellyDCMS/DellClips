# Step 1: Collect Videos from Users

Continue collecting video files from Dell employees. Store them in a shared drive with a naming convention:

DellClips-Videos/
├── john.doe@dell.com/
│ ├── q4-highlights.mp4
│ └── team-intro.mp4
├── jane.smith@dell.com/
│ ├── product-demo.mp4
│ └── onboarding-tips.mp4
└── manifest.csv

# Step 2: Maintain a Manifest Spreadsheet

Keep a CSV or spreadsheet mapping each video to its owner:

| File              | User Email          | Title            | Description                          | Hashtags            |
| :---------------- | :------------------ | :--------------- | :----------------------------------- | :------------------ |
| q4-highlights.mp4 | john.doe@dell.com   | Q4 Highlights    | Our biggest wins this quarter        | engineering,q4,wins |
| product-demo.mp4  | jane.smith@dell.com | New Product Demo | Quick walkthrough of the new feature | product,demo        |

# Step 3: When Video Upload Is Ready (Cloudflare Stream Activated)

You'll run a bulk upload script that:

1. Uploads each video to Cloudflare Stream
2. Gets the assetId and playbackId back
3. Creates the database record attributed to the correct user
