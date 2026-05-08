import Chance from "chance";
import { beforeEach, describe, expect, it } from "vitest";
import { AdminConfigDriver } from "./admin-config.driver";

const chance = new Chance();

describe("GET /api/admin/config", () => {
  const driver = new AdminConfigDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.getConfig();
    });

    it("then it should return 401", () => {
      expect(get.status()).toBe(401);
    });

    it("then it should return Unauthorized error", () => {
      expect(get.body().error).toBe("Unauthorized");
    });
  });

  describe("given an authenticated non-admin user", () => {
    const userId = chance.guid();

    beforeEach(async () => {
      given.authenticatedUser(userId);
      given.userWithRole(userId, "user");
      await when.getConfig();
    });

    it("then it should return 403", () => {
      expect(get.status()).toBe(403);
    });

    it("then it should return Forbidden error", () => {
      expect(get.body().error).toBe("Forbidden");
    });
  });

  describe("given an authenticated admin user", () => {
    const adminId = chance.guid();
    const configKey = chance.word();

    beforeEach(() => {
      given.authenticatedUser(adminId);
      given.userWithRole(adminId, "admin");
    });

    describe("when fetching config succeeds", () => {
      beforeEach(async () => {
        given.allConfig([
          {
            key: configKey,
            value: "true",
            description: chance.sentence(),
            updatedAt: new Date(),
          },
        ]);
        await when.getConfig();
      });

      it("then it should return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should return config values", () => {
        expect(get.body().config).toHaveLength(1);
      });

      it("then the config key should match", () => {
        expect(get.body().config[0].key).toBe(configKey);
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.allConfigFails(new Error("DB error"));
        await when.getConfig();
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to fetch config");
      });
    });
  });
});

describe("PUT /api/admin/config", () => {
  const driver = new AdminConfigDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  describe("given an unauthenticated user", () => {
    beforeEach(async () => {
      given.unauthenticated();
      await when.putConfig({ key: "k", value: "v" });
    });

    it("then it should return 401", () => {
      expect(get.status()).toBe(401);
    });

    it("then it should return Unauthorized error", () => {
      expect(get.body().error).toBe("Unauthorized");
    });
  });

  describe("given an authenticated non-admin user", () => {
    const userId = chance.guid();

    beforeEach(async () => {
      given.authenticatedUser(userId);
      given.userWithRole(userId, "user");
      await when.putConfig({ key: "k", value: "v" });
    });

    it("then it should return 403", () => {
      expect(get.status()).toBe(403);
    });

    it("then it should return Forbidden error", () => {
      expect(get.body().error).toBe("Forbidden");
    });
  });

  describe("given an authenticated admin user", () => {
    const adminId = chance.guid();

    beforeEach(() => {
      given.authenticatedUser(adminId);
      given.userWithRole(adminId, "admin");
    });

    describe("when sending a valid key and value", () => {
      const key = chance.word();
      const value = chance.word();

      beforeEach(async () => {
        given.setConfigSucceeds();
        await when.putConfig({ key, value });
      });

      it("then it should return 200", () => {
        expect(get.status()).toBe(200);
      });

      it("then it should return updated true", () => {
        expect(get.body().updated).toBe(true);
      });

      it("then it should return the key", () => {
        expect(get.body().key).toBe(key);
      });

      it("then it should return the value", () => {
        expect(get.body().value).toBe(value);
      });

      it("then it should call setConfigValue with correct arguments", () => {
        expect(get.setConfigValueMock()).toHaveBeenCalledWith(key, value, adminId);
      });
    });

    describe("when the key is missing", () => {
      beforeEach(async () => {
        await when.putConfig({ value: "v" });
      });

      it("then it should return 400", () => {
        expect(get.status()).toBe(400);
      });

      it("then it should return validation error", () => {
        expect(get.body().error).toBe("key and value are required");
      });
    });

    describe("when the value is undefined", () => {
      beforeEach(async () => {
        await when.putConfig({ key: "k" });
      });

      it("then it should return 400", () => {
        expect(get.status()).toBe(400);
      });

      it("then it should return validation error", () => {
        expect(get.body().error).toBe("key and value are required");
      });
    });

    describe("when the database throws an error", () => {
      beforeEach(async () => {
        given.setConfigFails(new Error("DB error"));
        await when.putConfig({ key: "k", value: "v" });
      });

      it("then it should return 500", () => {
        expect(get.status()).toBe(500);
      });

      it("then it should return failure message", () => {
        expect(get.body().error).toBe("Failed to update config");
      });
    });
  });
});
