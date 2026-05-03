# Product Requirements Document (PRD)

## Dell Internal Short-Form Video Platform ("DellClips")

---

### 1. Overview

An internal, mobile-first short-form video platform designed exclusively for
Dell Technologies employees. The app allows employees to share knowledge,
department updates, product demos, and corporate culture content in a highly
engaging, vertical-scrolling video format — similar to TikTok.

The platform will be accessible via desktop browsers and installable on iOS and
Android devices as a **Progressive Web App (PWA)**, eliminating the need for App
Store or Play Store deployment.

---

### 2. Target Audience

| Segment              | Description                                                 |
| :------------------- | :---------------------------------------------------------- |
| **Primary**          | All Dell employees globally, verified via `@dell.com` email |
| **Content Creators** | HR, Engineering, Sales, Marketing, Leadership teams         |
| **Consumers**        | Any Dell employee browsing the feed from phone or desktop   |

**Example Use Cases:**

- HR announces open enrollment via a 30-second video
- An engineer demos a new internal tool
- A sales team celebrates a quarterly win
- Leadership shares a quick strategic update

---

### 3. Scope & Features (MVP vs. V2)

#### 3.1 Must-Have Features (Phase 1 — MVP)

| #   | Feature                        | Description                                                                                                                                                                                                                                                    |
| :-- | :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **Email-Based Authentication** | Passwordless login via Magic Link or OTP sent to `*@dell.com` email addresses only. No password to remember.                                                                                                                                                   |
| F2  | **PWA Installability**         | Full Progressive Web App support with `manifest.json`, service worker, and "Add to Home Screen" prompt.                                                                                                                                                        |
| F3  | **Vertical Video Feed**        | Infinite-scroll, full-screen vertical video feed with auto-play on scroll (muted by default).                                                                                                                                                                  |
| F4  | **Video Upload**               | Users can upload or record short vertical videos (max 60 seconds, max 200 MB) from mobile or desktop.                                                                                                                                                          |
| F5  | **Like / React**               | Single-tap like button on each video with real-time count.                                                                                                                                                                                                     |
| F6  | **Comments**                   | Threaded text comments on each video.                                                                                                                                                                                                                          |
| F7  | **User Profiles**              | Basic profile page showing the user's name, email, avatar, and their uploaded videos.                                                                                                                                                                          |
| F8  | **Responsive Design**          | Fully functional on mobile (portrait), tablet, and desktop viewports.                                                                                                                                                                                          |
| F9  | **Report Video**               | Users can flag a video as offensive, inappropriate, or containing restricted/confidential data. Reports are stored in the database and surfaced to admins. This is the primary content moderation mechanism since automated video scanning is not implemented. |
| F10 | **Follow / Subscribe**         | Follow specific colleagues or departments to personalize the feed with content from people you care about.                                                                                                                                                     |
| F11 | **Hashtags & Search**          | Tag videos with hashtags (#DellTech, #SalesWin, #Engineering). Search bar to find content by title, description, or hashtag.                                                                                                                                   |

#### 3.2 Nice-to-Have Features (Phase 2 — V2)

| #   | Feature                               | Description                                                                                          |
| :-- | :------------------------------------ | :--------------------------------------------------------------------------------------------------- |
| F12 | **Enterprise SSO (Okta/Entra)**       | Replace Magic Links with Dell's official SSO provider for tighter IT compliance.                     |
| F13 | **Push Notifications**                | Web Push API notifications for replies, likes, or company-wide featured videos.                      |
| F14 | **Content Moderation Dashboard**      | Admin panel for HR/IT to review reported videos, take action (remove/warn), and manage report queue. |
| F15 | **In-App Video Editing**              | Basic trim, crop, and text-overlay tools before publishing.                                          |
| F16 | **Analytics Dashboard**               | View counts, engagement rates, and trending content metrics for leadership.                          |
| F17 | **Video Captions (AI)**               | Auto-generated captions/subtitles for accessibility compliance.                                      |
| F18 | **Passkey Authentication (WebAuthn)** | After initial magic link login,                                                                      |

prompt users to set up FaceID/TouchID/Fingerprint for instant future logins.
Eliminates the email context switch for repeat users while maintaining
passwordless security. |

---

### 4. Non-Functional Requirements

| Requirement        | Target                                                                 |
| :----------------- | :--------------------------------------------------------------------- |
| **Performance**    | Video playback must begin within 2 seconds on 4G connections           |
| **Availability**   | 99.9% uptime (leveraging Vercel + Mux SLAs)                            |
| **Security**       | All traffic over HTTPS; authentication tokens in HttpOnly cookies      |
| **Data Residency** | Video content and user data must comply with Dell's data policies      |
| **Accessibility**  | WCAG 2.1 AA compliance (captions, keyboard navigation, screen readers) |
| **Scalability**    | Must support up to 10,000 concurrent users without degradation         |

---

### 5. ROI & Effort Analysis per Feature

This table helps leadership and engineering prioritize work based on
business value relative to implementation effort.

| Feature                                                                 | Effort    | Estimated Time | Business Value | ROI Rating | Notes                                                                                                                      |
| :---------------------------------------------------------------------- | :-------- | :------------- | :------------- | :--------- | :------------------------------------------------------------------------------------------------------------------------- |
| F1 — Email Auth (`@dell.com`)                                           | 🟢 Low    | 1-2 days       | 🔴 Critical    | ⭐⭐⭐⭐⭐ | Security gate. Non-negotiable. Auth.js + Resend makes this trivial.                                                        |
| F2 — PWA Setup                                                          | 🟢 Low    | 1 day          | 🔴 Critical    | ⭐⭐⭐⭐⭐ | Eliminates App Store process. Single biggest quick win.                                                                    |
| F3 — Video Feed & Playback                                              | 🟡 Medium | 5-7 days       | 🔴 Critical    | ⭐⭐⭐⭐⭐ | The core product. HLS player + CDN makes this production-grade.                                                            |
| F4 — Video Upload                                                       | 🟡 Medium | 5-7 days       | 🔴 Critical    | ⭐⭐⭐⭐   | Direct-to-CDN upload pattern avoids server limits.                                                                         |
| F5 — Likes                                                              | 🟢 Low    | 1 day          | 🟡 High        | ⭐⭐⭐⭐   | Simple DB write. High engagement signal.                                                                                   |
| F6 — Comments                                                           | 🟢 Low    | 2-3 days       | 🟡 High        | ⭐⭐⭐⭐   | Drives community interaction.                                                                                              |
| F7 — User Profiles                                                      | 🟢 Low    | 2 days         | 🟡 High        | ⭐⭐⭐⭐   | Gives identity and ownership to content creators.                                                                          |
| F8 — Responsive Design                                                  | 🟡 Medium | 3-4 days       | 🔴 Critical    | ⭐⭐⭐⭐   | Built into development from day one with Tailwind.                                                                         |
| F9 — Report Video                                                       | 🟢 Low    | 1-2 days       | 🔴 Critical    | ⭐⭐⭐⭐⭐ | Required for compliance. Cannot auto-scan video; user reports are the primary moderation input. Simple DB table + UI menu. |
| F10 — Follow / Subscribe                                                | 🟡 Medium | 3-4 days       | 🟡 High        | ⭐⭐⭐⭐   | Critical for feed personalization and retention once content grows.                                                        |
| F11 — Hashtags & Search                                                 | 🟡 Medium | 4-5 days       | 🟡 High        | ⭐⭐⭐⭐   | Required for content discoverability. PostgreSQL tsvector handles this without external search engine.                     |
| F12 — Enterprise SSO                                                    | 🔴 High   | 2-3 weeks      | 🟡 High        | ⭐⭐⭐     | Important for IT compliance but not needed for MVP launch.                                                                 |
| F13 — Push Notifications                                                | 🔴 High   | 2 weeks        | 🟢 Medium      | ⭐⭐       | Complex cross-platform service worker management.                                                                          |
| F14 — Moderation Dashboard                                              | 🟡 Medium | 1 week         | 🟡 High        | ⭐⭐⭐     | Builds on F9 report data. Admin UI to review and act on reports.                                                           |
| F15 — In-App Video Editing                                              | 🔴 High   | 3-4 weeks      | 🟢 Medium      | ⭐⭐       | Users can edit in their phone's native camera app for now.                                                                 |
| F16 — Analytics Dashboard                                               | 🟡 Medium | 1 week         | 🟢 Medium      | ⭐⭐⭐     | Useful for proving engagement metrics to leadership.                                                                       |
| F17 — AI Captions                                                       | 🟢 Low    | 2-3 days       | 🟡 High        | ⭐⭐⭐⭐   | Can leverage video platform's built-in captioning features.                                                                |
| F18 — Passkey Auth (V2)                                                 | 🟡 Medium | 1 week         | 🟡 High        | ⭐⭐⭐⭐   |
| Auth.js supports WebAuthn natively. Best-in-class UX for repeat logins. |

---

### 6. Success Metrics (KPIs)

| Metric                        | Target (3 months post-launch) |
| :---------------------------- | :---------------------------- |
| Registered Users              | 500+                          |
| Videos Uploaded               | 200+                          |
| Daily Active Users (DAU)      | 100+                          |
| Avg. Session Duration         | > 3 minutes                   |
| Avg. Video Watch-Through Rate | > 60%                         |

---

### 7. Constraints & Assumptions

1. **No App Store Deployment:** The PWA approach is chosen deliberately to avoid
   the timeline and compliance overhead of native app store submissions.
2. **Dell Email Verification:** MVP authentication relies on verifying the
   `@dell.com` domain via magic links. This is secure but not SSO-integrated.
3. **Video Length Limit:** Capped at 60 seconds for MVP to control storage
   costs and encourage concise content.
4. **Internet Required:** No offline video playback in MVP. Service worker
   caches the app shell only.
5. **Content Policy:** Dell HR/Legal must approve a content policy before
   company-wide rollout.
6. **Email Sending Domain:** Magic link authentication requires a verified
   sending domain. The project uses `dellclips.is-a.dev` — a free
   subdomain from the is-a.dev open-source project. This provides full
   DNS control (TXT/MX records) needed for Resend email verification.
   Local development uses console-logged magic link URLs and does not
   require the domain. For production at Dell scale, a Dell-owned
   subdomain (e.g., `dellclips.dell.com`) should replace this.

   ***

### 8. Video Platform Evaluation

This section documents the evaluation of video storage and streaming
options considered for DellClips.

#### 8.1 Options Considered

| Option                | Description                                          |
| :-------------------- | :--------------------------------------------------- |
| **YouTube**           | Free consumer video platform owned by Google         |
| **AWS**               | Amazon Web Services (S3 + MediaConvert + CloudFront) |
| **Cloudflare Stream** | Cloudflare's integrated video streaming product      |
| **Mux**               | Developer-focused video API platform                 |
| **Bunny Stream**      | Budget-friendly video CDN                            |
| **Self-Hosted**       | MinIO + FFmpeg + Nginx on own infrastructure         |

#### 8.2 Evaluation Matrix

| Criteria                   | YouTube     | AWS (S3+MC+CF)   | Cloudflare Stream | Mux            | Bunny Stream   |
| :------------------------- | :---------- | :--------------- | :---------------- | :------------- | :------------- |
| **MVP Monthly Cost**       | $0          | ~$85-90          | ~$5-10            | ~$50-100       | ~$1-3          |
| **Custom Player UI**       | ❌ No       | ✅ Yes           | ✅ Yes            | ✅ Yes         | ✅ Yes         |
| **No Ads / Branding**      | ❌ No       | ✅ Yes           | ✅ Yes            | ✅ Yes         | ✅ Yes         |
| **Adaptive Bitrate HLS**   | ✅ Yes\*    | ✅ Yes           | ✅ Yes            | ✅ Yes         | ✅ Yes         |
| **Auto Transcoding**       | ✅ Yes      | ⚠️ Config needed | ✅ Automatic      | ✅ Automatic   | ✅ Automatic   |
| **Global CDN**             | ✅ Yes      | ✅ Yes           | ✅ 300+ nodes     | ✅ Yes         | ✅ Yes         |
| **Private Access Control** | ❌ Weak     | ✅ Signed URLs   | ✅ Signed URLs    | ✅ Signed URLs | ✅ Token auth  |
| **Setup Complexity**       | 🟢 Low      | 🔴 High          | 🟢 Low            | 🟢 Low         | 🟢 Low         |
| **ToS Compliance**         | 🔴 Violates | ✅ Compliant     | ✅ Compliant      | ✅ Compliant   | ✅ Compliant   |
| **Enterprise-Ready**       | ❌ No       | ✅ Yes           | ✅ Yes            | ✅ Yes         | ⚠️ Limited     |
| **Replaceability**         | ❌ Locked   | ✅ Via adapter   | ✅ Via adapter    | ✅ Via adapter | ✅ Via adapter |

\*YouTube HLS is locked inside their proprietary embedded player.

#### 8.3 Why YouTube Was Rejected

| Problem                         | Impact on DellClips                                                                                                       |
| :------------------------------ | :------------------------------------------------------------------------------------------------------------------------ |
| **No raw file access**          | Cannot build custom TikTok-style vertical UI; forced to use YouTube's iFrame player with YouTube branding and controls    |
| **Ads & competitor content**    | YouTube displays ads and recommends other videos after playback, which could include Dell competitor content              |
| **Terms of Service violation**  | YouTube ToS explicitly prohibits using the platform as a headless hosting backend for third-party applications            |
| **Inadequate privacy controls** | "Unlisted" links can be shared freely; "Private" requires every viewer to have a Google account with manual authorization |
| **Content moderation risk**     | YouTube's automated algorithms can flag and remove internal Dell content without warning or adequate recourse             |

#### 8.4 Why AWS Was Deferred (Not Rejected)

AWS provides enterprise-grade video infrastructure with full control,
but requires significantly more cost, complexity, and setup time
compared to Cloudflare Stream:

| Factor                    | AWS                                                                   | Cloudflare Stream      |
| :------------------------ | :-------------------------------------------------------------------- | :--------------------- |
| **Services to configure** | 3-4 (S3, MediaConvert, CloudFront, IAM)                               | 1 (Stream API)         |
| **MVP monthly cost**      | ~$85-90/mo                                                            | ~$5-10/mo              |
| **Setup time**            | Days (IAM roles, bucket policies, job templates, distribution config) | Hours (single API key) |
| **Transcoding**           | Must configure MediaConvert pipeline                                  | Automatic on upload    |

AWS remains the recommended migration path if Dell IT mandates
AWS-hosted infrastructure. The Hexagonal Architecture (VideoPort
interface) ensures this migration requires only a new adapter file
and a one-line change in the composition root.

#### 8.5 Decision

**Cloudflare Stream** was selected as the MVP video platform because it
provides the optimal balance of cost (~$5-10/mo), simplicity (single
API), capability (auto transcoding + HLS + global CDN), and
replaceability (swappable via VideoPort adapter).

| Phase                              | Video Platform                       | Rationale                                            |
| :--------------------------------- | :----------------------------------- | :--------------------------------------------------- |
| **MVP**                            | Cloudflare Stream                    | Lowest cost, simplest setup, validates the concept   |
| **Scale (if needed)**              | Mux                                  | Superior analytics, AI captions, built-in moderation |
| **Enterprise (if required by IT)** | AWS (S3 + MediaConvert + CloudFront) | Dell IT compliance, full infrastructure control      |
