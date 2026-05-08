import { RenderFactory } from "../__test-utils__/renderer";
import VideoPlayer from "./video-player";
import { VideoPlayerDriver } from "./video-player.driver";

describe("VideoPlayer", () => {
  const driver = new VideoPlayerDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  beforeEach(() => {
    given.playbackUrl("https://example.com/test-video.m3u8");

    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: VideoPlayer,
        props: get.props() as any,
      }),
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given the player is active", () => {
    beforeEach(() => {
      given.isActive();
      when.render();
    });

    it("then the video player container should be visible", () => {
      get.videoPlayer().should("be.visible");
    });

    it("then the video element should be visible", () => {
      get.videoElement().should("be.visible");
    });

    it("then the mute button should be visible", () => {
      get.muteButton().should("be.visible");
    });
  });

  describe("given the player is not active", () => {
    beforeEach(() => {
      given.isActive(false);
      when.render();
    });

    it("then the video player container should be visible", () => {
      get.videoPlayer().should("be.visible");
    });

    it("then the play overlay should not exist", () => {
      get.playOverlay().should("not.exist");
    });
  });

  describe("given the mute button is clicked", () => {
    beforeEach(() => {
      given.isActive();
      when.render();
      when.clickMute();
    });

    it("then the mute button should still be visible", () => {
      get.muteButton().should("be.visible");
    });
  });

  describe("given a Google Drive playback URL", () => {
    beforeEach(() => {
      given.playbackUrl("https://drive.google.com/file/d/abc123/preview");
    });

    describe("when the player is active", () => {
      beforeEach(() => {
        given.isActive();
        when.render();
      });

      it("then the video player container should be visible", () => {
        get.videoPlayer().should("be.visible");
      });

      it("then the video element should not exist (iframe used instead)", () => {
        get.videoElement().should("not.exist");
      });

      it("then the mute button should not exist", () => {
        get.muteButton().should("not.exist");
      });
    });

    describe("when the player is not active", () => {
      beforeEach(() => {
        given.isActive(false);
        when.render();
      });

      it("then the video player container should be visible", () => {
        get.videoPlayer().should("be.visible");
      });
    });
  });

  describe("given a direct MP4 playback URL", () => {
    beforeEach(() => {
      given.playbackUrl("https://example.com/video.mp4");
    });

    describe("when the player is active", () => {
      beforeEach(() => {
        given.isActive();
        when.render();
      });

      it("then the video player container should be visible", () => {
        get.videoPlayer().should("be.visible");
      });

      it("then the video element should be visible", () => {
        get.videoElement().should("be.visible");
      });

      it("then the mute button should be visible", () => {
        get.muteButton().should("be.visible");
      });
    });

    describe("when the player is not active", () => {
      beforeEach(() => {
        given.isActive(false);
        when.render();
      });

      it("then the video player container should be visible", () => {
        get.videoPlayer().should("be.visible");
      });

      it("then the play overlay should not exist", () => {
        get.playOverlay().should("not.exist");
      });
    });
  });
});
