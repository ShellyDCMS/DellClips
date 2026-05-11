import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { CommentsDriver } from "./comments.driver";

const chance = new Chance();

describe("GET /api/videos/[id]/comments", () => {
  const driver = new CommentsDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.getComments("video-1");
    });

    it("then it should return 401", () => {
      expect(get.status()).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    const userId = chance.guid();

    beforeEach(() => {
      given.authenticatedUser(userId);
    });

    describe("when fetching comments for a video", () => {
      const commentText = chance.sentence();
      const videoId = chance.guid();

      beforeEach(async () => {
        given.comments([
          {
            id: chance.guid(),
            text: commentText,
            createdAt: new Date().toISOString(),
            author: { id: chance.guid(), name: chance.name(), avatarUrl: null },
          },
        ]);
        await when.getComments(videoId);
      });

      it("then it should return the comments", () => {
        expect(get.body().comments).toHaveLength(1);
      });

      it("then the comment text should match", () => {
        expect(get.body().comments[0].text).toBe(commentText);
      });

      it("then it should pass the video ID to the database service", () => {
        expect(get.getCommentsMock()).toHaveBeenCalledWith(videoId);
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.commentsFetchFails(new Error("DB error"));
        await when.getComments("video-1");
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to fetch comments");
      });
    });
  });
});

describe("POST /api/videos/[id]/comments", () => {
  const driver = new CommentsDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.postComment("video-1", { text: "Hello" });
    });

    it("then it should return 401", () => {
      expect(get.status()).toBe(401);
    });
  });

  describe("given an authenticated user", () => {
    const userId = chance.guid();

    beforeEach(() => {
      given.authenticatedUser(userId);
    });

    describe("when sending a valid comment on someone else's video", () => {
      const videoId = chance.guid();
      const authorId = chance.guid();
      const commentText = chance.sentence();
      const commentId = chance.guid();
      const commenterName = chance.name();

      beforeEach(async () => {
        given.video({ id: videoId, author: { id: authorId } });
        given.createComment({ id: commentId });
        given.commenter({ id: userId, name: commenterName });
        given.notificationSendSucceeds();
        await when.postComment(videoId, { text: commentText });
      });

      it("then it should return 201", () => {
        expect(get.status()).toBe(201);
      });

      it("then it should return the comment id", () => {
        expect(get.body().comment.id).toBe(commentId);
      });

      it("then it should pass the correct arguments to createComment", () => {
        expect(get.createCommentMock()).toHaveBeenCalledWith(
          userId,
          videoId,
          commentText
        );
      });

      it("then it should notify the video author", () => {
        expect(get.sendToUserMock()).toHaveBeenCalledWith(
          authorId,
          expect.objectContaining({
            title: expect.stringContaining("Comment"),
            body: expect.stringContaining(commenterName),
            url: `/feed?video=${videoId}`,
            tag: `comment-${videoId}`,
          })
        );
      });
    });

    describe("when sending a comment on own video", () => {
      const videoId = chance.guid();

      beforeEach(async () => {
        given.video({ id: videoId, author: { id: userId } });
        given.createComment({ id: chance.guid() });
        await when.postComment(videoId, { text: chance.sentence() });
      });

      it("then it should return 201", () => {
        expect(get.status()).toBe(201);
      });

      it("then it should not send a notification", () => {
        expect(get.sendToUserMock()).not.toHaveBeenCalled();
      });
    });

    describe("when sending an empty text", () => {
      beforeEach(async () => {
        await when.postComment("video-1", { text: "" });
      });

      it("then it should return 400", () => {
        expect(get.status()).toBe(400);
      });

      it("then it should return Invalid request error", () => {
        expect(get.body().error).toBe("Invalid request");
      });
    });

    describe("when the text exceeds 1000 characters", () => {
      beforeEach(async () => {
        await when.postComment("video-1", { text: "a".repeat(1001) });
      });

      it("then it should return 400", () => {
        expect(get.status()).toBe(400);
      });
    });

    describe("when the video does not exist", () => {
      beforeEach(async () => {
        given.videoNotFound();
        await when.postComment("nonexistent", { text: "Hello" });
      });

      it("then it should return 404", () => {
        expect(get.status()).toBe(404);
      });

      it("then it should return Video not found error", () => {
        expect(get.body().error).toBe("Video not found");
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.video({ id: "video-1" });
        given.createCommentFails(new Error("DB error"));
        await when.postComment("video-1", { text: "Hello" });
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to create comment");
      });
    });
  });
});
