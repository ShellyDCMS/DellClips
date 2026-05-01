# Executive Summary
## DellClips — Internal Short-Form Video Platform
### MVP Approval & Pre-Launch Requirements

---

## 1. Project Overview

DellClips is a proposed internal, mobile-first short-form video platform
exclusively for Dell Technologies employees. Modeled after TikTok and
Instagram Reels, it enables employees to share knowledge, celebrate
achievements, and communicate across departments through engaging
vertical video content.

**Key characteristics:**
- **Progressive Web App (PWA):** Installable on any phone (iOS/Android)
  or desktop without App Store or Play Store deployment
- **Dell-only access:** Restricted to verified `@dell.com` email addresses
  via passwordless authentication
- **Near-zero cost:** MVP operates at ~$5-10/month using free-tier services
- **Vendor-independent:** Every external component (auth, database, video,
  email) can be replaced without rewriting the application
- **AI-assisted development:** ~90% of code generated via AI, reducing
  delivery time to ~3 weeks with 1 engineer

---

## 2. Pre-Launch Review Gates

To mitigate organizational risk and ensure compliance, the MVP will
not launch until formal reviews and approvals are completed by the
following departments:

### 2.1 Security Team Review

| Review Area | Details |
|:------------|:--------|
| **Authentication model** | Passwordless magic link login restricted to `@dell.com` domain. Sessions stored in secure HttpOnly, SameSite=Strict cookies with short-lived JWT tokens. CSRF protection built in. |
| **Data protection** | All traffic encrypted via TLS/HTTPS. Database accessible only via private connection (no public IP). Parameterized queries prevent SQL injection. |
| **Video access control** | Videos uploaded directly to Cloudflare's infrastructure via presigned URLs. Signed playback URLs (V2) prevent unauthorized external sharing. |
| **Upload security** | Server-side MIME type validation (video/mp4, video/webm only). 200 MB file size cap. 60-second duration limit. |
| **Webhook integrity** | Cryptographic signature verification on all inbound webhooks from the video platform. |
| **Rate limiting** | Edge middleware rate limiting on authentication and upload endpoints to prevent abuse. |
| **Content moderation** | User-driven reporting system (Phase 1). Users can flag videos for offensive content, restricted data exposure, harassment, or spam. All reports tied to verified `@dell.com` identity. |
| **Required action** | Comprehensive security assessment to identify and mitigate vulnerabilities before launch. |

### 2.2 Legal Team Review

