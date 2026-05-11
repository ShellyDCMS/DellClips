import { then } from "@shellygo/cypress-test-utils";
import PWAiOSPrompt from "./pwa-ios-prompt";
import { PwaIosPromptDriver } from "./pwa-ios-prompt.driver";
import { RenderFactory } from "./__test-utils__/renderer";

const IOS_USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)";
const NON_IOS_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

describe("PWAiOSPrompt", () => {
  const driver = new PwaIosPromptDriver();
  driver.beforeAndAfter();
  const { given, when, get } = driver;

  beforeEach(() => {
    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: PWAiOSPrompt,
        props: get.props() as any,
      }),
    });
    given.renderer(renderFactory.createRenderer());
  });

  describe("given an iOS device that has not been dismissed", () => {
    beforeEach(() => {
      given.userAgent(IOS_USER_AGENT);
      given.storedDismissValue(null);
      when.render();
    });

    it("then the prompt container should be visible", () => {
      then(get.container()).shouldBeVisible();
    });

    it("then the heading should display the install copy", () => {
      then(get.headingText()).shouldEqual("Install DellClips");
    });

    it("then the logo should be visible", () => {
      then(get.logo()).shouldBeVisible();
    });

    it("then the logo image should point to the icon-192 source", () => {
      then(get.logo()).shouldHaveAttribute("src", "/icons/icon-192.png");
    });

    it("then the logo image should have alt text", () => {
      then(get.logo()).shouldHaveAttribute("alt", "DellClips");
    });

    it("then the dismiss button should be visible", () => {
      then(get.dismissButton()).shouldBeVisible();
    });
  });

  describe("given a non-iOS device", () => {
    beforeEach(() => {
      given.fakeTimers();
      given.userAgent(NON_IOS_USER_AGENT);
      given.storedDismissValue(null);
      given.fakeTimers();
      when.render();
      when.advanceShowDelay();
      when.advanceShowDelay();
    });

    it("then the prompt container should not exist", () => {
      then(get.container()).shouldNotExist();
    });
  });

  describe("given the prompt was dismissed within the past 14 days", () => {
    beforeEach(() => {
      given.fakeTimers();
      given.userAgent(IOS_USER_AGENT);
      given.storedDismissValue(new Date().toISOString());
      given.fakeTimers();
      when.render();
      when.advanceShowDelay();
      when.advanceShowDelay();
    });

    it("then the prompt container should not exist", () => {
      then(get.container()).shouldNotExist();
    });
  });

  describe("given the user clicks dismiss on a visible prompt", () => {
    beforeEach(() => {
      given.userAgent(IOS_USER_AGENT);
      given.storedDismissValue(null);
      given.stubLocalStorageSetItem();
      when.render();
      when.clickDismiss();
    });

    it("then the prompt container should not exist", () => {
      then(get.container()).shouldNotExist();
    });

    it("then localStorage.setItem should be called with the dismissed key", () => {
      then(get.setItemStub()).shouldHaveBeenCalledWithMatch("pwa-ios-dismissed");
    });
  });
});
