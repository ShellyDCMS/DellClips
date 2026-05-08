import { RenderFactory } from "@/components/__test-utils__/renderer";
import { then } from "@shellygo/cypress-test-utils";
import Chance from "chance";
import AdminSettingsClient from "./settings-client";
import { AdminSettingsClientDriver } from "./settings-client.driver";

const chance = new Chance();

describe("AdminSettingsClient", () => {
  const driver = new AdminSettingsClientDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  beforeEach(() => {
    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: AdminSettingsClient,
        props: get.props() as any,
      }),
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given an empty config list", () => {
    beforeEach(() => {
      given.initialConfig([]);
      when.render();
    });

    it("then the settings container should be visible", () => {
      get.container().should("be.visible");
    });

    it("then the title should say App Settings", () => {
      then(get.title()).shouldEqual("App Settings");
    });

    it("then there should be no config items", () => {
      get.configItem().should("not.exist");
    });
  });

  describe("given a boolean config item", () => {
    const configKey = chance.word();
    const configDescription = chance.sentence();

    beforeEach(() => {
      given.initialConfig([
        {
          key: configKey,
          value: "true",
          description: configDescription,
          updatedAt: new Date(),
        },
      ]);
      when.render();
    });

    it("then there should be one config item", () => {
      then(get.numberOfConfigItems()).shouldEqual(1);
    });

    it("then the config key should be visible", () => {
      get.configKey().should("be.visible");
    });

    it("then the config key text should match", () => {
      then(get.configKeyText()).shouldEqual(configKey);
    });

    it("then the description should be visible", () => {
      get.configDescription().should("be.visible");
    });

    it("then the toggle button should be visible", () => {
      get.toggle().should("be.visible");
    });
  });

  describe("given a text config item", () => {
    const configKey = chance.word();
    const configValue = chance.url();

    beforeEach(() => {
      given.initialConfig([
        {
          key: configKey,
          value: configValue,
          description: null,
          updatedAt: new Date(),
        },
      ]);
      when.render();
    });

    it("then the text input should be visible", () => {
      get.textInput().should("be.visible");
    });

    it("then the toggle should not exist", () => {
      get.toggleElement().should("not.exist");
    });
  });

  describe("given multiple config items", () => {
    const boolKey = chance.word();
    const textKey = chance.word();
    const textValue = chance.word();

    beforeEach(() => {
      given.initialConfig([
        {
          key: boolKey,
          value: "false",
          description: null,
          updatedAt: new Date(),
        },
        {
          key: textKey,
          value: textValue,
          description: null,
          updatedAt: new Date(),
        },
      ]);
      when.render();
    });

    it("then there should be two config items", () => {
      then(get.numberOfConfigItems()).shouldEqual(2);
    });
  });

  describe("given a boolean config item and toggle is clicked", () => {
    const configKey = chance.word();

    beforeEach(() => {
      given.initialConfig([
        {
          key: configKey,
          value: "true",
          description: null,
          updatedAt: new Date(),
        },
      ]);
      given.interceptConfigPut();
      when.render();
      when.clickToggle();
    });

    it("then it should send a PUT request with the toggled value", () => {
      then(get.configPutRequestBody()).shouldDeepNestedInclude({
        key: configKey,
        value: "false",
      });
    });
  });
});
