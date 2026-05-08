import { BaseTestDriver } from "../__test-utils__/base-test-driver";
import { VideoPlayerDriver } from "../video-player/video-player.driver";

interface VideoCardDriverProps {
  video?: {
    id: string;
    title: string | null;
    description: string | null;
    playbackUrl: string;
    likeCount: number;
    commentCount: number;
    hasLiked: boolean;
    isFollowingAuthor: boolean;
    createdAt: string;
    author: {
      id: string;
      name: string | null;
      email: string;
      avatarUrl: string | null;
    };
    hashtags: string[];
  };
  isActive?: boolean;
  currentUserId?: string;
  onLike?: (videoId: string, liked: boolean) => void;
  onComment?: (videoId: string) => void;
  onReport?: (videoId: string) => void;
  onHashtagClick?: (hashtag: string) => void;
  onProfileClick?: (userId: string) => void;
}

export class VideoCardDriver extends BaseTestDriver<VideoCardDriverProps> {
  private videoPlayerDriver = new VideoPlayerDriver();

  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
    video: (video: VideoCardDriverProps["video"]) => {
      this.props.video = video;
    },
    isActive: (value: boolean = true) => {
      this.props.isActive = value;
    },
    onLikeSpy: () => {
      this.props.onLike = this.helper.given.spy("onLike");
    },
    onCommentSpy: () => {
      this.props.onComment = this.helper.given.spy("onComment");
    },
    onReportSpy: () => {
      this.props.onReport = this.helper.given.spy("onReport");
    },
    onHashtagClickSpy: () => {
      this.props.onHashtagClick = this.helper.given.spy("onHashtagClick");
    },
    onProfileClickSpy: () => {
      this.props.onProfileClick = this.helper.given.spy("onProfileClick");
    },
    currentUserId: (userId: string) => {
      this.props.currentUserId = userId;
    },
    fetchReturnsLikeSuccess: () => {
      this.helper.given.stubObjectMethod(window, "fetch").resolves(
        new Response(JSON.stringify({ liked: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );
    },
    fetchReturnsLikeFailure: () => {
      this.helper.given.stubObjectMethod(window, "fetch").resolves(
        new Response(JSON.stringify({ error: "Failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      );
    },
  };

  when = {
    ...this._when,
    clickLike: () => this.helper.when.click("like-button"),
    clickComment: () => this.helper.when.click("comment-button"),
    clickMore: () => this.helper.when.click("more-button"),
    clickReport: () => this.helper.when.click("report-menu-item"),
    clickProfile: () => this.helper.when.click("profile-button"),
    clickAuthorName: () => this.helper.when.click("author-name"),
    clickHashtag: (tag: string) => this.helper.when.click(`hashtag-${tag}`),
    clickQuickFollow: () => this.helper.when.click("quick-follow-button"),
  };

  get = {
    ...this._get,
    videoPlayer: this.videoPlayerDriver.get,
    videoCard: () => this.helper.get.elementByTestId("video-card"),
    profileButton: () => this.helper.get.elementByTestId("profile-button"),
    likeButton: () => this.helper.get.elementByTestId("like-button"),
    commentButton: () => this.helper.get.elementByTestId("comment-button"),
    moreButton: () => this.helper.get.elementByTestId("more-button"),
    moreMenu: () => this.helper.get.elementByTestId("more-menu"),
    reportMenuItem: () => this.helper.get.elementByTestId("report-menu-item"),
    authorName: () => this.helper.get.elementByTestId("author-name"),
    authorNameText: () => this.helper.get.elementsText("author-name"),
    videoTitle: () => this.helper.get.elementByTestId("video-title"),
    videoTitleText: () => this.helper.get.elementsText("video-title"),
    videoDescription: () => this.helper.get.elementByTestId("video-description"),
    videoDescriptionText: () => this.helper.get.elementsText("video-description"),
    hashtags: () => this.helper.get.elementByTestId("hashtags"),
    onLikeSpy: () => this.helper.get.spy("onLike"),
    onCommentSpy: () => this.helper.get.spy("onComment"),
    onReportSpy: () => this.helper.get.spy("onReport"),
    onHashtagClickSpy: () => this.helper.get.spy("onHashtagClick"),
    onProfileClickSpy: () => this.helper.get.spy("onProfileClick"),
    quickFollowButton: () => this.helper.get.elementByTestId("quick-follow-button"),
    quickFollowButtonText: () => this.helper.get.elementsText("quick-follow-button"),
  };
}
