import { BaseTestDriver } from "../__test-utils__/base-test-driver";

interface VideoPlayerDriverProps {
  playbackUrl?: string;
  isActive?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
}

export class VideoPlayerDriver extends BaseTestDriver<VideoPlayerDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
    playbackUrl: (url: string) => {
      this.props.playbackUrl = url;
    },
    isActive: (value: boolean = true) => {
      this.props.isActive = value;
    },
    isMuted: (value: boolean = true) => {
      this.props.isMuted = value;
    },
    onToggleMuteSpy: () => {
      this.props.onToggleMute = this.helper.given.spy("onToggleMute");
    },
    onPlaySpy: () => {
      this.props.onPlay = this.helper.given.spy("onPlay");
    },
    onPauseSpy: () => {
      this.props.onPause = this.helper.given.spy("onPause");
    },
  };

  when = {
    ...this._when,
    clickPlayer: () => this.helper.when.click("video-player"),
    clickMute: () => this.helper.when.click("mute-button"),
  };

  get = {
    ...this._get,
    videoPlayer: () => this.helper.get.elementByTestId("video-player"),
    videoElement: () => this.helper.get.elementByTestId("video-element"),
    playOverlay: () => this.helper.get.elementByTestId("play-overlay"),
    muteButton: () => this.helper.get.elementByTestId("mute-button"),
    unmuteHint: () => this.helper.get.elementByTestId("unmute-hint"),
    onToggleMuteSpy: () => this.helper.get.spy("onToggleMute"),
    onPlaySpy: () => this.helper.get.spy("onPlay"),
    onPauseSpy: () => this.helper.get.spy("onPause"),
  };
}
