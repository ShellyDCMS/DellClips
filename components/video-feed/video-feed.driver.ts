import { VideoCardDriver } from "../video-card/video-card.driver";
import { BaseTestDriver } from "../__test-utils__/base-test-driver";

interface VideoFeedDriverProps {
  initialVideos?: {
    id: string;
    title: string | null;
    description: string | null;
    playbackUrl: string;
    videoPlaybackId: string;
    likeCount: number;
    commentCount: number;
    hasLiked: boolean;
    createdAt: string;
    author: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl: string | null;
    };
    hashtags: string[];
  }[];
  onOpenComments?: (videoId: string) => void;
  onOpenReport?: (videoId: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  onProfileClick?: (userId: string) => void;
}

export class VideoFeedDriver extends BaseTestDriver<VideoFeedDriverProps> {
  private videoCardDriver = new VideoCardDriver();

  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
    initialVideos: (videos: VideoFeedDriverProps["initialVideos"]) => {
      this.props.initialVideos = videos;
    },
    onOpenCommentsSpy: () => {
      this.props.onOpenComments = this.helper.given.spy("onOpenComments");
    },
    onOpenReportSpy: () => {
      this.props.onOpenReport = this.helper.given.spy("onOpenReport");
    },
    onHashtagClickSpy: () => {
      this.props.onHashtagClick = this.helper.given.spy("onHashtagClick");
    },
    onProfileClickSpy: () => {
      this.props.onProfileClick = this.helper.given.spy("onProfileClick");
    },
  };

  when = {
    ...this._when,
    videoCard: this.videoCardDriver.when,
  };

  get = {
    ...this._get,
    videoFeed: () => this.helper.get.elementByTestId("video-feed"),
    emptyFeed: () => this.helper.get.elementByTestId("empty-feed"),
    numberOfVideoCards: () => this.helper.get.numberOfElements("video-card"),
    videoCard: this.videoCardDriver.get,
    onOpenCommentsSpy: () => this.helper.get.spy("onOpenComments"),
    onOpenReportSpy: () => this.helper.get.spy("onOpenReport"),
    onHashtagClickSpy: () => this.helper.get.spy("onHashtagClick"),
    onProfileClickSpy: () => this.helper.get.spy("onProfileClick"),
  };
}
