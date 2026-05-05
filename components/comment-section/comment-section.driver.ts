import { BaseTestDriver } from "../__test-utils__/base-test-driver";

interface CommentSectionDriverProps {
  videoId?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export class CommentSectionDriver extends BaseTestDriver<CommentSectionDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
    videoId: (videoId: string) => {
      this.props.videoId = videoId;
    },
    isOpen: (value: boolean = true) => {
      this.props.isOpen = value;
    },
    onCloseSpy: () => {
      this.props.onClose = this.helper.given.spy("onClose");
    },
    fetchReturnsComments: (comments: any[]) => {
      this.helper.given.stubObjectMethod(window, "fetch").resolves(
        new Response(JSON.stringify({ comments }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    },
    fetchReturnsEmpty: () => {
      this.helper.given.stubObjectMethod(window, "fetch").resolves(
        new Response(JSON.stringify({ comments: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    },
  };

  when = {
    ...this._when,
    clickClose: () => this.helper.when.click("close-comments"),
    typeComment: (text: string) => this.helper.when.type("comment-input", text),
    clickSubmit: () => this.helper.when.click("submit-comment"),
    waitUntil: (checkFunction: () => any) => this.helper.when.waitUntil(checkFunction),
  };

  get = {
    ...this._get,
    commentSection: () => this.helper.get.elementByTestId("comment-section"),
    closeButton: () => this.helper.get.elementByTestId("close-comments"),
    commentInput: () => this.helper.get.elementByTestId("comment-input"),
    submitButton: () => this.helper.get.elementByTestId("submit-comment"),
    commentItems: () => this.helper.get.elementByTestId("comment-item"),
    numberOfComments: () => this.helper.get.numberOfElements("comment-item"),
    onCloseSpy: () => this.helper.get.spy("onClose"),
  };
}
