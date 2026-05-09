import { then } from "@shellygo/cypress-test-utils";
import Chance from "chance";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { RenderFactory } from "@/components/__test-utils__/renderer";
import UploadClient from "./upload-client";
import { UploadClientDriver } from "./upload-client.driver";

const chance = new Chance();

describe("UploadClient", () => {
  const driver = new UploadClientDriver();
  const { given, when, get } = driver;
  driver.beforeAndAfter();

  const mockPush = Cypress.sinon.stub();
  const mockRefresh = Cypress.sinon.stub();

  const mockRouter = {
    back: () => {},
    forward: () => {},
    push: mockPush,
    replace: () => {},
    refresh: mockRefresh,
    prefetch: () => Promise.resolve(),
  };

  beforeEach(() => {
    mockPush.reset();
    mockRefresh.reset();

    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: UploadClient,
        props: get.props() as any,
      }),
      wrappers: () => [{ type: AppRouterContext.Provider, props: { value: mockRouter } }],
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given the component is rendered in select step", () => {
    beforeEach(() => {
      when.render();
    });

    it("then the upload container should be visible", () => {
      then(get.container()).shouldBeVisible();
    });

    it("then the upload title should display Upload Video", () => {
      then(get.titleText()).shouldInclude("Upload Video");
    });

    it("then the file dropzone should be visible", () => {
      then(get.fileDropzone()).shouldBeVisible();
    });

    it("then the title input should not exist (not in details step)", () => {
      then(get.titleInput()).shouldNotExist();
    });

    it("then the upload button should not exist (not in details step)", () => {
      then(get.uploadButton()).shouldNotExist();
    });
  });

  describe("given a valid video file is selected", () => {
    beforeEach(() => {
      when.render();
      get.fileInput().then(($input) => {
        const file = new File(["video-content"], "test.mp4", {
          type: "video/mp4",
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        ($input[0] as HTMLInputElement).files = dataTransfer.files;
        $input[0].dispatchEvent(new Event("change", { bubbles: true }));
      });
    });

    it("then the title input should be visible (details step)", () => {
      then(get.titleInput()).shouldBeVisible();
    });

    it("then the description input should be visible", () => {
      then(get.descriptionInput()).shouldBeVisible();
    });

    it("then the hashtag input should be visible", () => {
      then(get.hashtagInput()).shouldBeVisible();
    });

    it("then the add hashtag button should be visible", () => {
      then(get.addHashtagButton()).shouldBeVisible();
    });

    it("then the back button should be visible", () => {
      then(get.backButton()).shouldBeVisible();
    });

    it("then the upload button should be visible", () => {
      then(get.uploadButton()).shouldBeVisible();
    });
  });

  describe("given the user clicks back from the details step", () => {
    beforeEach(() => {
      when.render();
      get.fileInput().then(($input) => {
        const file = new File(["video-content"], "test.mp4", {
          type: "video/mp4",
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        ($input[0] as HTMLInputElement).files = dataTransfer.files;
        $input[0].dispatchEvent(new Event("change", { bubbles: true }));
      });
      when.clickBack();
    });

    it("then the file dropzone should be visible again (select step)", () => {
      then(get.fileDropzone()).shouldBeVisible();
    });

    it("then the title input should not exist", () => {
      then(get.titleInput()).shouldNotExist();
    });
  });

  describe("given a non-video file is selected", () => {
    beforeEach(() => {
      when.render();
      get.fileInput().then(($input) => {
        const file = new File(["text-content"], "readme.txt", {
          type: "text/plain",
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        ($input[0] as HTMLInputElement).files = dataTransfer.files;
        $input[0].dispatchEvent(new Event("change", { bubbles: true }));
      });
    });

    it("then the upload error should be visible", () => {
      then(get.uploadError()).shouldBeVisible();
    });

    it("then the error message should indicate video file required", () => {
      then(get.uploadErrorText()).shouldInclude("Please select a video file");
    });
  });

  describe("given a file exceeding 200MB is selected", () => {
    beforeEach(() => {
      when.render();
      get.fileInput().then(($input) => {
        const largeContent = new ArrayBuffer(201 * 1024 * 1024);
        const file = new File([largeContent], "large.mp4", {
          type: "video/mp4",
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        ($input[0] as HTMLInputElement).files = dataTransfer.files;
        $input[0].dispatchEvent(new Event("change", { bubbles: true }));
      });
    });

    it("then the upload error should be visible", () => {
      then(get.uploadError()).shouldBeVisible();
    });

    it("then the error message should indicate file size limit", () => {
      then(get.uploadErrorText()).shouldInclude("Video must be under 200MB");
    });
  });

  describe("given the upload succeeds", () => {
    const assetId = chance.guid();
    const videoId = chance.guid();

    beforeEach(() => {
      when.render();

      given.uploadUrlResponse(assetId);
      given.uploadToCloudflareSucceeds();
      given.createVideoSucceeds(videoId);
      given.analyticsSucceeds();

      get.fileInput().then(($input) => {
        const file = new File(["video-content"], "test.mp4", {
          type: "video/mp4",
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        ($input[0] as HTMLInputElement).files = dataTransfer.files;
        $input[0].dispatchEvent(new Event("change", { bubbles: true }));
      });

      when.clickUpload();
      when.waitForUploadUrl();
    });

    it("then the done step should be visible", () => {
      then(get.doneStep()).shouldBeVisible();
    });

    it("then the done title should display Upload Complete", () => {
      then(get.doneTitleText()).shouldInclude("Upload Complete!");
    });
  });

  describe("given the upload URL request fails", () => {
    beforeEach(() => {
      when.render();

      given.uploadUrlFails();

      get.fileInput().then(($input) => {
        const file = new File(["video-content"], "test.mp4", {
          type: "video/mp4",
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        ($input[0] as HTMLInputElement).files = dataTransfer.files;
        $input[0].dispatchEvent(new Event("change", { bubbles: true }));
      });

      when.clickUpload();
      when.waitForUploadUrl();
    });

    it("then the details error should be visible", () => {
      then(get.detailsError()).shouldBeVisible();
    });

    it("then the error message should indicate failure", () => {
      then(get.detailsErrorText()).shouldInclude("Failed to get upload URL");
    });
  });
});
