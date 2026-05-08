import { BaseTestDriver } from "@/components/__test-utils__/base-test-driver";

interface UploadClientDriverProps {}

export class UploadClientDriver extends BaseTestDriver<UploadClientDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
    uploadUrlResponse: (assetId: string) => {
      this.helper.given.interceptAndMockResponse({
        method: "POST",
        url: "**/api/video/upload-url",
        alias: "uploadUrl",
        response: { body: { uploadUrl: "https://upload.example.com", assetId } },
      });
    },
    uploadToCloudflareSucceeds: () => {
      this.helper.given.interceptAndMockResponse({
        method: "POST",
        url: "https://upload.example.com",
        alias: "cloudflareUpload",
        response: { body: { success: true } },
      });
    },
    createVideoSucceeds: (videoId: string) => {
      this.helper.given.interceptAndMockResponse({
        method: "POST",
        url: "**/api/videos",
        alias: "createVideo",
        response: { body: { video: { id: videoId } } },
      });
    },
    analyticsSucceeds: () => {
      this.helper.given.interceptAndMockResponse({
        method: "POST",
        url: "**/api/analytics",
        alias: "analytics",
        response: { body: { tracked: true } },
      });
    },
    uploadUrlFails: () => {
      this.helper.given.interceptAndMockResponse({
        method: "POST",
        url: "**/api/video/upload-url",
        alias: "uploadUrl",
        response: { statusCode: 500 },
      });
    },
  };

  when = {
    ...this._when,
    clickDropzone: () => this.helper.when.click("file-dropzone"),
    typeTitle: (value: string) => this.helper.when.type("title-input", value),
    typeDescription: (value: string) => this.helper.when.type("description-input", value),
    typeHashtag: (value: string) => this.helper.when.type("hashtag-input", value),
    clickAddHashtag: () => this.helper.when.click("add-hashtag-button"),
    clickBack: () => this.helper.when.click("back-button"),
    clickUpload: () => this.helper.when.click("upload-button"),
    waitForUploadUrl: () => this.helper.when.waitForResponse("uploadUrl"),
  };

  get = {
    ...this._get,
    container: () => this.helper.get.elementByTestId("upload-container"),
    title: () => this.helper.get.elementByTestId("upload-title"),
    titleText: () => this.helper.get.elementsText("upload-title"),
    fileDropzone: () => this.helper.get.elementByTestId("file-dropzone"),
    fileInput: () => this.helper.get.elementByTestId("file-input"),
    titleInput: () => this.helper.get.elementByTestId("title-input"),
    descriptionInput: () => this.helper.get.elementByTestId("description-input"),
    hashtagInput: () => this.helper.get.elementByTestId("hashtag-input"),
    addHashtagButton: () => this.helper.get.elementByTestId("add-hashtag-button"),
    backButton: () => this.helper.get.elementByTestId("back-button"),
    uploadButton: () => this.helper.get.elementByTestId("upload-button"),
    uploadError: () => this.helper.get.elementByTestId("upload-error"),
    uploadErrorText: () => this.helper.get.elementsText("upload-error"),
    detailsError: () => this.helper.get.elementByTestId("details-error"),
    detailsErrorText: () => this.helper.get.elementsText("details-error"),
    uploadingStep: () => this.helper.get.elementByTestId("uploading-step"),
    doneStep: () => this.helper.get.elementByTestId("done-step"),
    doneTitle: () => this.helper.get.elementByTestId("done-title"),
    doneTitleText: () => this.helper.get.elementsText("done-title"),
    createVideoRequestBody: () => this.helper.get.requestBody("createVideo"),
  };
}
