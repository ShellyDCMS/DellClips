import { BaseTestDriver } from "./__test-utils__/base-test-driver";

interface PushNotificationPromptDriverProps {}

export class PushNotificationPromptDriver extends BaseTestDriver<PushNotificationPromptDriverProps> {
  private existingSubscription: any = null;
  private subscribeResult: any = {
    endpoint: "https://push.example.com/abc",
    toJSON: () => ({
      endpoint: "https://push.example.com/abc",
      keys: { p256dh: "p256", auth: "auth" },
    }),
  };

  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
      this.existingSubscription = null;
    });
  };

  given = {
    ...this._given,
    fakeTimers: () => {
      this.helper.when.clock();
    },
    pushSupported: () => {
      const registration = {
        pushManager: {
          getSubscription: () => Promise.resolve(this.existingSubscription),
          subscribe: () => Promise.resolve(this.subscribeResult),
        },
      };
      Object.defineProperty(window.navigator, "serviceWorker", {
        value: { ready: Promise.resolve(registration) },
        configurable: true,
      });
      (window as any).PushManager = function () {};
    },
    pushUnsupported: () => {
      Object.defineProperty(window.navigator, "serviceWorker", {
        value: undefined,
        configurable: true,
      });
      delete (window as any).PushManager;
    },
    existingSubscription: (sub: any) => {
      this.existingSubscription = sub;
    },
    subscribeResult: (sub: any) => {
      this.subscribeResult = sub;
    },
    storedDismissValue: (value: string | null) => {
      this.helper.given.stubObjectMethod(window.localStorage, "getItem").returns(value);
    },
    stubLocalStorageSetItem: () => {
      this.helper.given.stubObjectMethod(window.localStorage, "setItem");
    },
    interceptSubscribeApi: () => {
      this.helper.given.interceptAndMockResponse({
        method: "POST",
        url: "**/api/push/subscribe",
        alias: "subscribe",
        response: { subscribed: true },
      });
    },
  };

  when = {
    ...this._when,
    advanceShowDelay: () => this.helper.when.tick(5500),
    clickDismiss: () => this.helper.when.click("push-prompt-dismiss"),
    clickEnable: () => this.helper.when.click("push-prompt-enable"),
    waitForSubscribeRequest: () => this.helper.when.waitForResponse("subscribe"),
  };

  get = {
    ...this._get,
    container: () => this.helper.get.elementByTestId("push-prompt"),
    headingText: () => this.helper.get.elementsText("push-prompt-heading"),
    dismissButton: () => this.helper.get.elementByTestId("push-prompt-dismiss"),
    enableButton: () => this.helper.get.elementByTestId("push-prompt-enable"),
    setItemStub: () => this.helper.get.stub("setItem"),
    subscribeRequestBody: () => this.helper.get.requestBody("subscribe"),
  };
}
