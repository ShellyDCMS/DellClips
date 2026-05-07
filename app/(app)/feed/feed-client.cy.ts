import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { RenderFactory } from "@/components/__test-utils__/renderer";
import Chance from "chance";
import FeedClient from "./feed-client";
import { FeedClientDriver } from "./feed-client.driver";

const chance = new Chance();

const makeVideo = (id: string) => ({
  id,
  title: chance.sentence({ words: 3 }),
  description: chance.sentence({ words: 6 }),
  playbackUrl: chance.url(),
  videoPlaybackId: chance.guid(),
  likeCount: chance.integer({ min: 0, max: 100 }),
  commentCount: chance.integer({ min: 0, max: 50 }),
  hasLiked: false,
  createdAt: new Date().toISOString(),
  author: {
    id: chance.guid(),
    name: chance.name(),
    email: chance.email({ domain: "dell.com" }),
    avatarUrl: null,
  },
  hashtags: [chance.word()],
});

describe("FeedClient", () => {
  const driver = new FeedClientDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  const mockPush = Cypress.sinon.stub();

  const mockRouter = {
    back: () => {},
    forward: () => {},
    push: mockPush,
    replace: () => {},
    refresh: () => {},
    prefetch: () => Promise.resolve(),
  };

  beforeEach(() => {
    mockPush.reset();

    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: FeedClient,
        props: get.props() as any,
      }),
      wrappers: () => [{ type: AppRouterContext.Provider, props: { value: mockRouter } }],
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given an empty video list", () => {
    beforeEach(() => {
      given.initialVideos([]);
      when.render();
    });

    it("then the empty feed message should be visible", () => {
      get.videoFeed.emptyFeed().should("be.visible");
    });

    it("then the comment section should not be visible", () => {
      get.commentSection.commentSection().should("not.exist");
    });

    it("then the report dialog should not be visible", () => {
      get.reportDialog.dialog().should("not.exist");
    });
  });

  describe("given a list of videos", () => {
    const videoOne = makeVideo("vid-1");
    const videoTwo = makeVideo("vid-2");

    beforeEach(() => {
      given.initialVideos([videoOne, videoTwo]);
      when.render();
    });

    it("then the video feed should be visible", () => {
      get.videoFeed.videoFeed().should("be.visible");
    });

    it("then there should be 2 video cards", () => {
      get.videoFeed.numberOfVideoCards().should("equal", 2);
    });
  });

  describe("given the user clicks the comment button on a video", () => {
    const video = makeVideo("vid-comment");

    beforeEach(() => {
      given.initialVideos([video]);
      given.interceptFetchComments([]);
      when.render();
      when.videoFeed.videoCard.clickComment();
    });

    it("then the comment section should be visible", () => {
      get.commentSection.commentSection().should("be.visible");
    });
  });

  describe("given the comment section is open and the user closes it", () => {
    const video = makeVideo("vid-close-comment");

    beforeEach(() => {
      given.initialVideos([video]);
      given.interceptFetchComments([]);
      when.render();
      when.videoFeed.videoCard.clickComment();
      when.commentSection.clickClose();
    });

    it("then the comment section should no longer be visible", () => {
      get.commentSection.commentSection().should("not.exist");
    });
  });

  describe("given the user opens the report dialog via the more menu", () => {
    const video = makeVideo("vid-report");

    beforeEach(() => {
      given.initialVideos([video]);
      when.render();
      when.videoFeed.videoCard.clickMore();
      when.videoFeed.videoCard.clickReport();
    });

    it("then the report dialog should be visible", () => {
      get.reportDialog.dialog().should("be.visible");
    });
  });

  describe("given the report dialog is open and the user cancels", () => {
    const video = makeVideo("vid-cancel-report");

    beforeEach(() => {
      given.initialVideos([video]);
      when.render();
      when.videoFeed.videoCard.clickMore();
      when.videoFeed.videoCard.clickReport();
      when.reportDialog.clickCancel();
    });

    it("then the report dialog should no longer be visible", () => {
      get.reportDialog.dialog().should("not.exist");
    });
  });

  describe("given the user submits a report", () => {
    const video = makeVideo("vid-submit-report");

    beforeEach(() => {
      given.initialVideos([video]);
      given.interceptReportSubmit();
      when.render();
      when.videoFeed.videoCard.clickMore();
      when.videoFeed.videoCard.clickReport();
      when.reportDialog.selectReason("spam");
      when.reportDialog.clickSubmit();
      when.waitForReportSubmit();
    });

    it("then the report dialog should close after submission", () => {
      get.reportDialog.dialog().should("not.exist");
    });
  });
});
