import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { FollowDriver } from "./follow.driver";

const chance = new Chance();

describe("POST /api/users/[id]/follow", () => {
  const driver = new FollowDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.follow("user-2");
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

    describe("when trying to follow themselves", () => {
      beforeEach(async () => {
        await when.follow(userId);
      });

      it("then it should return 400", () => {
        expect(get.status()).toBe(400);
      });

      it("then it should return Cannot follow yourself error", () => {
        expect(get.body().error).toBe("Cannot follow yourself");
      });
    });

    describe("when the target user does not exist", () => {
      beforeEach(async () => {
        given.targetUserNotFound();
        await when.follow("nonexistent");
      });

      it("then it should return 404", () => {
        expect(get.status()).toBe(404);
      });

      it("then it should return User not found error", () => {
        expect(get.body().error).toBe("User not found");
      });
    });

    describe("when the target user exists", () => {
      const targetId = chance.guid();
      const followerName = chance.name();

      beforeEach(async () => {
        given.usersById({
          [targetId]: { id: targetId, name: chance.name() },
          [userId]: { id: userId, name: followerName },
        });
        given.followSucceeds();
        given.notificationSendSucceeds();
        await when.follow(targetId);
      });

      it("then it should return following true", () => {
        expect(get.body().following).toBe(true);
      });

      it("then it should call followUser with correct arguments", () => {
        expect(get.followUserMock()).toHaveBeenCalledWith({
          followerId: userId,
          followingId: targetId,
        });
      });

      it("then it should notify the target user", () => {
        expect(get.sendToUserMock()).toHaveBeenCalledWith(
          targetId,
          expect.objectContaining({
            title: expect.stringContaining("Follower"),
            body: expect.stringContaining(followerName),
            url: `/profile/${userId}`,
            tag: `follow-${userId}`,
          })
        );
      });
    });

    describe("when the database throws an error", () => {
      const targetId = chance.guid();

      beforeEach(async () => {
        given.targetUser({ id: targetId });
        given.followFails(new Error("DB error"));
        await when.follow(targetId);
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to follow user");
      });
    });
  });
});

describe("DELETE /api/users/[id]/follow", () => {
  const driver = new FollowDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.unfollow("user-2");
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

    describe("when unfollowing a user", () => {
      const targetId = chance.guid();

      beforeEach(async () => {
        given.unfollowSucceeds();
        await when.unfollow(targetId);
      });

      it("then it should return following false", () => {
        expect(get.body().following).toBe(false);
      });

      it("then it should call unfollowUser with correct arguments", () => {
        expect(get.unfollowUserMock()).toHaveBeenCalledWith({
          followerId: userId,
          followingId: targetId,
        });
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.unfollowFails(new Error("DB error"));
        await when.unfollow(chance.guid());
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to unfollow user");
      });
    });
  });
});
