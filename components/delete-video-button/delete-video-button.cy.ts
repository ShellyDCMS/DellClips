import { then } from "@shellygo/cypress-test-utils";
import Chance from "chance";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { RenderFactory } from "../__test-utils__/renderer";
import DeleteVideoButton from "./delete-video-button";
import { DeleteVideoButtonDriver } from "./delete-video-button.driver";

const chance = new Chance();

const mockRouter = {
  back: () => {},
  forward: () => {},
  push: () => {},
  replace: () => {},
  refresh: () => {},
  prefetch: () => Promise.resolve(),
};

describe("DeleteVideoButton", () => {
  const driver = new DeleteVideoButtonDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  beforeEach(() => {
    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: DeleteVideoButton,
        props: get.props() as any,
      }),
      wrappers: () => [{ type: AppRouterContext.Provider, props: { value: mockRouter } }],
    });
    given.renderer(renderFactory.createRenderer());
  });

  describe("given the component is rendered with a video", () => {
    const videoId = chance.guid();
    const videoTitle = chance.sentence({ words: 3 });

    beforeEach(() => {
      given.videoId(videoId);
      given.videoTitle(videoTitle);
      when.render();
    });

    it("then the delete button should be visible", () => {
      then(get.deleteButton()).shouldBeVisible();
    });

    it("then the confirmation dialog should not exist", () => {
      then(get.confirmDialog()).shouldNotExist();
    });
  });

  describe("given the delete button is clicked", () => {
    const videoId = chance.guid();
    const videoTitle = chance.sentence({ words: 3 });

    beforeEach(() => {
      given.videoId(videoId);
      given.videoTitle(videoTitle);
      when.render();
      when.clickDelete();
    });

    it("then the confirmation dialog should be visible", () => {
      then(get.confirmDialog()).shouldBeVisible();
    });

    it("then the confirm button should be visible", () => {
      then(get.confirmButton()).shouldBeVisible();
    });

    it("then the cancel button should be visible", () => {
      then(get.cancelButton()).shouldBeVisible();
    });
  });

  describe("given the confirmation dialog is open and cancel is clicked", () => {
    const videoId = chance.guid();

    beforeEach(() => {
      given.videoId(videoId);
      given.videoTitle(null);
      when.render();
      when.clickDelete();
      when.clickCancel();
    });

    it("then the confirmation dialog should not exist", () => {
      then(get.confirmDialog()).shouldNotExist();
    });
  });

  describe("given the user confirms the deletion and the API succeeds", () => {
    const videoId = chance.guid();
    const videoTitle = chance.sentence({ words: 3 });

    beforeEach(() => {
      given.videoId(videoId);
      given.videoTitle(videoTitle);
      given.interceptDeleteSuccess();
      when.render();
      when.clickDelete();
      when.clickConfirm();
    });

    it("then the delete request should target the video API endpoint", () => {
      then(get.deleteRequestUrl()).shouldInclude(`/api/videos/${videoId}`);
    });

    it("then the confirmation dialog should not exist", () => {
      then(get.confirmDialog()).shouldNotExist();
    });
  });

  describe("given the user confirms the deletion and the API fails", () => {
    const videoId = chance.guid();

    beforeEach(() => {
      given.videoId(videoId);
      given.videoTitle(null);
      given.stubAlert();
      given.interceptDeleteFailure();
      when.render();
      when.clickDelete();
      when.clickConfirm();
    });

    it("then the confirmation dialog should remain visible", () => {
      then(get.confirmDialog()).shouldBeVisible();
    });
  });
});
