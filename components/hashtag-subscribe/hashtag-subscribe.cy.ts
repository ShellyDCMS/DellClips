import { then } from "@shellygo/cypress-test-utils";
import Chance from "chance";
import { RenderFactory } from "../__test-utils__/renderer";
import HashtagSubscribe from "./hashtag-subscribe";
import { HashtagSubscribeDriver } from "./hashtag-subscribe.driver";

const chance = new Chance();

describe("HashtagSubscribe", () => {
  const driver = new HashtagSubscribeDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;
  const hashtag = chance.word();

  beforeEach(() => {
    given.hashtag(hashtag);

    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: HashtagSubscribe,
        props: get.props() as any,
      }),
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("Given initialIsSubscribed is false (default)", () => {
    describe("When the component is rendered", () => {
      beforeEach(() => {
        when.render();
      });

      it("Then the button should be visible", () => {
        then(get.subscribeButton()).shouldBeVisible();
      });

      it("Then the button should display the hashtag name", () => {
        then(get.subscribeButtonText()).shouldInclude(`#${hashtag}`);
      });
    });
  });

  describe("Given initialIsSubscribed is true", () => {
    beforeEach(() => {
      given.initialIsSubscribed();
    });

    describe("When the component is rendered", () => {
      beforeEach(() => {
        when.render();
      });

      it("Then the button should be visible", () => {
        then(get.subscribeButton()).shouldBeVisible();
      });

      it("Then the button should display the hashtag name", () => {
        then(get.subscribeButtonText()).shouldInclude(`#${hashtag}`);
      });
    });
  });

  describe("Given the user is not subscribed", () => {
    describe("When the subscribe button is clicked", () => {
      beforeEach(() => {
        given.interceptSubscribe();
        when.render();
        when.clickSubscribe();
        when.waitForSubscribe();
      });

      it("Then the button should remain visible", () => {
        then(get.subscribeButton()).shouldBeVisible();
      });

      it("Then the button should still display the hashtag name", () => {
        then(get.subscribeButtonText()).shouldInclude(`#${hashtag}`);
      });
    });
  });

  describe("Given the user is subscribed", () => {
    beforeEach(() => {
      given.initialIsSubscribed();
    });

    describe("When the unsubscribe button is clicked", () => {
      beforeEach(() => {
        given.interceptUnsubscribe();
        when.render();
        when.clickSubscribe();
        when.waitForUnsubscribe();
      });

      it("Then the button should remain visible", () => {
        then(get.subscribeButton()).shouldBeVisible();
      });

      it("Then the button should still display the hashtag name", () => {
        then(get.subscribeButtonText()).shouldInclude(`#${hashtag}`);
      });
    });
  });

  describe("Given the subscribe API returns an error", () => {
    describe("When the subscribe button is clicked", () => {
      beforeEach(() => {
        given.interceptSubscribeError();
        when.render();
        when.clickSubscribe();
        when.waitForSubscribe();
      });

      it("Then the button should remain visible", () => {
        then(get.subscribeButton()).shouldBeVisible();
      });

      it("Then the button should still display the hashtag name", () => {
        then(get.subscribeButtonText()).shouldInclude(`#${hashtag}`);
      });
    });
  });
});
