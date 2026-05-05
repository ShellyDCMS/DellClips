# DellClips — Executive Summary Email

**Subject:** DellClips MVP — Approval Request & Pre-Launch Requirements

---

Hi all,

Below is a concise summary of the DellClips proposal — an internal TikTok-style video platform for Dell employees.

## Key Points

- **What:** Mobile-first PWA for short-form video sharing (knowledge, demos, culture) — restricted to `@dell.com` employees
- **How:** Built with Next.js + TypeScript, Hexagonal Architecture (every vendor swappable without code changes)
- **Timeline:** ~3 weeks to MVP (AI-assisted, 1 engineer), soft launch at week 6
- **No App Store needed:** Installable directly from the browser on iOS/Android/Desktop

### MVP Features (Phase 1)

Passwordless magic link auth, vertical video feed, upload (60s max), likes, comments, user profiles, follow/subscribe, hashtags & search, video reporting, responsive design, PWA installability

### V2 Features (Phase 2)

Enterprise SSO, push notifications, moderation dashboard, in-app editing, analytics, AI captions

## MVP Cost

| Service                   | Monthly Cost  |
| :------------------------ | :------------ |
| Hosting (Vercel)          | $0            |
| Database (Neon)           | $0            |
| Auth, ORM, PWA            | $0 (OSS)      |
| Email (Resend)            | $0            |
| Video (Cloudflare Stream) | ~$5-10        |
| Domain (is-a.dev)         | $0            |
| **Total**                 | **~$5-10/mo** |

Scales to ~$55-65/mo at 500 users, ~$190-260/mo company-wide. Compare: native apps ($50-200/mo + 3-6 months), enterprise platforms ($500-5,000/mo).

## Open Questions / Approvals Needed

1. **Security** — Review auth model (magic links, HttpOnly cookies, CSRF), data encryption, upload validation, webhook signatures, rate limiting
2. **Legal** — IP ownership of AI-generated code, open-source license compliance (all MIT/Apache/ISC), third-party vendor ToS review, content liability, data residency
3. **HR** — Content policy aligned with Code of Conduct, acceptable use policy creation, reporting/moderation process approval, employee data handling

## Dependencies

- **Security sign-off** before any employee-facing launch
- **Legal review** of vendor agreements (Vercel, Neon, Cloudflare, Resend) and OSS licenses
- **HR-approved content policy** before company-wide rollout
- **Dell IT decision** on cloud vendors — architecture supports migration to Dell-approved infra (AWS, self-hosted) via adapter swap with zero app changes

## Key Risk Mitigations

- **Vendor lock-in:** Zero — Hexagonal Architecture isolates every vendor behind an interface; swap requires 1 new file + 1 line change
- **Content moderation:** User-driven reporting (Phase 1), admin dashboard (Phase 2), all reports tied to verified `@dell.com` identity
- **Cost at scale:** Remains under $260/mo even at 5,000+ users

**Ask:** Green light to begin development and schedule parallel review sessions with Security, Legal, and HR.

Best regards
