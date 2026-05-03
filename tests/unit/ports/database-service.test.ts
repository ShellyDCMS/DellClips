import type { DatabaseService } from "@/lib/ports/database-service";
import sinon from "sinon";
import { StubbedInstanceCreator } from "ts-stubber";
import { beforeEach, describe, expect, it } from "vitest";

describe("DatabaseService Port (interface contract via ts-stubber)", () => {
  let service: DatabaseService;

  beforeEach(() => {
    service = StubbedInstanceCreator<DatabaseService, sinon.SinonStub>(() =>
      sinon.stub()
    ).createStubbedInstance();
  });

  describe("given a stubbed DatabaseService", () => {
    // ============================================
    // VIDEOS
    // ============================================

    describe("when calling getVideoFeed", () => {
      it("then it should return an array of videos with authors", async () => {
        // given
        const mockFeed = [
          {
            id: "video-1",
            title: "Q4 Kickoff",
            description: "Sales update",
            videoPlaybackId: "playback-1",
            status: "ready",
            duration: 30,
            likeCount: 5,
            commentCount: 2,
            createdAt: new Date(),
            author: {
              id: "user-1",
              name: "John Doe",
              email: "john@dell.com",
              avatarUrl: null,
            },
            hashtags: ["sales", "q4"],
          },
        ];
        (service.getVideoFeed as sinon.SinonStub).resolves(mockFeed);

        // when
        const result = await service.getVideoFeed({ limit: 20, offset: 0 });

        // then
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty("id");
        expect(result[0]).toHaveProperty("author");
        expect(result[0]).toHaveProperty("hashtags");
        expect(result[0].author).toHaveProperty("email");
      });
    });

    describe("when calling getVideoById", () => {
      it("then it should return a video or null", async () => {
        // given
        (service.getVideoById as sinon.SinonStub).resolves(null);

        // when
        const result = await service.getVideoById("nonexistent-id");

        // then
        expect(result).toBeNull();
      });
    });

    describe("when calling createVideoRecord", () => {
      it("then it should return the created video id", async () => {
        // given
        (service.createVideoRecord as sinon.SinonStub).resolves({
          id: "new-video-id",
        });

        // when
        const result = await service.createVideoRecord({
          userId: "user-1",
          title: "Demo Video",
          videoAssetId: "asset-123",
          videoPlaybackId: "playback-123",
          hashtags: ["demo"],
        });

        // then
        expect(result).toHaveProperty("id");
        expect(result.id).toBe("new-video-id");
      });
    });

    describe("when calling updateVideoStatus", () => {
      it("then it should resolve without error", async () => {
        // given
        (service.updateVideoStatus as sinon.SinonStub).resolves(undefined);

        // when / then
        await expect(
          service.updateVideoStatus("asset-123", "ready", 28.5)
        ).resolves.toBeUndefined();
      });
    });

    describe("when calling deleteVideo", () => {
      it("then it should resolve without error", async () => {
        // given
        (service.deleteVideo as sinon.SinonStub).resolves(undefined);

        // when / then
        await expect(service.deleteVideo("video-123")).resolves.toBeUndefined();
      });
    });

    // ============================================
    // LIKES
    // ============================================

    describe("when calling likeVideo", () => {
      it("then it should resolve without error", async () => {
        // given
        (service.likeVideo as sinon.SinonStub).resolves(undefined);

        // when / then
        await expect(service.likeVideo("user-1", "video-1")).resolves.toBeUndefined();
      });
    });

    describe("when calling unlikeVideo", () => {
      it("then it should resolve without error", async () => {
        // given
        (service.unlikeVideo as sinon.SinonStub).resolves(undefined);

        // when / then
        await expect(service.unlikeVideo("user-1", "video-1")).resolves.toBeUndefined();
      });
    });

    describe("when calling hasUserLikedVideo", () => {
      it("then it should return a boolean", async () => {
        // given
        (service.hasUserLikedVideo as sinon.SinonStub).resolves(true);

        // when
        const result = await service.hasUserLikedVideo("user-1", "video-1");

        // then
        expect(typeof result).toBe("boolean");
        expect(result).toBe(true);
      });
    });

    // ============================================
    // COMMENTS
    // ============================================

    describe("when calling getCommentsByVideoId", () => {
      it("then it should return an array of comments with authors", async () => {
        // given
        const mockComments = [
          {
            id: "comment-1",
            text: "Great video!",
            createdAt: new Date(),
            author: { id: "user-2", name: "Jane", avatarUrl: null },
          },
        ];
        (service.getCommentsByVideoId as sinon.SinonStub).resolves(mockComments);

        // when
        const result = await service.getCommentsByVideoId("video-1");

        // then
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty("text");
        expect(result[0]).toHaveProperty("author");
      });
    });

    describe("when calling createComment", () => {
      it("then it should return the created comment id", async () => {
        // given
        (service.createComment as sinon.SinonStub).resolves({
          id: "comment-new",
        });

        // when
        const result = await service.createComment("user-1", "video-1", "Nice work!");

        // then
        expect(result).toHaveProperty("id");
        expect(result.id).toBe("comment-new");
      });
    });

    describe("when calling deleteComment", () => {
      it("then it should resolve without error", async () => {
        // given
        (service.deleteComment as sinon.SinonStub).resolves(undefined);

        // when / then
        await expect(
          service.deleteComment("comment-1", "user-1")
        ).resolves.toBeUndefined();
      });
    });

    // ============================================
    // REPORTS
    // ============================================

    describe("when calling createReport", () => {
      it("then it should return the created report id", async () => {
        // given
        (service.createReport as sinon.SinonStub).resolves({
          id: "report-new",
        });

        // when
        const result = await service.createReport({
          userId: "user-1",
          videoId: "video-1",
          reason: "offensive",
          description: "Inappropriate content",
        });

        // then
        expect(result).toHaveProperty("id");
        expect(result.id).toBe("report-new");
      });
    });

    describe("when calling getReportsByVideoId", () => {
      it("then it should return an array of reports", async () => {
        // given
        const mockReports = [
          {
            id: "report-1",
            reason: "spam",
            description: null,
            status: "pending",
            createdAt: new Date(),
            reportedBy: {
              id: "user-2",
              name: "Jane",
              email: "jane@dell.com",
            },
          },
        ];
        (service.getReportsByVideoId as sinon.SinonStub).resolves(mockReports);

        // when
        const result = await service.getReportsByVideoId("video-1");

        // then
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty("reason");
        expect(result[0]).toHaveProperty("reportedBy");
      });
    });

    describe("when calling getPendingReports", () => {
      it("then it should return pending reports with video info", async () => {
        // given
        (service.getPendingReports as sinon.SinonStub).resolves([
          {
            id: "report-1",
            reason: "offensive",
            description: null,
            status: "pending",
            createdAt: new Date(),
            video: { id: "video-1", title: "Bad Video" },
            reportedBy: {
              id: "user-1",
              name: "John",
              email: "john@dell.com",
            },
          },
        ]);

        // when
        const result = await service.getPendingReports();

        // then
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty("video");
        expect(result[0].status).toBe("pending");
      });
    });

    describe("when calling updateReportStatus", () => {
      it("then it should resolve without error", async () => {
        // given
        (service.updateReportStatus as sinon.SinonStub).resolves(undefined);

        // when / then
        await expect(
          service.updateReportStatus("report-1", "reviewed", "admin-1")
        ).resolves.toBeUndefined();
      });
    });

    // ============================================
    // FOLLOWS
    // ============================================

    describe("when calling followUser", () => {
      it("then it should resolve without error", async () => {
        // given
        (service.followUser as sinon.SinonStub).resolves(undefined);

        // when / then
        await expect(
          service.followUser({
            followerId: "user-1",
            followingId: "user-2",
          })
        ).resolves.toBeUndefined();
      });
    });

    describe("when calling unfollowUser", () => {
      it("then it should resolve without error", async () => {
        // given
        (service.unfollowUser as sinon.SinonStub).resolves(undefined);

        // when / then
        await expect(
          service.unfollowUser({
            followerId: "user-1",
            followingId: "user-2",
          })
        ).resolves.toBeUndefined();
      });
    });

    describe("when calling isFollowing", () => {
      it("then it should return a boolean", async () => {
        // given
        (service.isFollowing as sinon.SinonStub).resolves(false);

        // when
        const result = await service.isFollowing("user-1", "user-2");

        // then
        expect(typeof result).toBe("boolean");
        expect(result).toBe(false);
      });
    });

    describe("when calling getFollowerCount", () => {
      it("then it should return a number", async () => {
        // given
        (service.getFollowerCount as sinon.SinonStub).resolves(42);

        // when
        const result = await service.getFollowerCount("user-1");

        // then
        expect(typeof result).toBe("number");
        expect(result).toBe(42);
      });
    });

    describe("when calling getFollowingCount", () => {
      it("then it should return a number", async () => {
        // given
        (service.getFollowingCount as sinon.SinonStub).resolves(10);

        // when
        const result = await service.getFollowingCount("user-1");

        // then
        expect(typeof result).toBe("number");
        expect(result).toBe(10);
      });
    });

    describe("when calling getFollowingIds", () => {
      it("then it should return an array of user IDs", async () => {
        // given
        (service.getFollowingIds as sinon.SinonStub).resolves(["user-2", "user-3"]);

        // when
        const result = await service.getFollowingIds("user-1");

        // then
        expect(result).toHaveLength(2);
        expect(result).toContain("user-2");
      });
    });

    // ============================================
    // SEARCH & HASHTAGS
    // ============================================

    describe("when calling searchVideos", () => {
      it("then it should return matching videos", async () => {
        // given
        (service.searchVideos as sinon.SinonStub).resolves([]);

        // when
        const result = await service.searchVideos({ query: "nonexistent" });

        // then
        expect(result).toEqual([]);
      });
    });

    describe("when calling getVideosByHashtag", () => {
      it("then it should return videos tagged with the hashtag", async () => {
        // given
        (service.getVideosByHashtag as sinon.SinonStub).resolves([]);

        // when
        const result = await service.getVideosByHashtag("delltech");

        // then
        expect(result).toEqual([]);
      });
    });

    describe("when calling getTrendingHashtags", () => {
      it("then it should return hashtags with counts", async () => {
        // given
        const mockTrending = [
          { name: "delltech", count: 15 },
          { name: "engineering", count: 10 },
        ];
        (service.getTrendingHashtags as sinon.SinonStub).resolves(mockTrending);

        // when
        const result = await service.getTrendingHashtags(10);

        // then
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty("name");
        expect(result[0]).toHaveProperty("count");
      });
    });

    // ============================================
    // USERS
    // ============================================

    describe("when calling getUserById", () => {
      it("then it should return a user or null", async () => {
        // given
        (service.getUserById as sinon.SinonStub).resolves({
          id: "user-1",
          email: "john@dell.com",
          name: "John Doe",
          avatarUrl: null,
          role: "user",
          createdAt: new Date(),
        });

        // when
        const result = await service.getUserById("user-1");

        // then
        expect(result).not.toBeNull();
        expect(result!.email).toBe("john@dell.com");
        expect(result!.role).toBe("user");
      });
    });

    describe("when calling getUserByEmail", () => {
      it("then it should return a user or null", async () => {
        // given
        (service.getUserByEmail as sinon.SinonStub).resolves({
          id: "user-1",
          email: "john@dell.com",
          name: "John Doe",
        });

        // when
        const result = await service.getUserByEmail("john@dell.com");

        // then
        expect(result).not.toBeNull();
        expect(result!.id).toBe("user-1");
      });
    });
  });
});
