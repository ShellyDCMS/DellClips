import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { UserSearchDriver } from "./user-search.driver";

const chance = new Chance();

describe("GET /api/users/search", () => {
  const driver = new UserSearchDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.search("jane");
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

    describe("when searching with a query", () => {
      const query = chance.word();
      const users = [
        {
          id: chance.guid(),
          name: chance.name(),
          email: chance.email(),
          avatarUrl: null,
        },
        {
          id: chance.guid(),
          name: chance.name(),
          email: chance.email(),
          avatarUrl: chance.url(),
        },
      ];

      beforeEach(async () => {
        given.searchReturns(users);
        await when.search(query);
      });

      it("then it should return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should return the users array", () => {
        expect(get.body().users).toEqual(users);
      });

      it("then it should call searchUsers with the trimmed query", () => {
        expect(get.searchUsersMock()).toHaveBeenCalledWith(query, 20);
      });
    });

    describe("when searching with a custom limit", () => {
      const query = chance.word();

      beforeEach(async () => {
        given.searchReturns([]);
        await when.search(query, 5);
      });

      it("then it should call searchUsers with the custom limit", () => {
        expect(get.searchUsersMock()).toHaveBeenCalledWith(query, 5);
      });
    });

    describe("when searching with a limit exceeding the cap", () => {
      const query = chance.word();

      beforeEach(async () => {
        given.searchReturns([]);
        await when.search(query, 100);
      });

      it("then it should cap the limit to 50", () => {
        expect(get.searchUsersMock()).toHaveBeenCalledWith(query, 50);
      });
    });

    describe("when searching with an empty query", () => {
      beforeEach(async () => {
        given.searchReturns([]);
        await when.search("");
      });

      it("then it should return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should return an empty users array", () => {
        expect(get.body().users).toEqual([]);
      });

      it("then it should not call searchUsers", () => {
        expect(get.searchUsersMock()).not.toHaveBeenCalled();
      });
    });

    describe("when searching with a whitespace-only query", () => {
      beforeEach(async () => {
        given.searchReturns([]);
        await when.search("   ");
      });

      it("then it should return an empty users array", () => {
        expect(get.body().users).toEqual([]);
      });

      it("then it should not call searchUsers", () => {
        expect(get.searchUsersMock()).not.toHaveBeenCalled();
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.searchFails(new Error("DB error"));
        await when.search(chance.word());
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to search users");
      });
    });
  });
});
