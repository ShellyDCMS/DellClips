import { then } from "@shellygo/cypress-test-utils";
import { RenderFactory } from "../__test-utils__/renderer";
import CommentSection from "./comment-section";
import { CommentSectionDriver } from "./comment-section.driver";

const mockComments = [
  {
    id: "comment-1",
    text: "Great video!",
    createdAt: new Date().toISOString(),
    author: { id: "user-1", name: "Alice", avatarUrl: null },
  },
  {
    id: "comment-2",
    text: "Nice work on this",
    createdAt: new Date().toISOString(),
    author: { id: "user-2", name: "Bob", avatarUrl: null },
  },
];

describe("CommentSection", () => {
  const driver = new CommentSectionDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  beforeEach(() => {
    given.videoId("video-123");
    given.onCloseSpy();

    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: CommentSection,
        props: get.props() as any,
      }),
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given the section is closed", () => {
    beforeEach(() => {
      given.isOpen(false);
      given.fetchReturnsEmpty();
      when.render();
    });

    it("then the comment section should not exist in the DOM", () => {
      then(get.commentSection()).shouldNotExist();
    });
  });

  describe("given the section is open with no comments", () => {
    beforeEach(() => {
      given.isOpen();
      given.fetchReturnsEmpty();
      when.render();
    });

    it("then the comment section should be visible", () => {
      then(get.commentSection()).shouldBeVisible();
    });

    it("then the close button should be visible", () => {
      then(get.closeButton()).shouldBeVisible();
    });

    it("then the comment input should be visible", () => {
      then(get.commentInput()).shouldBeVisible();
    });

    it("then the submit button should be visible", () => {
      then(get.submitButton()).shouldBeVisible();
    });

    it("then there should be no comment items", () => {
      then(get.commentItems()).shouldNotExist();
    });
  });

  describe("given the section is open with comments", () => {
    beforeEach(() => {
      given.isOpen();
      given.fetchReturnsComments(mockComments);
      when.render();
      when.waitUntil(() => get.commentItems());
    });

    it("then there should be 2 comment items", () => {
      then(get.numberOfComments()).shouldEqual(2);
    });
  });

  describe("given the close button is clicked", () => {
    beforeEach(() => {
      given.isOpen();
      given.fetchReturnsEmpty();
      when.render();
      when.clickClose();
    });

    it("then the onClose callback should be called", () => {
      then(get.onCloseSpy()).shouldHaveBeenCalled();
    });
  });

  describe("given the submit button is clicked with empty input", () => {
    beforeEach(() => {
      given.isOpen();
      given.fetchReturnsEmpty();
      when.render();
    });

    it("then the submit button should be disabled", () => {
      then(get.submitButton()).shouldBeDisabled();
    });
  });
});
