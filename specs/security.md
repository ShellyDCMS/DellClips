# Security Risk Analysis

## DellClips — Authentication & Access Control

---

## 1. Executive Summary

DellClips uses email-based OTP (One-Time Password) authentication
restricted to verified `@dell.com` email addresses. This document
analyzes the security posture of this authentication model, identifies
potential attack vectors, documents existing mitigations, and
recommends enhancements for production readiness.

**Key Finding:** The current authentication model provides a strong
baseline of security for an internal MVP. The primary remaining risk
is the theoretical possibility of brute-forcing a 6-digit OTP, which
is mitigated by rate limiting, token expiration, and single-use
enforcement. For production deployment, migration to Enterprise SSO
(Microsoft Entra ID) is recommended to eliminate email-based attack
vectors entirely.

---

## 2. Authentication Model Overview

### Current Implementation (MVP)

```
User enters @dell.com email
  → App generates 6-digit OTP
  → OTP sent to user's Dell email via Resend
  → User enters OTP in the app
  → App verifies OTP against database
  → Session created (30-day HttpOnly cookie)
  → User accesses the app
```

### Security Properties

| Property                  | Implementation                                  |
| :------------------------ | :---------------------------------------------- |
| **Identity Verification** | Email domain must be exactly `@dell.com`        |
| **Authentication Factor** | Something you have (access to Dell email inbox) |
| **Token Type**            | 6-digit numeric OTP                             |
| **Token Lifetime**        | 10 minutes                                      |
| **Token Usage**           | Single-use (deleted after verification)         |
| **Session Type**          | Database-backed session with HttpOnly cookie    |
| **Session Lifetime**      | 30 days                                         |
| **Transport Security**    | HTTPS only (enforced by Vercel)                 |

---

## 3. Threat Analysis

### 3.1 Email Spoofing

|                   |                                                                                                                                                                                                                                                                                                                                                                                         |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Threat**        | Attacker spoofs a `@dell.com` email address to receive the OTP                                                                                                                                                                                                                                                                                                                          |
| **Risk Level**    | 🟢 **LOW**                                                                                                                                                                                                                                                                                                                                                                              |
| **Analysis**      | Email spoofing allows an attacker to forge the "From" address of an email, but it does NOT give them access to the "To" inbox. Our app sends the OTP TO the `@dell.com` address — the attacker would need to compromise Dell's email infrastructure (Microsoft 365) to intercept it. Spoofing the sender address is irrelevant because the OTP is sent to the recipient, not from them. |
| **Mitigation**    | OTP delivery relies on Dell's email infrastructure. Only someone with legitimate access to the specific Dell inbox can read the OTP.                                                                                                                                                                                                                                                    |
| **Residual Risk** | Negligible — would require compromising Dell's email system, which is a much larger security incident.                                                                                                                                                                                                                                                                                  |

### 3.2 Domain Validation Bypass

|                |                                                                                                                                       |
| :------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| **Threat**     | Attacker crafts an email that bypasses the `@dell.com` domain check                                                                   |
| **Risk Level** | 🟢 **LOW**                                                                                                                            |
| **Analysis**   | Our validation checks that the email domain is exactly `dell.com` — not a substring, not a subdomain, not appended to another domain. |

**Validation Logic:**

```typescript
export function isDellEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const normalized = email.toLowerCase().trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalized)) return false;
  const domain = normalized.split("@")[1];
  if (domain !== "dell.com") return false;
  const localPart = normalized.split("@")[0];
  if (localPart.length < 2 || localPart.length > 64) return false;
  return true;
}
```

**Bypass Attempts:**

