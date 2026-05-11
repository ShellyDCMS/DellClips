import { then } from "@shellygo/cypress-test-utils";
import { RenderFactory } from "../__test-utils__/renderer";
import VideoPlayer from "./video-player";
import { VideoPlayerDriver } from "./video-player.driver";

describe("VideoPlayer", () => {
  const driver = new VideoPlayerDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  beforeEach(() => {
    given.playbackUrl("https://example.com/test-video.m3u8");
    given.isMuted();
    given.onToggleMuteSpy();

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
      then(get.videoPlayer()).shouldBeVisible();
    });

    it("then the video element should be visible", () => {
      then(get.videoElement()).shouldBeVisible();
    });

    it("then the mute button should be visible", () => {
      then(get.muteButton()).shouldBeVisible();
    });
  });

  describe("given the player is not active", () => {
    beforeEach(() => {
      given.isActive(false);
      when.render();
    });

    it("then the video player container should be visible", () => {
      then(get.videoPlayer()).shouldBeVisible();
    });

    it("then the play overlay should not exist", () => {
      then(get.playOverlay()).shouldNotExist();
    });
  });

  describe("given the mute button is clicked", () => {
    beforeEach(() => {
      given.isActive();
      when.render();
      when.clickMute();
    });

    it("then the mute button should still be visible", () => {
      then(get.muteButton()).shouldBeVisible();
    });

    it("then onToggleMute should have been called", () => {
      then(get.onToggleMuteSpy()).shouldHaveBeenCalled();
    });
  });

  describe("given the player is active and muted", () => {
    beforeEach(() => {
      given.isActive();
      given.isMuted(true);
      when.render();
    });

    it("then the unmute hint should not exist", () => {
      then(get.unmuteHint()).shouldNotExist();
    });

    it("then the mute button should be visible", () => {
      then(get.muteButton()).shouldBeVisible();
    });
  });

  describe("given the player is active and unmuted", () => {
    beforeEach(() => {
      given.isActive();
      given.isMuted(false);
      when.render();
    });

    it("then the unmute hint should be visible", () => {
      then(get.unmuteHint()).shouldBeVisible();
    });

    it("then the mute button should still be visible", () => {
      then(get.muteButton()).shouldBeVisible();
    });
  });

  describe("given the player is inactive and unmuted", () => {
    beforeEach(() => {
      given.isActive(false);
      given.isMuted(false);
      when.render();
    });

    it("then the unmute hint should not exist", () => {
      then(get.unmuteHint()).shouldNotExist();
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
        then(get.videoPlayer()).shouldBeVisible();
      });

      it("then the video element should not exist (iframe used instead)", () => {
        then(get.videoElement()).shouldNotExist();
      });

      it("then the mute button should not exist", () => {
        then(get.muteButton()).shouldNotExist();
      });
    });

    describe("when the player is not active", () => {
      beforeEach(() => {
        given.isActive(false);
        when.render();
      });

      it("then the video player container should be visible", () => {
        then(get.videoPlayer()).shouldBeVisible();
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
        then(get.videoPlayer()).shouldBeVisible();
      });

      it("then the video element should be visible", () => {
        then(get.videoElement()).shouldBeVisible();
      });

      it("then the mute button should be visible", () => {
        then(get.muteButton()).shouldBeVisible();
      });
    });

    describe("when the player is not active", () => {
      beforeEach(() => {
        given.isActive(false);
        when.render();
      });

      it("then the video player container should be visible", () => {
        then(get.videoPlayer()).shouldBeVisible();
      });

      it("then the play overlay should not exist", () => {
        then(get.playOverlay()).shouldNotExist();
      });
    });
  });
});
