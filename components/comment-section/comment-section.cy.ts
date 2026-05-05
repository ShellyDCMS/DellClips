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
      get.commentSection().should("not.exist");
    });
  });

  describe("given the section is open with no comments", () => {
    beforeEach(() => {
      given.isOpen();
      given.fetchReturnsEmpty();
      when.render();
    });

    it("then the comment section should be visible", () => {
      get.commentSection().should("be.visible");
    });

    it("then the close button should be visible", () => {
      get.closeButton().should("be.visible");
    });

    it("then the comment input should be visible", () => {
      get.commentInput().should("be.visible");
    });

    it("then the submit button should be visible", () => {
      get.submitButton().should("be.visible");
    });

    it("then there should be no comment items", () => {
      get.commentItems().should("not.exist");
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
      get.numberOfComments().should("equal", 2);
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
      get.onCloseSpy().should("have.been.called");
    });
  });

  describe("given the submit button is clicked with empty input", () => {
    beforeEach(() => {
      given.isOpen();
      given.fetchReturnsEmpty();
      when.render();
    });

    it("then the submit button should be disabled", () => {
      get.submitButton().should("be.disabled");
    });
  });
});
