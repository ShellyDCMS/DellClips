<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Unit Tests (Vitest)

Tests live in `tests/unit/` and run via `npx vitest run`. All mocking uses `vi.mock()` / `vi.fn()`.

### Adapter Tests (`tests/unit/adapters/`)

| File                               | Covers                                                                                                                                                                                                                                             |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cloudflare-video-service.test.ts` | `CloudflareVideoService` — upload URL, playback URL, delete, parseWebhook (empty/non-JSON/challenge/readyToStream/status ready/error/unknown), verifyWebhookSignature (no secret/no header/invalid format/expired timestamp/valid sig/invalid sig) |
| `demo-video-service.test.ts`       | `DemoVideoService` — fake upload, HLS playback URLs, no-op delete, parseWebhook (empty/non-JSON/challenge/unknown), verifyWebhookSignature (always true)                                                                                           |
| `resend-email-service.test.ts`     | `ResendEmailService` — verification code, magic link, from address, BCC relay enabled/disabled, BCC config failure fallback, API error propagation                                                                                                 |
| `gmail-email-service.test.ts`      | `GmailEmailService` — relay recipient, sendVerificationCode (code in body/subject/text, recipient in subject/body), sendMagicLink (URL in body, relay routing), custom DELL_RELAY_EMAIL, DellClips sender, error propagation (driver pattern)      |
| `gdrive-video-service.test.ts`     | `GDriveVideoService` — manual upload URL, gdrive playback URL, non-gdrive fallback, no-op delete, parseWebhook (empty/non-JSON/challenge/unknown), verifyWebhookSignature (always true)                                                            |
| `web-push-notification-service.test.ts` | `WebPushNotificationService` — VAPID configured on import, sendToUser (no subs, multiple subs, payload title/body/url default+override/tag, endpoint+keys, 410 Gone removal, 404 removal, non-removal error swallow), sendToAll (broadcast all subs, expired sub removal) |

### API Route Tests (`tests/unit/routes/`)

| File                        | Route(s)                                     | Key scenarios                                                                                                                                                                                                                                                                        |
| --------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `hashtags.test.ts`          | `GET /api/hashtags`                          | Auth, default/custom/capped limit, DB errors                                                                                                                                                                                                                                         |
| `upload-url.test.ts`        | `POST /api/video/upload-url`                 | Auth, upload URL creation, service errors                                                                                                                                                                                                                                            |
| `webhook.test.ts`           | `GET/POST/HEAD /api/video/webhook`           | Signature verification (401 on failure, passthrough on success), delegates to videoService.parseWebhook, verification challenge echo, video_ready with/without assetId, video_error with/without assetId, unknown, DB errors, parseWebhook crash, body passthrough, GET health check |
| `videos.test.ts`            | `GET/POST /api/videos`                       | Feed pagination, limit cap, video enrichment, validation, create                                                                                                                                                                                                                     |
| `video-by-id.test.ts`       | `GET/DELETE /api/videos/[id]`                | Not found, forbidden, owner delete, provider failure fallback                                                                                                                                                                                                                        |
| `comments.test.ts`          | `GET/POST /api/videos/[id]/comments`         | Fetch, create, validation (empty/too long), video not found, push notification to author when commenter ≠ author with commenter name + feed url + comment tag, no notification on own video                                                                                          |
| `follow.test.ts`            | `POST/DELETE /api/videos/[id]/follow`        | Self-follow guard, user not found, follow/unfollow, push notification to target user with follower name + profile url + follow tag                                                                                                                                                   |
| `like.test.ts`              | `POST/DELETE /api/videos/[id]/like`          | Like persisted before video lookup (no 404), unlike, push notification to author when liker ≠ author with liker name + video title + feed url + like tag, no notification when video missing or self-like                                                                            |
| `push-subscribe.test.ts`    | `POST/DELETE /api/push/subscribe`            | Auth (401), insert subscription with userId/endpoint/keys, unsubscribe by endpoint, DB errors (500)                                                                                                                                                                                  |
| `report.test.ts`            | `POST /api/videos/[id]/report`               | Valid reasons, invalid reason, missing reason, video not found                                                                                                                                                                                                                       |
| `search.test.ts`            | `GET /api/videos/search`                     | Hashtag vs query, hashtag priority, limit cap, hasMore pagination                                                                                                                                                                                                                    |
| `hashtag-subscribe.test.ts` | `POST/DELETE /api/hashtags/[name]/subscribe` | Auth, subscribe/unsubscribe, # stripping, normalization, DB errors                                                                                                                                                                                                                   |
| `admin-config.test.ts`      | `GET/PUT /api/admin/config`                  | Auth (401), non-admin (403), get all config, update config, missing key/value (400), DB errors (500)                                                                                                                                                                                 |
| `analytics.test.ts`         | `POST /api/analytics`                        | Anonymous tracking (null userId), authenticated tracking, valid UUID videoId, non-UUID videoId (null videoId + rawVideoId in metadata), FK retry (insert fails then succeeds), missing eventType (400), DB errors (200 not 500)                                                      |
| `admin-analytics.test.ts`   | `GET /api/admin/analytics`                   | Auth (401), non-admin (403), user not found (403), success with overview/eventCounts/dailyActiveUsers, custom days param, DB errors (500)                                                                                                                                            |

### Utility / Helper Tests (`tests/unit/utils/`)

| File                   | Covers                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `utils.test.ts`        | `isDellEmail`, `parseHashtags`, `normalizeHashtag`, `timeAgo`, `REPORT_REASONS`                           |
| `auth-helpers.test.ts` | `getSession`, `requireAuth`, `requireAdmin`, `requireUserId` — auth/redirect/role checks (driver pattern) |

### Vitest Driver Pattern

All route tests, utility tests, and adapter tests that use the driver pattern follow this structure:

- **Driver** (`.driver.ts`) — owns mocks (`vi.mock()` for `@/lib/auth`, `@/lib/services`, `next/cache`, etc.), request construction, result/error capture. Imports `beforeEach`/`vi` from `vitest`. Exposes `beforeAndAfter()`, `given`, `when`, `get`.
- **Test** (`.test.ts`) — imports driver + `chance`. Destructures `{ given, when, get }`. Uses BDD structure: `describe('given …') → beforeEach(given/when) → it('then …', expect(get…))`. One assertion per `it`.
- **`next/cache` mock** — Any route that calls `revalidatePath` requires `vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args) }))` in its driver. Without this mock, `revalidatePath` throws `Invariant: static generation store missing` in Vitest.

Each route test verifies: auth guard (401), input validation (400), not found (404), forbidden (403 where applicable), success response, revalidatePath calls, and DB error handling (500).

## Cypress Component Tests

Tests live co-located with components as `<name>.cy.ts` + `<name>.driver.ts`. Run via `npx cypress run --component`.

### Tested Components

| Component             | Driver                                                 | Test                                               | Key scenarios                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VideoPlayer`         | `video-player/video-player.driver.ts`                  | `video-player/video-player.cy.ts`                  | Visible when active/inactive, mute button, play overlay, direct MP4 playback URL, Google Drive iframe rendering                                                                                    |
| `VideoCard`           | `video-card/video-card.driver.ts`                      | `video-card/video-card.cy.ts`                      | Title/desc/hashtags display, null handling, like/comment/report/profile callbacks, menu toggle                                                                                                     |
| `VideoFeed`           | `video-feed/video-feed.driver.ts`                      | `video-feed/video-feed.cy.ts`                      | Empty feed message, video card count, feed container visibility                                                                                                                                    |
| `CommentSection`      | `comment-section/comment-section.driver.ts`            | `comment-section/comment-section.cy.ts`            | Open/close, comment list, empty state, close callback, submit disabled                                                                                                                             |
| `NavBar`              | `nav-bar/nav-bar.driver.ts`                            | `nav-bar/nav-bar.cy.ts`                            | Visible on all pages, link labels, requires Next.js context wrappers                                                                                                                               |
| `FollowButton`        | `follow-button/follow-button.driver.ts`                | `follow-button/follow-button.cy.ts`                | Follow/unfollow toggle text                                                                                                                                                                        |
| `ReportDialog`        | `report-dialog/report-dialog.driver.ts`                | `report-dialog/report-dialog.cy.ts`                | Open/close, reason selection, submit with description, cancel callback                                                                                                                             |
| `HashtagSubscribe`    | `hashtag-subscribe/hashtag-subscribe.driver.ts`        | `hashtag-subscribe/hashtag-subscribe.cy.ts`        | Visibility, hashtag text, subscribe/unsubscribe click with intercepted API                                                                                                                         |
| `LoginForm`           | `login-form/login-form.driver.ts`                      | `login-form/login-form.cy.ts`                      | Email input, submit button, non-dell email error, HTML validation                                                                                                                                  |
| `SearchBar`           | `search-bar/search-bar.driver.ts`                      | `search-bar/search-bar.cy.ts`                      | Input visible, placeholder, search callback, empty/whitespace guard                                                                                                                                |
| `FeedClient`          | `app/(app)/feed/feed-client.driver.ts`                 | `app/(app)/feed/feed-client.cy.ts`                 | Empty feed, video count, comment open/close, report open/cancel/submit wiring                                                                                                                      |
| `SearchClient`        | `app/(app)/search/search-client.driver.ts`             | `app/(app)/search/search-client.cy.ts`             | Trending/subscriptions/hashtag/query headers, no results, search results grid                                                                                                                      |
| `VerifyForm`          | `app/(auth)/verify/verify-form.driver.ts`              | `app/(auth)/verify/verify-form.cy.ts`              | OTP input visible/placeholder/maxlength/inputMode, submit disabled when empty/partial, enabled with 6 digits, non-numeric filtering, email prop                                                    |
| `AdminSettingsClient` | `app/(app)/admin/settings/settings-client.driver.ts`   | `app/(app)/admin/settings/settings-client.cy.ts`   | Empty config, boolean toggle, text input, config key/description display, toggle PUT request with intercepted API                                                                                  |
| `AnalyticsClient`     | `app/(app)/admin/analytics/analytics-client.driver.ts` | `app/(app)/admin/analytics/analytics-client.cy.ts` | Loading state, overview cards (total users/videos/events), event breakdown, top videos/users, no views/activity empty states, period select                                                        |
| `UploadClient`        | `app/(app)/upload/upload-client.driver.ts`             | `app/(app)/upload/upload-client.cy.ts`             | Select step (dropzone, file input), details step (title/description/hashtag inputs, back/upload buttons), file validation (type, size), upload success (done step), upload failure (error display) |
| `PushNotificationPrompt` | `push-notification-prompt.driver.ts`                | `push-notification-prompt.cy.ts`                   | Visible when push is supported and not dismissed, hidden when unsupported / dismissed in last 30 days / already subscribed, dismiss writes `push-prompt-dismissed` to localStorage, enable POSTs subscription endpoint+keys to `/api/push/subscribe` and hides prompt                |

### Driver Composition

- `VideoCardDriver` composes `VideoPlayerDriver` (delegates `get.videoPlayer`)
- `VideoFeedDriver` composes `VideoCardDriver` (delegates `when.videoCard`, `get.videoCard`)
- `FeedClientDriver` composes `VideoFeedDriver`, `CommentSectionDriver`, `ReportDialogDriver`
- `SearchClientDriver` composes `SearchBarDriver`, `HashtagSubscribeDriver`

### Next.js Context Wrappers

NavBar requires `AppRouterContext.Provider` and `PathnameContext.Provider` as dynamic wrappers (from `next/dist/shared/lib/`) because `usePathname` and `Link` depend on Next.js router context. The driver exposes `pathnameValue` which the test file reads at render time via `wrappers: () => [...]`.

FeedClient, UploadClient use `AppRouterContext.Provider` wrapper because they depend on `useRouter` from `next/navigation`.
