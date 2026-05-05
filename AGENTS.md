<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Unit Tests (Vitest)

Tests live in `tests/unit/` and run via `npx vitest run`. All mocking uses `vi.mock()` / `vi.fn()`.

### Adapter Tests (`tests/unit/adapters/`)

| File                               | Covers                                                            |
| ---------------------------------- | ----------------------------------------------------------------- |
| `cloudflare-video-service.test.ts` | `CloudflareVideoService` — upload URL, playback URL, delete       |
| `demo-video-service.test.ts`       | `DemoVideoService` — fake upload, HLS playback URLs, no-op delete |
| `resend-email-service.test.ts`     | Email service adapter                                             |

### API Route Tests (`tests/unit/routes/`)

| File                  | Route(s)                              | Key scenarios                                                     |
| --------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| `hashtags.test.ts`    | `GET /api/hashtags`                   | Auth, default/custom/capped limit, DB errors                      |
| `upload-url.test.ts`  | `POST /api/video/upload-url`          | Auth, upload URL creation, service errors                         |
| `webhook.test.ts`     | `POST/HEAD /api/video/webhook`        | Ready/error/unknown status, missing uid, DB errors                |
| `videos.test.ts`      | `GET/POST /api/videos`                | Feed pagination, limit cap, video enrichment, validation, create  |
| `video-by-id.test.ts` | `GET/DELETE /api/videos/[id]`         | Not found, forbidden, owner delete, provider failure fallback     |
| `comments.test.ts`    | `GET/POST /api/videos/[id]/comments`  | Fetch, create, validation (empty/too long), video not found       |
| `follow.test.ts`      | `POST/DELETE /api/videos/[id]/follow` | Self-follow guard, user not found, follow/unfollow                |
| `like.test.ts`        | `POST/DELETE /api/videos/[id]/like`   | Video not found, like/unlike                                      |
| `report.test.ts`      | `POST /api/videos/[id]/report`        | Valid reasons, invalid reason, missing reason, video not found    |
| `search.test.ts`      | `GET /api/videos/search`              | Hashtag vs query, hashtag priority, limit cap, hasMore pagination |

### Mocking Pattern for Route Tests

All route tests mock `@/lib/auth` and `@/lib/services` at the module level using `vi.mock()`. Each test verifies: auth guard (401), input validation (400), not found (404), forbidden (403 where applicable), success response, and DB error handling (500).