| Attack Email              | Result     | Why                                |
| :------------------------ | :--------- | :--------------------------------- |
| `user@dell.com`           | ✅ Allowed | Legitimate Dell email              |
| `user@DELL.COM`           | ✅ Allowed | Normalized to lowercase            |
| `user@subdomain.dell.com` | ❌ Blocked | Domain is not exactly `dell.com`   |
| `user@dell.com.evil.com`  | ❌ Blocked | Domain is `dell.com.evil.com`      |
| `user@notdell.com`        | ❌ Blocked | Domain is not `dell.com`           |
| `@dell.com`               | ❌ Blocked | Local part too short               |
| `a@dell.com`              | ❌ Blocked | Local part too short (min 2 chars) |
| `user+tag@dell.com`       | ✅ Allowed | Valid email alias format           |
| Empty string              | ❌ Blocked | Null/empty check                   |
| `not-an-email`            | ❌ Blocked | Regex validation fails             |

| **Mitigation** | Strict domain exact-match validation + email format regex + length checks |
| **Residual Risk** | Negligible — validation is comprehensive |

### 3.3 OTP Brute Force

|                |                                                                                                                                                             |
| :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Threat**     | Attacker guesses the 6-digit OTP by trying all combinations                                                                                                 |
| **Risk Level** | 🟡 **MEDIUM** (mitigated to LOW)                                                                                                                            |
| **Analysis**   | A 6-digit OTP has 1,000,000 possible combinations. Without rate limiting, an attacker could theoretically try all combinations within the 10-minute window. |

**Mitigations:**

| Control                  | Effect                                                                                  |
| :----------------------- | :-------------------------------------------------------------------------------------- |
| **Rate limiting**        | Maximum 10 OTP verification attempts per IP per 5 minutes                               |
| **Token expiration**     | OTP expires after 10 minutes                                                            |
| **Single-use token**     | OTP is deleted from database after first use (success or failure)                       |
| **Combined probability** | With 10 attempts and 1,000,000 combinations: 0.001% chance of success per attack window |

| **Mitigation** | Rate limiting + expiration + single-use enforcement |
| **Residual Risk** | Extremely low — 0.001% success probability per attack window |

### 3.4 Non-Existent Dell Email

|                   |                                                                                                                                                                                                                                                                      |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Threat**        | Attacker uses a fabricated `@dell.com` address (e.g., `fake.person@dell.com`)                                                                                                                                                                                        |
| **Risk Level**    | 🟢 **LOW**                                                                                                                                                                                                                                                           |
| **Analysis**      | Our app will attempt to send an OTP to `fake.person@dell.com`. If this address doesn't exist, Dell's email system will either bounce it or silently discard it. The attacker cannot receive the OTP because the inbox doesn't exist or they don't have access to it. |
| **Mitigation**    | OTP delivery depends on the recipient having a real, accessible Dell inbox                                                                                                                                                                                           |
| **Residual Risk** | Negligible — fabricated addresses cannot receive OTPs                                                                                                                                                                                                                |

### 3.5 Session Hijacking

|                |                                                                                                               |
| :------------- | :------------------------------------------------------------------------------------------------------------ |
| **Threat**     | Attacker steals a valid session cookie to impersonate a Dell employee                                         |
| **Risk Level** | 🟡 **LOW-MEDIUM**                                                                                             |
| **Analysis**   | If an attacker obtains the session cookie, they can impersonate the user until the session expires (30 days). |

**Attack Methods and Mitigations:**

| Attack Method                  | Mitigation                                                                   | Status          |
| :----------------------------- | :--------------------------------------------------------------------------- | :-------------- |
| **XSS (Cross-Site Scripting)** | `HttpOnly` flag prevents JavaScript access to cookies                        | ✅ Implemented  |
| **Network sniffing (MITM)**    | `Secure` flag ensures cookies only sent over HTTPS                           | ✅ Implemented  |
| **Cross-site request forgery** | `SameSite=Strict` prevents cross-origin cookie sending + Auth.js CSRF tokens | ✅ Implemented  |
| **Physical device access**     | 30-day session expiry limits exposure window                                 | ✅ Implemented  |
| **Cookie theft via malware**   | Outside application scope — endpoint security is Dell IT's responsibility    | ⚠️ Not in scope |

