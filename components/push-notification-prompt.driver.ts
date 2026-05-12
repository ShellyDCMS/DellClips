import { BaseTestDriver } from "./__test-utils__/base-test-driver";

interface PushNotificationPromptDriverProps {}

export class PushNotificationPromptDriver extends BaseTestDriver<PushNotificationPromptDriverProps> {
  private existingSubscription: unknown = null;
  private subscribeResult: { endpoint: string; toJSON: () => unknown } = {
    endpoint: "https://push.example.com/abc",
    toJSON: () => ({
      endpoint: "https://push.example.com/abc",
      keys: { p256dh: "p256", auth: "auth" },
    }),
  };
  private originalServiceWorker: PropertyDescriptor | undefined;
  private originalPushManager: PropertyDescriptor | undefined;

  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
      this.existingSubscription = null;
      this.originalServiceWorker = Object.getOwnPropertyDescriptor(
        Navigator.prototype,
        "serviceWorker"
      );
      this.originalPushManager = Object.getOwnPropertyDescriptor(window, "PushManager");
    });
    afterEach(() => {
      if (this.originalServiceWorker) {
        Object.defineProperty(
          Navigator.prototype,
          "serviceWorker",
          this.originalServiceWorker
        );
      } else {
        delete (Navigator.prototype as { serviceWorker?: unknown }).serviceWorker;
      }
      if (this.originalPushManager) {
        Object.defineProperty(window, "PushManager", this.originalPushManager);
      } else {
        delete (window as { PushManager?: unknown }).PushManager;
      }
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
      Object.defineProperty(Navigator.prototype, "serviceWorker", {
        configurable: true,
        get: () => ({ ready: Promise.resolve(registration) }),
      });
      Object.defineProperty(window, "PushManager", {
        configurable: true,
        writable: true,
        value: function () {},
      });
    },
    pushUnsupported: () => {
      delete (Navigator.prototype as { serviceWorker?: unknown }).serviceWorker;
      delete (window as { PushManager?: unknown }).PushManager;
    },
    existingSubscription: (sub: unknown) => {
      this.existingSubscription = sub;
    },
    subscribeResult: (sub: { endpoint: string; toJSON: () => unknown }) => {
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
