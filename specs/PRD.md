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

| Segment          | Description                                                        |
| :--------------- | :----------------------------------------------------------------- |
| **Primary**      | All Dell employees globally, verified via `@dell.com` email        |
| **Content Creators** | HR, Engineering, Sales, Marketing, Leadership teams            |
| **Consumers**    | Any Dell employee browsing the feed from phone or desktop          |

**Example Use Cases:**
- HR announces open enrollment via a 30-second video
- An engineer demos a new internal tool
- A sales team celebrates a quarterly win
- Leadership shares a quick strategic update

---

### 3. Functional Requirements

#### 3.1 Must-Have Features (Phase 1 — MVP)

| #  | Feature                        | Description                                                                                                  |
| :- | :----------------------------- | :----------------------------------------------------------------------------------------------------------- |
| F1 | **Email-Based Authentication** | Passwordless login via Magic Link or OTP sent to `*@dell.com` email addresses only. No password to remember. |
| F2 | **PWA Installability**         | Full Progressive Web App support with `manifest.json`, service worker, and "Add to Home Screen" prompt.      |
| F3 | **Vertical Video Feed**        | Infinite-scroll, full-screen vertical video feed with auto-play on scroll (muted by default).                |
| F4 | **Video Upload**               | Users can upload or record short vertical videos (max 60 seconds, max 200 MB) from mobile or desktop.        |
| F5 | **Like / React**               | Single-tap like button on each video with real-time count.                                                   |
| F6 | **Comments**                   | Threaded text comments on each video.                                                                        |
| F7 | **User Profiles**              | Basic profile page showing the user's name, email, avatar, and their uploaded videos.                        |
| F8 | **Responsive Design**          | Fully functional on mobile (portrait), tablet, and desktop viewports.                                        |

#### 3.2 Nice-to-Have Features (Phase 2 — V2)

| #   | Feature                         | Description                                                                                              |
| :-- | :------------------------------ | :------------------------------------------------------------------------------------------------------- |
| F9  | **Enterprise SSO (Okta/Entra)** | Replace Magic Links with Dell's official SSO provider for tighter IT compliance.                          |
| F10 | **Push Notifications**          | Web Push API notifications for replies, likes, or company-wide featured videos.                          |
| F11 | **Hashtags & Search**           | Tag videos with hashtags (#DellTech, #SalesWin); full-text search across titles, descriptions, and tags. |
| F12 | **Content Moderation Dashboard**| Admin panel for HR/IT to review flagged content, remove videos, or suspend accounts.                     |
| F13 | **In-App Video Editing**        | Basic trim, crop, and text-overlay tools before publishing.                                              |
| F14 | **Analytics Dashboard**         | View counts, engagement rates, and trending content metrics for leadership.                              |
| F15 | **Follow / Subscribe**          | Follow specific colleagues or departments to personalize the feed.                                       |
| F16 | **Video Captions (AI)**         | Auto-generated captions/subtitles for accessibility compliance.                                          |

---

### 4. Non-Functional Requirements

| Requirement       | Target                                                                   |
| :---------------- | :----------------------------------------------------------------------- |
| **Performance**   | Video playback must begin within 2 seconds on 4G connections             |
| **Availability**  | 99.9% uptime (leveraging Vercel + Mux SLAs)                             |
| **Security**      | All traffic over HTTPS; authentication tokens in HttpOnly cookies        |
| **Data Residency**| Video content and user data must comply with Dell's data policies        |
| **Accessibility** | WCAG 2.1 AA compliance (captions, keyboard navigation, screen readers)   |
| **Scalability**   | Must support up to 10,000 concurrent users without degradation           |

---

### 5. ROI & Effort Analysis per Feature

This table helps leadership and engineering prioritize work based on
business value relative to implementation effort.

| Feature                          | Effort         | Estimated Time | Business Value | ROI Rating  | Notes                                                                 |
| :------------------------------- | :------------- | :------------- | :------------- | :---------- | :-------------------------------------------------------------------- |
| F1 — Email Auth (`@dell.com`)    | 🟢 Low         | 1–2 days       | 🔴 Critical     | ⭐⭐⭐⭐⭐       | Security gate. Non-negotiable. Auth.js + Resend makes this trivial.   |
| F2 — PWA Setup                   | 🟢 Low         | 1 day          | 🔴 Critical     | ⭐⭐⭐⭐⭐       | Eliminates App Store process. Single biggest quick win.               |
| F3 — Video Feed & Playback       | 🟡 Medium      | 5–7 days       | 🔴 Critical     | ⭐⭐⭐⭐⭐       | The core product. Mux Player + HLS makes this production-grade.      |
| F4 — Video Upload                | 🟡 Medium      | 5–7 days       | 🔴 Critical     | ⭐⭐⭐⭐        | Direct-to-Mux upload pattern avoids Vercel limits.                    |
| F5 — Likes                       | 🟢 Low         | 1 day          | 🟡 High         | ⭐⭐⭐⭐        | Simple DB write. High engagement signal.                              |
| F6 — Comments                    | 🟢 Low         | 2–3 days       | 🟡 High         | ⭐⭐⭐⭐        | Drives community interaction.                                         |
| F7 — User Profiles               | 🟢 Low         | 2 days         | 🟡 High         | ⭐⭐⭐⭐        | Gives identity and ownership to content creators.                     |
| F8 — Responsive Design           | 🟡 Medium      | 3–4 days       | 🔴 Critical     | ⭐⭐⭐⭐        | Built into development from day one with Tailwind.                    |
| F9 — Enterprise SSO              | 🔴 High        | 2–3 weeks      | 🟡 High         | ⭐⭐⭐         | Important for IT compliance but not needed for MVP launch.            |
| F10 — Push Notifications         | 🔴 High        | 2 weeks        | 🟢 Medium       | ⭐⭐          | Complex cross-platform service worker management.                     |
| F11 — Hashtags & Search          | 🔴 High        | 2 weeks        | 🟡 High         | ⭐⭐⭐         | Valuable at scale; low ROI when content library is small.             |
| F12 — Moderation Dashboard       | 🟡 Medium      | 1 week         | 🟡 High         | ⭐⭐⭐         | May be required by Legal/HR before wide rollout.                      |
| F13 — In-App Video Editing       | 🔴 High        | 3–4 weeks      | 🟢 Medium       | ⭐⭐          | Users can edit in their phone's native camera app for now.            |
| F14 — Analytics Dashboard        | 🟡 Medium      | 1 week         | 🟢 Medium       | ⭐⭐⭐         | Useful for proving engagement metrics to leadership.                  |
| F15 — Follow / Subscribe         | 🟡 Medium      | 1 week         | 🟢 Medium       | ⭐⭐          | Only useful once there is a critical mass of creators.                |
| F16 — AI Captions                | 🟢 Low         | 2–3 days       | 🟡 High         | ⭐⭐⭐⭐        | Mux offers auto-captioning as a built-in feature.                     |

---

### 6. Success Metrics (KPIs)

| Metric                        | Target (3 months post-launch)  |
| :---------------------------- | :----------------------------- |
| Registered Users              | 500+                           |
| Videos Uploaded               | 200+                           |
| Daily Active Users (DAU)      | 100+                           |
| Avg. Session Duration         | > 3 minutes                    |
| Avg. Video Watch-Through Rate | > 60%                          |

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