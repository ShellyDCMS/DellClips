import { RenderFactory } from "../__test-utils__/renderer";
import VideoCard from "./video-card";
import { VideoCardDriver } from "./video-card.driver";

const mockVideo = {
  id: "video-1",
  title: "Amazing Video",
  description: "A short description of the video",
  playbackUrl: "https://example.com/video.m3u8",
  likeCount: 42,
  commentCount: 7,
  hasLiked: false,
  isFollowingAuthor: false,
  createdAt: new Date().toISOString(),
  author: {
    id: "author-1",
    name: "Jane Doe",
    email: "jane@dell.com",
    avatarUrl: null,
  },
  hashtags: ["delltech", "demo"],
};

describe("VideoCard", () => {
  const driver = new VideoCardDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  beforeEach(() => {
    given.onLikeSpy();
    given.onCommentSpy();
    given.onReportSpy();
    given.onHashtagClickSpy();
    given.onProfileClickSpy();
    given.fetchReturnsLikeSuccess();

    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: VideoCard,
        props: get.props() as any,
      }),
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given a video with title and description", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      when.render();
    });

    it("then the video card should be visible", () => {
      get.videoCard().should("be.visible");
    });

    it("then the author name should display the author", () => {
      get.authorNameText().should("include", "Jane Doe");
    });

    it("then the video title should be displayed", () => {
      get.videoTitleText().should("include", "Amazing Video");
    });

    it("then the video description should be displayed", () => {
      get.videoDescriptionText().should("include", "A short description of the video");
    });

    it("then the like button should be visible", () => {
      get.likeButton().should("be.visible");
    });

    it("then the comment button should be visible", () => {
      get.commentButton().should("be.visible");
    });

    it("then the more button should be visible", () => {
      get.moreButton().should("be.visible");
    });

    it("then the profile button should be visible", () => {
      get.profileButton().should("be.visible");
    });

    it("then the hashtags should be visible", () => {
      get.hashtags().should("be.visible");
    });
  });

  describe("given a video without title", () => {
    beforeEach(() => {
      given.video({ ...mockVideo, title: null });
      given.isActive();
      when.render();
    });

    it("then the video title should not exist", () => {
      get.videoTitle().should("not.exist");
    });
  });

  describe("given a video without description", () => {
    beforeEach(() => {
      given.video({ ...mockVideo, description: null });
      given.isActive();
      when.render();
    });

    it("then the video description should not exist", () => {
      get.videoDescription().should("not.exist");
    });
  });

  describe("given a video with no hashtags", () => {
    beforeEach(() => {
      given.video({ ...mockVideo, hashtags: [] });
      given.isActive();
      when.render();
    });

    it("then the hashtags container should not exist", () => {
      get.hashtags().should("not.exist");
    });
  });

  describe("given an author with an avatar URL", () => {
    beforeEach(() => {
      given.video({
        ...mockVideo,
        author: { ...mockVideo.author, avatarUrl: "https://example.com/avatar.png" },
      });
      given.isActive();
      when.render();
    });

    it("then the author avatar should be visible", () => {
      get.authorAvatar().should("be.visible");
    });
  });

  describe("given an author without an avatar URL", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      when.render();
    });

    it("then the author avatar should not exist", () => {
      get.authorAvatar().should("not.exist");
    });
  });

  describe("given an author without a name", () => {
    beforeEach(() => {
      given.video({
        ...mockVideo,
        author: { ...mockVideo.author, name: null },
      });
      given.isActive();
      when.render();
    });

    it("then the author name should display the email prefix", () => {
      get.authorNameText().should("include", "jane");
    });
  });

  describe("given the comment button is clicked", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      when.render();
      when.clickComment();
    });

    it("then the onComment callback should be called with the video id", () => {
      get.onCommentSpy().should("have.been.calledWith", "video-1");
    });
  });

  describe("given the profile button is clicked", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      when.render();
      when.clickProfile();
    });

    it("then the onProfileClick callback should be called with the author id", () => {
      get.onProfileClickSpy().should("have.been.calledWith", "author-1");
    });
  });

  describe("given the author name is clicked", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      when.render();
      when.clickAuthorName();
    });

    it("then the onProfileClick callback should be called with the author id", () => {
      get.onProfileClickSpy().should("have.been.calledWith", "author-1");
    });
  });

  describe("given a hashtag is clicked", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      when.render();
      when.clickHashtag("delltech");
    });

    it("then the onHashtagClick callback should be called with the hashtag", () => {
      get.onHashtagClickSpy().should("have.been.calledWith", "delltech");
    });
  });

  describe("given the more button is clicked", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      when.render();
      when.clickMore();
    });

    it("then the more menu should be visible", () => {
      get.moreMenu().should("be.visible");
    });

    it("then the report menu item should be visible", () => {
      get.reportMenuItem().should("be.visible");
    });
  });

  describe("given the report menu item is clicked", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      when.render();
      when.clickMore();
      when.clickReport();
    });

    it("then the onReport callback should be called with the video id", () => {
      get.onReportSpy().should("have.been.calledWith", "video-1");
    });

    it("then the more menu should close", () => {
      get.moreMenu().should("not.exist");
    });
  });

  describe("given the like button is clicked on an unliked video", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      when.render();
      when.clickLike();
    });

    it("then the onLike callback should be called with the video id and true", () => {
      get.onLikeSpy().should("have.been.calledWith", "video-1", true);
    });
  });

  describe("given the like button is clicked on an already liked video", () => {
    beforeEach(() => {
      given.video({ ...mockVideo, hasLiked: true });
      given.isActive();
      when.render();
      when.clickLike();
    });

    it("then the onLike callback should be called with the video id and false", () => {
      get.onLikeSpy().should("have.been.calledWith", "video-1", false);
    });
  });

  describe("given the video is not the current user's own video", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      given.currentUserId("different-user");
      when.render();
    });

    it("then the quick follow button should be visible", () => {
      get.quickFollowButton().should("be.visible");
    });

    it("then the quick follow button should show + when not following", () => {
      get.quickFollowButtonText().should("include", "+");
    });
  });

  describe("given the video is the current user's own video", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      given.currentUserId("author-1");
      when.render();
    });

    it("then the quick follow button should not exist", () => {
      get.quickFollowButton().should("not.exist");
    });
  });

  describe("given the user is already following the author", () => {
    beforeEach(() => {
      given.video({ ...mockVideo, isFollowingAuthor: true });
      given.isActive();
      given.currentUserId("different-user");
      when.render();
    });

    it("then the quick follow button should show checkmark", () => {
      get.quickFollowButtonText().should("include", "\u2713");
    });
  });
});