| **Mitigation** | HttpOnly + Secure + SameSite=Strict + CSRF protection + HTTPS |
| **Residual Risk** | Low — standard web security best practices applied |

### 3.6 API Direct Access

|                   |                                                                                                                                           |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **Threat**        | Attacker bypasses the UI and calls API endpoints directly                                                                                 |
| **Risk Level**    | 🟢 **LOW**                                                                                                                                |
| **Analysis**      | Every API route in DellClips verifies the user's session before processing requests. Unauthenticated requests are rejected with HTTP 401. |
| **Mitigation**    | Server-side session verification on all API routes                                                                                        |
| **Residual Risk** | Negligible — no API endpoint is accessible without a valid session                                                                        |

### 3.7 Webhook Spoofing

|                   |                                                                                                                                                                                                 |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Threat**        | Attacker sends fake webhook requests to manipulate video status                                                                                                                                 |
| **Risk Level**    | 🟢 **LOW**                                                                                                                                                                                      |
| **Analysis**      | Cloudflare Stream webhooks include an HMAC-SHA256 signature in the `Webhook-Signature` header. Our webhook handler verifies this signature using a shared secret before processing any payload. |
| **Mitigation**    | Cryptographic signature verification + timestamp validation (5-minute tolerance to prevent replay attacks)                                                                                      |
| **Residual Risk** | Negligible — would require the attacker to obtain the webhook signing secret                                                                                                                    |

### 3.8 SQL Injection

|                   |                                                                                                                                                                                                         |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Threat**        | Attacker injects malicious SQL through user inputs                                                                                                                                                      |
| **Risk Level**    | 🟢 **LOW**                                                                                                                                                                                              |
| **Analysis**      | All database queries use Drizzle ORM with parameterized queries. No raw SQL string concatenation exists in the codebase. User inputs are validated with Zod schemas before reaching the database layer. |
| **Mitigation**    | Drizzle ORM parameterized queries + Zod input validation                                                                                                                                                |
| **Residual Risk** | Negligible — industry-standard SQL injection prevention                                                                                                                                                 |

### 3.9 Content Security (User-Generated Video)

|                   |                                                                                                                                                                                    |
| :---------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Threat**        | Users upload inappropriate, offensive, or confidential content                                                                                                                     |
| **Risk Level**    | 🟡 **MEDIUM**                                                                                                                                                                      |
| **Analysis**      | DellClips allows any authenticated Dell employee to upload video content. There is no automated content scanning or moderation.                                                    |
| **Mitigation**    | User-driven reporting system (report reasons: offensive, restricted data, harassment, spam) + admin review dashboard + all uploads tied to verified Dell identity (accountability) |
| **Residual Risk** | Medium — relies on community reporting rather than automated scanning. Recommended: add AI-based content moderation in V2.                                                         |

---

## 4. VPN Restriction Analysis

### The Question

> "Should DellClips be restricted to Dell VPN access only?"

### The Trade-Off

Restricting access to the Dell VPN would eliminate nearly all external
attack vectors — but it would also **eliminate the app's primary use
case**.

| Factor                 | VPN-Only Access                                                                                                                                 | Open Access (Current)                      |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------- |
| **Mobile access**      | ❌ **Blocked** — Dell VPN is not available on personal mobile devices                                                                           | ✅ Works on any phone                      |
| **PWA installability** | ❌ **Broken** — PWA requires internet access, VPN adds complexity                                                                               | ✅ Install and use anywhere                |
| **User adoption**      | 🔴 **Severely limited** — employees can only use on company laptops connected to VPN                                                            | ✅ High adoption — use anywhere, anytime   |
| **Security**           | ✅ Strong perimeter security                                                                                                                    | ✅ Strong application-level security       |
| **Shadow IT risk**     | 🔴 **HIGH** — if users can't access the app on their phones, they'll use unsanctioned alternatives (WhatsApp, personal Dropbox) to share videos | 🟢 Low — the app works where users need it |
| **Availability**       | 🔴 Degraded — app unavailable during travel, remote work without VPN, or on personal devices                                                    | ✅ Full availability                       |

