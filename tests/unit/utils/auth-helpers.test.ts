import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { AuthHelpersDriver } from "./auth-helpers.driver";

const chance = new Chance();

describe("auth-helpers", () => {
  const driver = new AuthHelpersDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("getSession", () => {
    describe("given the user is authenticated", () => {
      const session = {
        user: { id: chance.guid(), email: chance.email({ domain: "dell.com" }) },
      };

      beforeEach(async () => {
        given.authenticatedUser(session);
        await when.getSession();
      });

      it("then it should return the session", () => {
        expect(get.lastResult()).toEqual(session);
      });
    });

    describe("given the user is not authenticated", () => {
      beforeEach(async () => {
        given.unauthenticated();
        await when.getSession();
      });

      it("then it should return null", () => {
        expect(get.lastResult()).toBeNull();
      });
    });
  });

  describe("requireAuth", () => {
    describe("given the user is authenticated", () => {
      const session = {
        user: { id: chance.guid(), email: chance.email({ domain: "dell.com" }) },
      };

      beforeEach(async () => {
        given.authenticatedUser(session);
        await when.requireAuth();
      });

      it("then it should return the session", () => {
        expect(get.lastResult()).toEqual(session);
      });

      it("then it should not redirect", () => {
        expect(get.redirectMock()).not.toHaveBeenCalled();
      });
    });

    describe("given the user is not authenticated", () => {
      beforeEach(async () => {
        given.unauthenticated();
        await when.requireAuth();
      });

      it("then it should redirect to /login", () => {
        expect(get.redirectMock()).toHaveBeenCalledWith("/login");
      });

      it("then it should throw NEXT_REDIRECT", () => {
        expect(get.lastError()?.message).toBe("NEXT_REDIRECT");
      });
    });

    describe("given the session has no user", () => {
      beforeEach(async () => {
        given.sessionWithNoUser();
        await when.requireAuth();
      });

      it("then it should redirect to /login", () => {
        expect(get.redirectMock()).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("requireAdmin", () => {
    describe("given an authenticated admin user", () => {
      const userId = chance.guid();
      const session = {
        user: { id: userId, email: chance.email({ domain: "dell.com" }) },
      };

      beforeEach(async () => {
        given.authenticatedUser(session);
        given.userInDatabase({ id: userId, role: "admin" });
        await when.requireAdmin();
      });

      it("then it should return the session", () => {
        expect(get.lastResult()).toEqual(session);
      });

      it("then it should look up the user by ID", () => {
        expect(get.getUserByIdMock()).toHaveBeenCalledWith(userId);
      });
    });

    describe("given an authenticated non-admin user", () => {
      const userId = chance.guid();
      const session = {
        user: { id: userId, email: chance.email({ domain: "dell.com" }) },
      };

      beforeEach(async () => {
        given.authenticatedUser(session);
        given.userInDatabase({ id: userId, role: "user" });
        await when.requireAdmin();
      });

      it("then it should redirect to /feed", () => {
        expect(get.redirectMock()).toHaveBeenCalledWith("/feed");
      });
    });

    describe("given the user is not authenticated", () => {
      beforeEach(async () => {
        given.unauthenticated();
        await when.requireAdmin();
      });

      it("then it should redirect to /login", () => {
        expect(get.redirectMock()).toHaveBeenCalledWith("/login");
      });
    });

    describe("given the user is not found in the database", () => {
      const session = {
        user: { id: chance.guid(), email: chance.email({ domain: "dell.com" }) },
      };

      beforeEach(async () => {
        given.authenticatedUser(session);
        given.userNotInDatabase();
        await when.requireAdmin();
      });

      it("then it should redirect to /feed", () => {
        expect(get.redirectMock()).toHaveBeenCalledWith("/feed");
      });
    });
  });

  describe("requireUserId", () => {
    describe("given the user is authenticated", () => {
      const userId = chance.guid();

      beforeEach(async () => {
        given.authenticatedUser({ user: { id: userId } });
        await when.requireUserId();
      });

      it("then it should return the user ID", () => {
        expect(get.lastResult()).toBe(userId);
      });
    });

    describe("given the user is not authenticated", () => {
      beforeEach(async () => {
        given.unauthenticated();
        await when.requireUserId();
      });

      it("then it should throw Unauthorized", () => {
        expect(get.lastError()?.message).toBe("Unauthorized");
      });
    });

    describe("given the session has no user ID", () => {
      beforeEach(async () => {
        given.sessionWithNoUserId();
        await when.requireUserId();
      });

      it("then it should throw Unauthorized", () => {
        expect(get.lastError()?.message).toBe("Unauthorized");
      });
    });
  });
});
