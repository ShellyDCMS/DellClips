import { BaseTestDriver } from "@/components/__test-utils__/base-test-driver";

interface ConfigItem {
  key: string;
  value: string;
  description: string | null;
  updatedAt: Date;
}

interface AdminSettingsClientDriverProps {
  initialConfig?: ConfigItem[];
}

export class AdminSettingsClientDriver extends BaseTestDriver<AdminSettingsClientDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = { initialConfig: [] };
    });
  };

  given = {
    ...this._given,
    initialConfig: (config: ConfigItem[]) => {
      this.props.initialConfig = config;
    },
    interceptConfigPut: () => {
      this.helper.given.interceptAndMockResponse({
        method: "PUT",
        url: "**/api/admin/config",
        alias: "configPut",
        response: { body: { updated: true } },
      });
    },
  };

  when = {
    ...this._when,
    clickToggle: (index: number = 0) => this.helper.when.click("config-toggle", index),
    typeTextInput: (value: string, index: number = 0) =>
      this.helper.when.type(value, "config-text-input", index),
    waitForConfigPut: () => this.helper.when.waitForResponse("configPut"),
  };

  get = {
    ...this._get,
    container: () => this.helper.get.elementByTestId("admin-settings"),
    title: () => this.helper.get.elementsText("settings-title"),
    configItem: () => this.helper.get.elementByTestId("config-item"),
    numberOfConfigItems: () => this.helper.get.numberOfElements("config-item"),
    configKey: (index: number = 0) =>
      this.helper.get.elementByTestId("config-key", index),
    configKeyText: () => this.helper.get.elementsText("config-key"),
    configDescription: (index: number = 0) =>
      this.helper.get.elementByTestId("config-description", index),
    toggleElement: () => this.helper.get.elementByTestId("config-toggle"),
    toggle: (index: number = 0) =>
      this.helper.get.elementByTestId("config-toggle", index),
    textInput: (index: number = 0) =>
      this.helper.get.elementByTestId("config-text-input", index),
    savingIndicator: () => this.helper.get.elementByTestId("config-saving"),
    configPutRequestBody: () => this.helper.get.requestBody("configPut"),
  };
}
