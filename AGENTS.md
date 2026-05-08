<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Unit Tests (Vitest)

Tests live in `tests/unit/` and run via `npx vitest run`. All mocking uses `vi.mock()` / `vi.fn()`.

### Adapter Tests (`tests/unit/adapters/`)

| File                               | Covers                                                                                                                                                                                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cloudflare-video-service.test.ts` | `CloudflareVideoService` — upload URL, playback URL, delete                                                                                                                                                                                   |
| `demo-video-service.test.ts`       | `DemoVideoService` — fake upload, HLS playback URLs, no-op delete                                                                                                                                                                             |
| `resend-email-service.test.ts`     | Email service adapter                                                                                                                                                                                                                         |
| `gmail-email-service.test.ts`      | `GmailEmailService` — relay recipient, sendVerificationCode (code in body/subject/text, recipient in subject/body), sendMagicLink (URL in body, relay routing), custom DELL_RELAY_EMAIL, DellClips sender, error propagation (driver pattern) |
| `gdrive-video-service.test.ts`     | `GDriveVideoService` — manual upload URL, gdrive playback URL, non-gdrive fallback, no-op delete                                                                                                                                              |

### API Route Tests (`tests/unit/routes/`)

| File                        | Route(s)                                     | Key scenarios                                                      |
| --------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| `hashtags.test.ts`          | `GET /api/hashtags`                          | Auth, default/custom/capped limit, DB errors                       |
| `upload-url.test.ts`        | `POST /api/video/upload-url`                 | Auth, upload URL creation, service errors                          |
| `webhook.test.ts`           | `POST/HEAD /api/video/webhook`               | Ready/error/unknown status, missing uid, DB errors                 |
| `videos.test.ts`            | `GET/POST /api/videos`                       | Feed pagination, limit cap, video enrichment, validation, create   |
| `video-by-id.test.ts`       | `GET/DELETE /api/videos/[id]`                | Not found, forbidden, owner delete, provider failure fallback      |
| `comments.test.ts`          | `GET/POST /api/videos/[id]/comments`         | Fetch, create, validation (empty/too long), video not found        |
| `follow.test.ts`            | `POST/DELETE /api/videos/[id]/follow`        | Self-follow guard, user not found, follow/unfollow                 |
| `like.test.ts`              | `POST/DELETE /api/videos/[id]/like`          | Video not found, like/unlike                                       |
| `report.test.ts`            | `POST /api/videos/[id]/report`               | Valid reasons, invalid reason, missing reason, video not found     |
| `search.test.ts`            | `GET /api/videos/search`                     | Hashtag vs query, hashtag priority, limit cap, hasMore pagination  |
| `hashtag-subscribe.test.ts` | `POST/DELETE /api/hashtags/[name]/subscribe` | Auth, subscribe/unsubscribe, # stripping, normalization, DB errors |

### Utility / Helper Tests (`tests/unit/utils/`)

| File                   | Covers                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `utils.test.ts`        | `isDellEmail`, `parseHashtags`, `normalizeHashtag`, `timeAgo`, `REPORT_REASONS`                           |
| `auth-helpers.test.ts` | `getSession`, `requireAuth`, `requireAdmin`, `requireUserId` — auth/redirect/role checks (driver pattern) |

### Mocking Pattern for Route Tests

All route tests mock `@/lib/auth` and `@/lib/services` at the module level using `vi.mock()`. Each test verifies: auth guard (401), input validation (400), not found (404), forbidden (403 where applicable), success response, and DB error handling (500).

### Vitest Driver Pattern

Tests marked "(driver pattern)" use a separate `.driver.ts` file with `given`/`when`/`get` objects:

- **Driver** (`.driver.ts`) — owns mocks, service instantiation, result/error capture. Imports `beforeEach`/`vi` from `vitest`. Exposes `beforeAndAfter()`, `given`, `when`, `get`.
- **Test** (`.test.ts`) — imports driver + `chance`. Destructures `{ given, when, get }`. Uses BDD structure: `describe('given …') → beforeEach(given/when) → it('then …', expect(get…))`. One assertion per `it`.

## Cypress Component Tests

Tests live co-located with components as `<name>.cy.ts` + `<name>.driver.ts`. Run via `npx cypress run --component`.

### Tested Components

| Component          | Driver                                          | Test                                        | Key scenarios                                                                                                                                   |
| ------------------ | ----------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `VideoPlayer`      | `video-player/video-player.driver.ts`           | `video-player/video-player.cy.ts`           | Visible when active/inactive, mute button, play overlay, direct MP4 playback URL                                                                |
| `VideoCard`        | `video-card/video-card.driver.ts`               | `video-card/video-card.cy.ts`               | Title/desc/hashtags display, null handling, like/comment/report/profile callbacks, menu toggle                                                  |
| `VideoFeed`        | `video-feed/video-feed.driver.ts`               | `video-feed/video-feed.cy.ts`               | Empty feed message, video card count, feed container visibility                                                                                 |
| `CommentSection`   | `comment-section/comment-section.driver.ts`     | `comment-section/comment-section.cy.ts`     | Open/close, comment list, empty state, close callback, submit disabled                                                                          |
| `NavBar`           | `nav-bar/nav-bar.driver.ts`                     | `nav-bar/nav-bar.cy.ts`                     | Visible on all pages, link labels, requires Next.js context wrappers                                                                            |
| `FollowButton`     | `follow-button/follow-button.driver.ts`         | `follow-button/follow-button.cy.ts`         | Follow/unfollow toggle text                                                                                                                     |
| `ReportDialog`     | `report-dialog/report-dialog.driver.ts`         | `report-dialog/report-dialog.cy.ts`         | Open/close, reason selection, submit with description, cancel callback                                                                          |
| `HashtagSubscribe` | `hashtag-subscribe/hashtag-subscribe.driver.ts` | `hashtag-subscribe/hashtag-subscribe.cy.ts` | Visibility, hashtag text, subscribe/unsubscribe click with intercepted API                                                                      |
| `LoginForm`        | `login-form/login-form.driver.ts`               | `login-form/login-form.cy.ts`               | Email input, submit button, non-dell email error, HTML validation                                                                               |
| `SearchBar`        | `search-bar/search-bar.driver.ts`               | `search-bar/search-bar.cy.ts`               | Input visible, placeholder, search callback, empty/whitespace guard                                                                             |
| `FeedClient`       | `app/(app)/feed/feed-client.driver.ts`          | `app/(app)/feed/feed-client.cy.ts`          | Empty feed, video count, comment open/close, report open/cancel/submit wiring                                                                   |
| `SearchClient`     | `app/(app)/search/search-client.driver.ts`      | `app/(app)/search/search-client.cy.ts`      | Trending/subscriptions/hashtag/query headers, no results, search results grid                                                                   |
| `VerifyForm`       | `app/(auth)/verify/verify-form.driver.ts`       | `app/(auth)/verify/verify-form.cy.ts`       | OTP input visible/placeholder/maxlength/inputMode, submit disabled when empty/partial, enabled with 6 digits, non-numeric filtering, email prop |

### Driver Composition

- `VideoCardDriver` composes `VideoPlayerDriver` (delegates `get.videoPlayer`)
- `VideoFeedDriver` composes `VideoCardDriver` (delegates `when.videoCard`, `get.videoCard`)
- `FeedClientDriver` composes `VideoFeedDriver`, `CommentSectionDriver`, `ReportDialogDriver`
- `SearchClientDriver` composes `SearchBarDriver`, `HashtagSubscribeDriver`

### Next.js Context Wrappers

NavBar requires `AppRouterContext.Provider` and `PathnameContext.Provider` as dynamic wrappers (from `next/dist/shared/lib/`) because `usePathname` and `Link` depend on Next.js router context. The driver exposes `pathnameValue` which the test file reads at render time via `wrappers: () => [...]`.
