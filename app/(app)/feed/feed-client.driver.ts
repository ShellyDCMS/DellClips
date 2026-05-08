import { BaseTestDriver } from "@/components/__test-utils__/base-test-driver";
import { CommentSectionDriver } from "@/components/comment-section/comment-section.driver";
import { ReportDialogDriver } from "@/components/report-dialog/report-dialog.driver";
import { VideoFeedDriver } from "@/components/video-feed/video-feed.driver";

interface FeedClientDriverProps {
  initialVideos?: {
    id: string;
    title: string | null;
    description: string | null;
    playbackUrl: string;
    videoPlaybackId: string;
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
  }[];
  currentUserId?: string;
}

export class FeedClientDriver extends BaseTestDriver<FeedClientDriverProps> {
  private videoFeedDriver = new VideoFeedDriver();
  private commentSectionDriver = new CommentSectionDriver();
  private reportDialogDriver = new ReportDialogDriver();

  mockRouterPush: (() => void) | null = null;

  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = { initialVideos: [], currentUserId: "current-user" };
      this.mockRouterPush = null;
    });
  };

  given = {
    ...this._given,
    initialVideos: (videos: FeedClientDriverProps["initialVideos"]) => {
      this.props.initialVideos = videos;
    },
    currentUserId: (userId: string) => {
      this.props.currentUserId = userId;
    },
    mockRouterPush: (spy: () => void) => {
      this.mockRouterPush = spy;
    },
    interceptReportSubmit: () => {
      this.helper.given.interceptAndMockResponse({
        method: "POST",
        url: "**/api/videos/*/report",
        alias: "reportSubmit",
        response: { body: { success: true } },
      });
    },
    interceptFetchComments: (comments: any[] = []) => {
      this.helper.given.interceptAndMockResponse({
        url: "**/api/videos/*/comments",
        alias: "fetchComments",
        response: { body: { comments } },
      });
    },
  };

  when = {
    ...this._when,
    videoFeed: this.videoFeedDriver.when,
    commentSection: this.commentSectionDriver.when,
    reportDialog: this.reportDialogDriver.when,
    waitForReportSubmit: () => this.helper.when.waitForResponse("reportSubmit"),
    waitForFetchComments: () => this.helper.when.waitForResponse("fetchComments"),
  };

  get = {
    ...this._get,
    videoFeed: this.videoFeedDriver.get,
    commentSection: this.commentSectionDriver.get,
    reportDialog: this.reportDialogDriver.get,
    reportSubmitRequestBody: () => this.helper.get.requestBody("reportSubmit"),
  };
}
