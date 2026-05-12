import { BaseTestDriver } from "../__test-utils__/base-test-driver";

interface DeleteVideoButtonDriverProps {
  videoId?: string;
  videoTitle?: string | null;
}

export class DeleteVideoButtonDriver extends BaseTestDriver<DeleteVideoButtonDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
    videoId: (id: string) => {
      this.props.videoId = id;
    },
    videoTitle: (title: string | null) => {
      this.props.videoTitle = title;
    },
    interceptDeleteSuccess: () => {
      this.helper.given.interceptAndMockResponse({
        method: "DELETE",
        url: "**/api/videos/**",
        alias: "deleteVideo",
        response: { body: { deleted: true } },
      });
    },
    interceptDeleteFailure: () => {
      this.helper.given.interceptAndMockResponse({
        method: "DELETE",
        url: "**/api/videos/**",
        alias: "deleteVideo",
        response: { statusCode: 500, body: { error: "Failed" } },
      });
    },
    stubAlert: () => {
      this.helper.given.stubObjectMethod(window, "alert");
    },
  };

  when = {
    ...this._when,
    clickDelete: () => this.helper.when.click("delete-video-button"),
    clickCancel: () => this.helper.when.click("delete-video-cancel"),
    clickConfirm: () => this.helper.when.click("delete-video-confirm"),
    waitForDelete: () => this.helper.when.waitForResponse("deleteVideo"),
  };

  get = {
    ...this._get,
    deleteButton: () => this.helper.get.elementByTestId("delete-video-button"),
    confirmDialog: () => this.helper.get.elementByTestId("delete-video-confirm-dialog"),
    cancelButton: () => this.helper.get.elementByTestId("delete-video-cancel"),
    confirmButton: () => this.helper.get.elementByTestId("delete-video-confirm"),
    deleteRequestUrl: () => this.helper.get.requestUrl("deleteVideo"),
  };
}