### Why VPN-Only Is NOT Recommended

Based on our architecture's security analysis:

1. **DellClips is a mobile-first app.** Its entire value proposition is
   that Dell employees can record and share videos from their phones.
   VPN restriction would eliminate this use case entirely.

2. **The VPN itself is not a security panacea.** Traditional VPNs
   operate on an "all-or-nothing" network-level access model. If a
   user's desktop is infected with malware or their VPN credentials
   are stolen via phishing, the attacker gains broad lateral access
   to the corporate network. DellClips would only be as secure as
   the weakest endpoint connected to the VPN.

3. **Shadow IT risk is real and measurable.** When security policies
   aggressively disrupt employee workflows without providing a secure
   alternative, users find their own workarounds — emailing videos to
   personal accounts, using personal cloud storage, or sharing via
   consumer messaging apps. This results in severe data leakage with
   zero audit trail.

4. **Application-level security is sufficient.** DellClips implements
   defense-in-depth at the application layer:
   - Email-verified identity (only `@dell.com`)
   - Rate-limited OTP authentication
   - Encrypted sessions (HttpOnly, Secure, SameSite)
   - Server-side authorization on every API call
   - Signed webhooks
   - Parameterized database queries
   - Content reporting and moderation

5. **Zero Trust > VPN.** The modern security paradigm (NIST Zero Trust
   Architecture) recommends verifying identity and device posture
   per-session rather than relying on network perimeter (VPN).
   DellClips follows this model — every request is authenticated
   regardless of network location.

### Recommendation

**Do NOT restrict DellClips to VPN-only access.** Instead, maintain
the current application-level security controls and enhance them
with Enterprise SSO (Microsoft Entra ID) in V2, which provides
stronger identity verification without sacrificing mobile
accessibility.

If Dell IT requires additional network-level controls, consider:

- **IP allowlisting** for admin endpoints only (not user-facing)
- **Geo-blocking** to restrict access to Dell operating countries
- **Device posture checks** via Microsoft Intune MDM (V2)

---

## 5. Security Controls Summary

### Currently Implemented

| Control                                              | Type                     | Status    |
| :--------------------------------------------------- | :----------------------- | :-------- |
| Email domain restriction (`@dell.com` only)          | Authentication           | ✅ Active |
| Email format validation (regex + exact domain match) | Input Validation         | ✅ Active |
| 6-digit OTP with 10-minute expiration                | Authentication           | ✅ Active |
| Single-use OTP (deleted after verification)          | Authentication           | ✅ Active |
| Rate limiting (5 sign-ins + 10 OTP per 5 min per IP) | Abuse Prevention         | ✅ Active |
| HttpOnly session cookies                             | Session Security         | ✅ Active |
| Secure flag (HTTPS-only cookies)                     | Transport Security       | ✅ Active |
| SameSite=Strict cookies                              | CSRF Prevention          | ✅ Active |
| CSRF tokens (Auth.js built-in)                       | CSRF Prevention          | ✅ Active |
| HTTPS enforcement (Vercel)                           | Transport Security       | ✅ Active |
| Server-side session verification on all API routes   | Authorization            | ✅ Active |
| Parameterized queries (Drizzle ORM)                  | SQL Injection Prevention | ✅ Active |
| Input validation (Zod schemas)                       | Input Validation         | ✅ Active |
| Webhook signature verification (HMAC-SHA256)         | Webhook Security         | ✅ Active |
| File type validation (video uploads)                 | Upload Security          | ✅ Active |
| File size limits (200 MB max)                        | Upload Security          | ✅ Active |
| User-driven content reporting                        | Content Moderation       | ✅ Active |
| Admin review dashboard                               | Content Moderation       | ✅ Active |
| Role-based access control (user/admin)               | Authorization            | ✅ Active |
| 30-day session expiration                            | Session Lifecycle        | ✅ Active |