| Review Area | Details |
|:------------|:--------|
| **Intellectual Property (IP) ownership** | Full review of IP ownership for all code, including AI-generated code, to confirm Dell retains proprietary rights over the application. |
| **Open Source software usage** | Legal review of all open-source dependencies and their licenses to ensure compatibility with commercial/internal use. Key dependencies include: Next.js (MIT), Auth.js (ISC), Drizzle ORM (Apache 2.0), hls.js (Apache 2.0), Tailwind CSS (MIT), Serwist (MIT). All current dependencies use permissive licenses. |
| **Third-party vendor agreements** | Review of Terms of Service for: Vercel (hosting), Neon (database), Cloudflare Stream (video), Resend (email) to confirm compliance with Dell's vendor policies. |
| **Content liability** | Review of Dell's liability regarding user-generated video content posted by employees on an internal platform. |
| **Data residency** | Confirmation that video storage locations (Cloudflare's global infrastructure) and database locations (Neon/AWS) comply with Dell's data handling requirements. |
| **Required action** | Full legal review of IP ownership, open-source license compliance, and third-party vendor agreements. |

### 2.3 Human Resources (HR) Review

| Review Area | Details |
|:------------|:--------|
| **Code of Conduct alignment** | Verification that the platform and its content policies align with Dell's Code of Conduct. |
| **Acceptable use policy** | Creation and approval of a DellClips-specific acceptable use policy that defines what content is permitted and prohibited. |
| **Reporting & moderation process** | Review of the user-driven reporting mechanism (offensive content, restricted data, harassment, spam) and the escalation process for flagged content. |
| **Employee data handling** | Confirmation that employee data collected (email, name, video content) complies with internal HR data policies and applicable privacy regulations. |
| **Required action** | Verification that the product, content policies, and moderation processes align with Dell's Code of Conduct and HR policies. |

---

## 3. Requirments

### 3. Scope & Features (MVP vs. V2)

#### 3.1 Must-Have Features (Phase 1 — MVP)

| #   | Feature                        | Description                                                                                                  |
| :-- | :----------------------------- | :----------------------------------------------------------------------------------------------------------- |
| F1  | **Email-Based Authentication** | Passwordless login via Magic Link or OTP sent to `*@dell.com` email addresses only. No password to remember. |
| F2  | **PWA Installability**         | Full Progressive Web App support with `manifest.json`, service worker, and "Add to Home Screen" prompt.      |
| F3  | **Vertical Video Feed**        | Infinite-scroll, full-screen vertical video feed with auto-play on scroll (muted by default).                |
| F4  | **Video Upload**               | Users can upload or record short vertical videos (max 60 seconds, max 200 MB) from mobile or desktop.        |
| F5  | **Like / React**               | Single-tap like button on each video with real-time count.                                                   |
| F6  | **Comments**                   | Threaded text comments on each video.                                                                        |
| F7  | **User Profiles**              | Basic profile page showing the user's name, email, avatar, and their uploaded videos.                        |
| F8  | **Responsive Design**          | Fully functional on mobile (portrait), tablet, and desktop viewports.                                        |
| F9  | **Report Video**               | Users can flag a video as offensive, inappropriate, or containing restricted/confidential data. Reports are stored in the database and surfaced to admins. This is the primary content moderation mechanism since automated video scanning is not implemented. |
| F10 | **Follow / Subscribe**         | Follow specific colleagues or departments to personalize the feed with content from people you care about.   |
| F11 | **Hashtags & Search**          | Tag videos with hashtags (#DellTech, #SalesWin, #Engineering). Search bar to find content by title, description, or hashtag. |

#### 3.2 Nice-to-Have Features (Phase 2 — V2)

| #   | Feature                         | Description                                                                                              |
| :-- | :------------------------------ | :------------------------------------------------------------------------------------------------------- |
| F12 | **Enterprise SSO (Okta/Entra)** | Replace Magic Links with Dell's official SSO provider for tighter IT compliance.                          |
| F13 | **Push Notifications**          | Web Push API notifications for replies, likes, or company-wide featured videos.                          |
| F14 | **Content Moderation Dashboard**| Admin panel for HR/IT to review reported videos, take action (remove/warn), and manage report queue.     |
| F15 | **In-App Video Editing**        | Basic trim, crop, and text-overlay tools before publishing.                                              |
| F16 | **Analytics Dashboard**         | View counts, engagement rates, and trending content metrics for leadership.                              |
| F17 | **Video Captions (AI)**         | Auto-generated captions/subtitles for accessibility compliance.                                          |
---

### 3.3 Non-Functional Requirements

| Requirement       | Target                                                                   |
| :---------------- | :----------------------------------------------------------------------- |
| **Performance**   | Video playback must begin within 2 seconds on 4G connections             |
| **Availability**  | 99.9% uptime (leveraging Vercel + Mux SLAs)                             |
| **Security**      | All traffic over HTTPS; authentication tokens in HttpOnly cookies        |
| **Data Residency**| Video content and user data must comply with Dell's data policies        |
| **Accessibility** | WCAG 2.1 AA compliance (captions, keyboard navigation, screen readers)   |
| **Scalability**   | Must support up to 10,000 concurrent users without degradation           |

---


### 3.4 Vendor Replacement Strategy

The application is built on a **Hexagonal Architecture (Ports &
Adapters)** pattern that ensures every external vendor can be replaced
without modifying core business logic:

| Component | Current Vendor (MVP) | How Replacement Works |
|:----------|:---------------------|:----------------------|
| **Authentication** | Auth.js (Magic Links) | Abstract `AuthPort` interface. Swap to Okta, Microsoft Entra, or Keycloak by writing a new adapter file and changing one line in the composition root. |
| **Database** | Neon (PostgreSQL) | Abstract `DatabasePort` interface. Swap to Supabase, AWS RDS, Azure Database, or self-hosted PostgreSQL by updating the connection string. Schema is standard PostgreSQL — works identically on any host. |
| **Video Platform** | Cloudflare Stream | Abstract `VideoPort` interface. Swap to Mux, AWS (S3 + MediaConvert + CloudFront), Bunny Stream, or self-hosted (MinIO + FFmpeg + Nginx) by writing a new adapter file. |
| **Email Service** | Resend | Abstract `EmailPort` interface. Swap to SendGrid, AWS SES, or Mailgun by writing a new adapter file. |
| **Video Player** | hls.js | Abstract `PlayerPort` interface. Swap to Video.js, Mux Player, or Plyr by updating one UI component. |
| **Hosting** | Vercel | Next.js supports deployment on Netlify, AWS Amplify, Cloudflare Pages, or self-hosted Node.js with zero framework changes. |

**Key principle:** All vendor-specific code is isolated in adapter files.
The composition root (`lib/services.ts`) is the single file where vendor
choices are made. Swapping any vendor requires:
1. A new adapter file implementing the same interface
2. Changing one import line in the composition root
3. **Zero changes** to business logic, UI, database, or API routes

### 3.6 Stage-by-Stage Cost Analysis

#### MVP Launch Phase (Month 1-3)

| Service | Free Tier? | Monthly Cost |
|:--------|:-----------|:-------------|
| Vercel (hosting) | ✅ Yes — 100 GB bandwidth | **$0** |
| Neon PostgreSQL (database) | ✅ Yes — 0.5 GB, 190 compute hrs | **$0** |
| Auth.js (authentication) | ✅ Yes — open source | **$0** |
| Resend (email) | ✅ Yes — 3,000 emails/month | **$0** |
| hls.js (video player) | ✅ Yes — open source | **$0** |
| Serwist (PWA) | ✅ Yes — open source | **$0** |
| Drizzle ORM | ✅ Yes — open source | **$0** |
| Cloudflare Stream (video) | ❌ Pay-as-you-go | **~$5-10** |
| Domain name | Not needed (use *.vercel.app) | **$0** |
| **Total MVP monthly cost** | | **~$5-10/month** |

#### Scale Phase — Departmental (500 users, 500 videos)

| Service | Monthly Cost |
|:--------|:-------------|
| Vercel Pro | $20 |
| Neon (increased compute) | $19 |
| Cloudflare Stream | ~$15-25 |
| Resend | $0 (within free tier) |
| **Total monthly cost** | **~$55-65/month** |

#### Scale Phase — Company-Wide (5,000+ users, 5,000+ videos)

| Service | Monthly Cost |
|:--------|:-------------|
| Vercel Pro | $20 |
| Neon Pro (read replicas) | $69 |
| Cloudflare Stream | ~$80-150 |
| Resend Pro | $20 |
| Custom domain | $1 (annual, amortized) |
| **Total monthly cost** | **~$190-260/month** |

#### Cost Comparison: DellClips vs. Alternatives

| Approach | Monthly Cost | Engineering Time | Vendor Lock-in |
|:---------|:-------------|:-----------------|:---------------|
| **DellClips (this proposal)** | $5-10/mo (MVP) | ~3 weeks (AI-assisted) | None (Hexagonal Architecture) |
| Native iOS + Android apps | $50-200/mo + store fees | 3-6 months | High (platform-specific) |
| Off-the-shelf enterprise video platform | $500-5,000/mo (licensing) | 1-2 months (config) | Very high (vendor-specific) |

---

## 4. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|:-----|:-----------|:-------|:-----------|
| Dell IT rejects third-party cloud services | Medium | High | Hexagonal Architecture enables migration to self-hosted or Dell-approved infrastructure via adapter swap |
| Inappropriate content uploaded | Medium | High | User-driven reporting (Phase 1) + moderation dashboard (Phase 2) + accountability via `@dell.com` identity |
| Free tiers insufficient at scale | Low | Medium | Paid tiers remain very affordable (<$260/mo even at company-wide scale) |
| Open source license incompatibility | Low | High | All current dependencies use permissive licenses (MIT, Apache 2.0, ISC). Legal review will confirm before launch. |
| Low employee adoption | Medium | High | Seed content with leadership videos; promote via existing internal channels |
| Data privacy / compliance concerns | Medium | High | All data with enterprise-grade providers; data export and deletion capabilities included |

---

## 5. Timeline

| Phase | Duration | Milestone |
|:------|:---------|:----------|
| **Development** | Weeks 1-3 | Build complete MVP (AI-assisted, 1 engineer) |
| **Pre-Launch Reviews** | Weeks 3-5 | Security, Legal, and HR reviews (parallel) |
| **Soft Launch** | Week 6 | Pilot with 50-100 employees from select departments |
| **Full Launch** | Week 8 | Company-wide availability (pending pilot feedback) |

---

## 6. Recommendation

We recommend **proceeding immediately with MVP development** while
initiating the Security, Legal, and HR review processes in parallel.
The MVP can be built in approximately 3 weeks at near-zero cost,
allowing the review teams ample time to evaluate the platform before
any employee-facing launch.

The Hexagonal Architecture ensures that any vendor or infrastructure
changes requested by Security or IT can be implemented without
rebuilding the application — providing Dell with full flexibility and
zero lock-in.

**Requested approval:** Green light to begin development and schedule
pre-launch review sessions with Security, Legal, and HR.

---

# APENDIX
---
## 1. Why Can't We Use YouTube for Storing Videos?
YouTube is free, so the instinct to use it makes sense. But YouTube is a consumer video-sharing platform, not a backend storage or CDN service. Using it as a headless video backend for DellClips would break down in several critical ways:

| Problem | Why It Kills DellClips |
|:---|:---|
| **No Raw File Access** | YouTube does not give you access to the raw video files (`.mp4`, `.m3u8`) via API. You are forced to use their proprietary embedded iFrame player. You cannot build a custom TikTok-style vertical scrolling UI — you'd get a YouTube rectangle with YouTube's controls. |
| **Ads & Competitor Content** | YouTube's player displays YouTube branding, watermarks, and potentially **ads**. Worse — when a video finishes, YouTube's algorithm recommends **other videos**, which could include content from Dell's competitors. Imagine an internal Dell video ending with a recommendation for an HP ad. |
| **Terms of Service Violation** | YouTube's Terms of Service **explicitly prohibit** using the platform as a "headless" hosting backend to serve your own application. Doing so can result in your API access being revoked or your channel being banned entirely. |
| **Privacy & Security** | You can set videos to "Unlisted" or "Private," but this is not secure access control. Anyone with an unlisted link can share it freely. Private videos require every viewer to have a Google account that you manually authorize — completely impractical for hundreds or thousands of Dell employees. |
| **Content Moderation Risk** | Your content is subject to YouTube's automated copyright and community guideline algorithms. False flags can result in your videos being **taken down instantly** with little recourse. Imagine Dell's CEO posting a strategy update and YouTube's bot flagging it. |

Bottom line: YouTube is designed for public video sharing, not as infrastructure for private enterprise apps. Using it would violate their ToS, give you no control over the player UI, and expose Dell content to ads and competitor recommendations.
Claude Opus 4.6
Great questions — and worth answering clearly before we commit to a stack. Let me break down both.

1. Why Can't We Use YouTube for Storing Videos?
YouTube is free, so the instinct to use it makes sense. But YouTube is a consumer video-sharing platform, not a backend storage or CDN service. Using it as a headless video backend for DellClips would break down in several critical ways:

Problem
Why It Kills DellClips
No Raw File Access
YouTube does not give you access to the raw video files (.mp4, .m3u8) via API. You are forced to use their proprietary embedded iFrame player. You cannot build a custom TikTok-style vertical scrolling UI — you'd get a YouTube rectangle with YouTube's controls.
Ads & Competitor Content
YouTube's player displays YouTube branding, watermarks, and potentially ads. Worse — when a video finishes, YouTube's algorithm recommends other videos, which could include content from Dell's competitors. Imagine an internal Dell video ending with a recommendation for an HP ad.
Terms of Service Violation
YouTube's Terms of Service explicitly prohibit using the platform as a "headless" hosting backend to serve your own application. Doing so can result in your API access being revoked or your channel being banned entirely.
Privacy & Security
You can set videos to "Unlisted" or "Private," but this is not secure access control. Anyone with an unlisted link can share it freely. Private videos require every viewer to have a Google account that you manually authorize — completely impractical for hundreds or thousands of Dell employees.
Content Moderation Risk
Your content is subject to YouTube's automated copyright and community guideline algorithms. False flags can result in your videos being taken down instantly with little recourse. Imagine Dell's CEO posting a strategy update and YouTube's bot flagging it.
Bottom line: YouTube is designed for public video sharing, not as infrastructure for private enterprise apps. Using it would violate their ToS, give you no control over the player UI, and expose Dell content to ads and competitor recommendations.

## 2. What Would It Cost If We Used AWS Instead?
AWS gives you 100% control over your files, security, and video player, but uses a pay-as-you-go model. Your bill breaks into three pillars:

### AWS Cost Breakdown
| Service | What It Does | Pricing (2026) | MVP Example |
|:---|:---|:---|:---|
| **Amazon S3** (Storage) | Stores the video files permanently | **$0.023 per GB/month** | 100 GB of video = **$2.30/month** |
| **Data Transfer** (Bandwidth/Egress) | Delivers video data from AWS to your users over the internet | First 100 GB/month **free**, then **$0.09 per GB** | 1 TB streamed = 900 GB billable = **$81.00/month** |
| **AWS Elemental MediaConvert** (Transcoding) | Converts raw uploads into web-friendly HLS adaptive streaming formats | Based on video length and resolution | One 60-min 1080p video ≈ **$4.23** (one-time) |

### MVP Scenario with AWS
| Item | Calculation | Cost |
|:---|:---|:---|
| Store 100 GB of video | 100 × $0.023 | $2.30/mo |
| Stream 1 TB to users | (1,000 - 100 free) × $0.09 | $81.00/mo |
| Transcode 50 videos (avg 1 min each) | ~50 × $0.70 | $35.00 one-time |
| **Ongoing monthly total** | | **~$85-90/month** |

### AWS vs. Cloudflare Stream vs. YouTube

| Criteria | YouTube | AWS (S3 + MediaConvert + CloudFront) | Cloudflare Stream |
|:---|:---|:---|:---|
| **Monthly Cost (MVP)** | $0 | ~$85-90/mo | **~$5-10/mo** |
| **Custom Player UI** | ❌ Forced iFrame | ✅ Full control | ✅ Full control |
| **No Ads** | ❌ YouTube shows ads | ✅ | ✅ |
| **Adaptive Bitrate (HLS)** | ✅ (but locked in player) | ✅ (must configure yourself) | ✅ (automatic) |
| **Transcoding** | ✅ (automatic) | ⚠️ Must configure MediaConvert pipeline | ✅ (automatic) |
| **CDN Delivery** | ✅ | ⚠️ Must configure CloudFront | ✅ (built-in, 300+ nodes) |
| **Setup Complexity** | Low (but unusable for our case) | 🔴 High (3-4 AWS services to wire together) | 🟢 Low (single API) |
| **Private Access Control** | ❌ Weak (unlisted links) | ✅ Signed URLs | ✅ Signed URLs |
| **ToS Risk** | 🔴 Violates ToS | ✅ None | ✅ None |
| **Replaceability** | ❌ Locked to YouTube player | ✅ Via VideoPort adapter | ✅ Via VideoPort adapter |


### The Key Insight
AWS is the "enterprise gold standard" but costs 8-15x more than
Cloudflare Stream for MVP-scale usage, and requires you to configure
and wire together 3-4 separate services (S3, MediaConvert, CloudFront,
IAM roles) yourself.

Cloudflare Stream gives you the same end result — transcoding, HLS,
global CDN — in a single API at a fraction of the cost.

###So Why Are We Using Cloudflare Stream?
| Reason | Detail |
|:---|:---|
| **Lowest MVP cost** | ~$5-10/mo vs ~$85-90/mo (AWS) vs $0 but unusable (YouTube) |
| **Simplest integration** | One API to upload, transcode, and stream — no wiring multiple services |
| **Same quality** | Adaptive bitrate HLS streaming from a global CDN, just like AWS CloudFront |
| **Replaceable** | If Dell IT later mandates AWS, we swap in an `AwsVideoService` adapter implementing the same `VideoPort` interface — zero app changes |

If Dell IT Later Requires AWS
Thanks to the Hexagonal Architecture, migrating is straightforward.

### Summary

| Option | Viable? | MVP Cost | Complexity | Our Choice? |
|:---|:---|:---|:---|:---|
| **YouTube** | ❌ No (ToS violation, no custom UI, ads, privacy issues) | $0 | Low | ❌ |
| **AWS** | ✅ Yes (full control, enterprise-grade) | ~$85-90/mo | 🔴 High | ❌ for MVP (future option via adapter swap) |
| **Cloudflare Stream** | ✅ Yes (full control, simple, cheap) | ~$5-10/mo | 🟢 Low | ✅ **MVP choice** |