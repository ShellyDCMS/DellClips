import { then } from "@shellygo/cypress-test-utils";
import PushNotificationPrompt from "./push-notification-prompt";
import { PushNotificationPromptDriver } from "./push-notification-prompt.driver";
import { RenderFactory } from "./__test-utils__/renderer";

describe("PushNotificationPrompt", () => {
  const driver = new PushNotificationPromptDriver();
  driver.beforeAndAfter();
  const { given, when, get } = driver;

  beforeEach(() => {
    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: PushNotificationPrompt,
        props: get.props() as any,
      }),
    });
    given.renderer(renderFactory.createRenderer());
  });

  describe("given push is supported and not previously dismissed", () => {
    beforeEach(() => {
      given.fakeTimers();
      given.pushSupported();
      given.existingSubscription(null);
      given.storedDismissValue(null);
      when.render();
      when.advanceShowDelay();
    });

    it("then the prompt container should be visible", () => {
      then(get.container()).shouldBeVisible();
    });

    it("then the heading should display the in-app copy", () => {
      then(get.headingText()).shouldEqual("Stay in the loop");
    });

    it("then the enable button should be visible", () => {
      then(get.enableButton()).shouldBeVisible();
    });

    it("then the dismiss button should be visible", () => {
      then(get.dismissButton()).shouldBeVisible();
    });
  });

  describe("given push is not supported by the browser", () => {
    beforeEach(() => {
      given.fakeTimers();
      given.pushUnsupported();
      given.storedDismissValue(null);
      when.render();
      when.advanceShowDelay();
    });

    it("then the prompt container should not exist", () => {
      then(get.container()).shouldNotExist();
    });
  });

  describe("given the prompt was dismissed within the past 30 days", () => {
    beforeEach(() => {
      given.fakeTimers();
      given.pushSupported();
      given.existingSubscription(null);
      given.storedDismissValue(new Date().toISOString());
      when.render();
      when.advanceShowDelay();
    });

    it("then the prompt container should not exist", () => {
      then(get.container()).shouldNotExist();
    });
  });

  describe("given the user is already subscribed", () => {
    beforeEach(() => {
      given.fakeTimers();
      given.pushSupported();
      given.existingSubscription({ endpoint: "https://push.example.com/x" });
      given.storedDismissValue(null);
      when.render();
      when.advanceShowDelay();
    });

    it("then the prompt container should not exist", () => {
      then(get.container()).shouldNotExist();
    });
  });

  describe("given the user clicks dismiss on a visible prompt", () => {
    beforeEach(() => {
      given.fakeTimers();
      given.pushSupported();
      given.existingSubscription(null);
      given.storedDismissValue(null);
      given.stubLocalStorageSetItem();
      when.render();
      when.advanceShowDelay();
      when.clickDismiss();
    });

    it("then the prompt container should not exist", () => {
      then(get.container()).shouldNotExist();
    });

    it("then localStorage.setItem should be called with the dismissed key", () => {
      then(get.setItemStub()).shouldHaveBeenCalledWithMatch("push-prompt-dismissed");
    });
  });

  describe("given the user clicks enable on a visible prompt", () => {
    const endpoint = "https://push.example.com/abc";
    const p256dh = "p256dh-key";
    const authKey = "auth-key";

    beforeEach(() => {
      given.fakeTimers();
      given.pushSupported();
      given.existingSubscription(null);
      given.subscribeResult({
        endpoint,
        toJSON: () => ({ endpoint, keys: { p256dh, auth: authKey } }),
      });
      given.storedDismissValue(null);
      given.interceptSubscribeApi();
      when.render();
      when.advanceShowDelay();
      when.clickEnable();
      when.waitForSubscribeRequest();
    });

    it("then it should POST the subscription endpoint to the API", () => {
      then(get.subscribeRequestBody()).shouldDeepNestedInclude({ endpoint });
    });

    it("then it should POST the subscription keys to the API", () => {
      then(get.subscribeRequestBody()).shouldDeepNestedInclude({
        keys: { p256dh, auth: authKey },
      });
    });

    it("then the prompt container should not exist", () => {
      then(get.container()).shouldNotExist();
    });
  });
});
