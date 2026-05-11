import { BaseTestDriver } from "./__test-utils__/base-test-driver";

interface PwaIosPromptDriverProps {}

export class PwaIosPromptDriver extends BaseTestDriver<PwaIosPromptDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
    fakeTimers: () => {
      this.helper.when.clock();
    },
    userAgent: (userAgent: string) => {
      Object.defineProperty(window.navigator, "userAgent", {
        value: userAgent,
        configurable: true,
      });
    },
    storedDismissValue: (value: string | null) => {
      this.helper.given.stubObjectMethod(window.localStorage, "getItem").returns(value);
    },
    stubLocalStorageSetItem: () => {
      this.helper.given.stubObjectMethod(window.localStorage, "setItem");
    },
  };

  when = {
    ...this._when,
    advanceShowDelay: () => this.helper.when.tick(2500),
    clickDismiss: () => this.helper.when.click("pwa-ios-dismiss"),
  };

  get = {
    ...this._get,
    container: () => this.helper.get.elementByTestId("pwa-ios-prompt"),
    headingText: () => this.helper.get.elementsText("pwa-ios-prompt-heading"),
    logo: () => this.helper.get.elementByTestId("pwa-ios-prompt-logo"),
    dismissButton: () => this.helper.get.elementByTestId("pwa-ios-dismiss"),
    setItemStub: () => this.helper.get.stub("setItem"),
  };
}