### Recommended Enhancements (V2)

| Control                                  | Type             | Priority  | Effort               |
| :--------------------------------------- | :--------------- | :-------- | :------------------- |
| **Microsoft Entra SSO**                  | Authentication   | 🔴 High   | 2-3 weeks            |
| **Audit logging** (all sign-in attempts) | Monitoring       | 🟡 Medium | 1 week               |
| **AI content moderation**                | Content Security | 🟡 Medium | 2 weeks              |
| **Device posture checks** (Intune MDM)   | Device Security  | 🟡 Medium | Dell IT coordination |
| **Geo-blocking**                         | Network Security | 🟢 Low    | 1 day                |
| **IP allowlisting for admin routes**     | Network Security | 🟢 Low    | 1 day                |
| **Passkey/WebAuthn**                     | Authentication   | 🟢 Low    | 1 week               |

---

## 6. Compliance Considerations

| Requirement                    | Status     | Notes                                                                        |
| :----------------------------- | :--------- | :--------------------------------------------------------------------------- |
| **Data Encryption in Transit** | ✅         | HTTPS enforced by Vercel                                                     |
| **Data Encryption at Rest**    | ✅         | Neon PostgreSQL encrypts at rest by default                                  |
| **Access Control**             | ✅         | Role-based (user/admin) + Dell-only email                                    |
| **Audit Trail**                | ⚠️ Partial | Analytics events track user actions; formal audit logging recommended for V2 |
| **Data Retention**             | ⚠️ Partial | Videos and user data retained indefinitely; formal retention policy needed   |
| **Right to Deletion**          | ✅         | Users can delete own videos; admin can delete any content                    |
| **Content Moderation**         | ✅         | User reporting + admin review                                                |
| **Incident Response**          | 📋 Needed  | Formal incident response procedure should be documented                      |

---

## 7. Risk Matrix

| Risk                     | Likelihood | Impact   | Current Risk  | After V2 Enhancements  |
| :----------------------- | :--------- | :------- | :------------ | :--------------------- |
| Email spoofing           | Very Low   | High     | 🟢 Low        | 🟢 Eliminated (SSO)    |
| Domain validation bypass | Very Low   | High     | 🟢 Low        | 🟢 Eliminated (SSO)    |
| OTP brute force          | Low        | High     | 🟢 Low        | 🟢 Eliminated (SSO)    |
| Session hijacking        | Low        | Medium   | 🟡 Low-Medium | 🟢 Low (Passkeys)      |
| Inappropriate content    | Medium     | Medium   | 🟡 Medium     | 🟢 Low (AI moderation) |
| Unauthorized API access  | Very Low   | High     | 🟢 Low        | 🟢 Low                 |
| Webhook spoofing         | Very Low   | Medium   | 🟢 Low        | 🟢 Low                 |
| SQL injection            | Very Low   | Critical | 🟢 Low        | 🟢 Low                 |

---

## 8. Conclusion

DellClips implements a comprehensive set of application-level security
controls that provide strong protection for an internal MVP. The
email-based OTP authentication model ensures that only individuals
with access to a real `@dell.com` email inbox can authenticate,
effectively restricting access to Dell employees.

**The most significant security enhancement for production** is the
migration from email-based OTP to Enterprise SSO (Microsoft Entra
ID), which eliminates email-based attack vectors entirely and
integrates with Dell's existing identity management infrastructure.

**VPN restriction is NOT recommended** as it would eliminate mobile
access — the app's primary use case — and increase Shadow IT risk
without meaningfully improving security beyond what application-level
controls already provide.

---
