import { then } from "@shellygo/cypress-test-utils";
import { RenderFactory } from "../__test-utils__/renderer";
import { SharedVideoContext } from "../shared-video-player/shared-video-context";
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

  const toggleMuteSpy = Cypress.sinon.stub();
  const togglePlaySpy = Cypress.sinon.stub();

  beforeEach(() => {
    toggleMuteSpy.reset();
    togglePlaySpy.reset();

    given.onLikeSpy();
    given.onCommentSpy();
    given.onReportSpy();
    given.onHashtagClickSpy();
    given.onProfileClickSpy();
    given.onToggleMuteSpy();
    given.fetchReturnsLikeSuccess();

    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: VideoCard,
        props: get.props() as any,
      }),
      wrappers: () => [
        {
          type: SharedVideoContext.Provider,
          props: {
            value: {
              isPlaying: false,
              isMuted: true,
              togglePlay: togglePlaySpy,
              toggleMute: () => {
                toggleMuteSpy();
                (driver.toggleMuteSpy as () => void)?.();
              },
            },
          },
        },
      ],
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
      then(get.videoCard()).shouldBeVisible();
    });

    it("then the author name should display the author", () => {
      then(get.authorNameText()).shouldInclude("Jane Doe");
    });

    it("then the video title should be displayed", () => {
      then(get.videoTitleText()).shouldInclude("Amazing Video");
    });

    it("then the video description should be displayed", () => {
      then(get.videoDescriptionText()).shouldInclude("A short description of the video");
    });

    it("then the like button should be visible", () => {
      then(get.likeButton()).shouldBeVisible();
    });

    it("then the comment button should be visible", () => {
      then(get.commentButton()).shouldBeVisible();
    });

    it("then the more button should be visible", () => {
      then(get.moreButton()).shouldBeVisible();
    });

    it("then the profile button should be visible", () => {
      then(get.profileButton()).shouldBeVisible();
    });

    it("then the hashtags should be visible", () => {
      then(get.hashtags()).shouldBeVisible();
    });
  });

  describe("given a video without title", () => {
    beforeEach(() => {
      given.video({ ...mockVideo, title: null });
      given.isActive();
      when.render();
    });

    it("then the video title should not exist", () => {
      then(get.videoTitle()).shouldNotExist();
    });
  });

  describe("given a video without description", () => {
    beforeEach(() => {
      given.video({ ...mockVideo, description: null });
      given.isActive();
      when.render();
    });

    it("then the video description should not exist", () => {
      then(get.videoDescription()).shouldNotExist();
    });
  });

  describe("given a video with no hashtags", () => {
    beforeEach(() => {
      given.video({ ...mockVideo, hashtags: [] });
      given.isActive();
      when.render();
    });

    it("then the hashtags container should not exist", () => {
      then(get.hashtags()).shouldNotExist();
    });
  });

  describe("given an author with an avatar URL", () => {
    beforeEach(() => {
      given.video({
        ...mockVideo,
        author: { ...mockVideo.author, avatarUrl: "/avatar.png" },
      });
      given.isActive();
      when.render();
    });

    it("then the author avatar should be visible", () => {
      then(get.authorAvatar()).shouldBeVisible();
    });
  });

  describe("given an author without an avatar URL", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      when.render();
    });

    it("then the author avatar should not exist", () => {
      then(get.authorAvatar()).shouldNotExist();
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
      then(get.authorNameText()).shouldInclude("jane");
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
      then(get.onCommentSpy()).shouldHaveBeenCalledWith("video-1");
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
      then(get.onProfileClickSpy()).shouldHaveBeenCalledWith("author-1");
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
      then(get.onProfileClickSpy()).shouldHaveBeenCalledWith("author-1");
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
      then(get.onHashtagClickSpy()).shouldHaveBeenCalledWith("delltech");
    });
  });

  describe("given the more button is clicked on someone else's video", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      given.currentUserId("different-user");
      when.render();
      when.clickMore();
    });

    it("then the more menu should be visible", () => {
      then(get.moreMenu()).shouldBeVisible();
    });

    it("then the report menu item should be visible", () => {
      then(get.reportMenuItem()).shouldBeVisible();
    });

    it("then the delete menu item should not exist", () => {
      then(get.deleteMenuItem()).shouldNotExist();
    });
  });

  describe("given the more button is clicked on the user's own video", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      given.currentUserId("author-1");
      when.render();
      when.clickMore();
    });

    it("then the delete menu item should be visible", () => {
      then(get.deleteMenuItem()).shouldBeVisible();
    });

    it("then the report menu item should not exist", () => {
      then(get.reportMenuItem()).shouldNotExist();
    });
  });

  describe("given the delete menu item is clicked on the user's own video", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      given.currentUserId("author-1");
      when.render();
      when.clickMore();
      when.clickDeleteMenuItem();
    });

    it("then the delete confirm dialog should be visible", () => {
      then(get.deleteConfirmDialog()).shouldBeVisible();
    });

    it("then the more menu should be closed", () => {
      then(get.moreMenu()).shouldNotExist();
    });

    it("then the delete confirm button should be visible", () => {
      then(get.deleteConfirmButton()).shouldBeVisible();
    });

    it("then the delete cancel button should be visible", () => {
      then(get.deleteCancelButton()).shouldBeVisible();
    });
  });

  describe("given the delete confirm dialog is open and cancel is clicked", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      given.currentUserId("author-1");
      when.render();
      when.clickMore();
      when.clickDeleteMenuItem();
      when.clickDeleteCancel();
    });

    it("then the delete confirm dialog should not exist", () => {
      then(get.deleteConfirmDialog()).shouldNotExist();
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
      then(get.onReportSpy()).shouldHaveBeenCalledWith("video-1");
    });

    it("then the more menu should close", () => {
      then(get.moreMenu()).shouldNotExist();
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
      then(get.onLikeSpy()).shouldHaveBeenCalledWith("video-1", true);
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
      then(get.onLikeSpy()).shouldHaveBeenCalledWith("video-1", false);
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
      then(get.quickFollowButton()).shouldBeVisible();
    });

    it("then the quick follow button should show + when not following", () => {
      then(get.quickFollowButtonText()).shouldInclude("+");
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
      then(get.quickFollowButton()).shouldNotExist();
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
      then(get.quickFollowButtonText()).shouldInclude("\u2713");
    });
  });

  describe("given the like button is clicked on the user's own video with likers", () => {
    const likers = [
      { id: "liker-1", name: "Alice Smith", email: "alice@dell.com", avatarUrl: null },
      { id: "liker-2", name: "Bob Jones", email: "bob@dell.com", avatarUrl: null },
    ];

    beforeEach(() => {
      given.video({ ...mockVideo, likeCount: 2 });
      given.isActive();
      given.currentUserId("author-1");
      given.fetchReturnsLikers(likers);
      when.render();
      when.clickLike();
    });

    it("then the likers dialog should be visible", () => {
      when.waitUntil(() => get.likersDialog());
      then(get.likersDialog()).shouldBeVisible();
    });

    it("then the likers close button should be visible", () => {
      when.waitUntil(() => get.likersCloseButton());
      then(get.likersCloseButton()).shouldBeVisible();
    });

    it("then the onLike callback should not be called", () => {
      then(get.onLikeSpy()).shouldNotHaveBeenCalled();
    });
  });

  describe("given the likers dialog is open and close is clicked", () => {
    const likers = [
      { id: "liker-1", name: "Alice Smith", email: "alice@dell.com", avatarUrl: null },
    ];

    beforeEach(() => {
      given.video({ ...mockVideo, likeCount: 1 });
      given.isActive();
      given.currentUserId("author-1");
      given.fetchReturnsLikers(likers);
      when.render();
      when.clickLike();
      when.waitUntil(() => get.likersCloseButton());
      when.clickLikersClose();
    });

    it("then the likers dialog should not exist", () => {
      then(get.likersDialog()).shouldNotExist();
    });
  });

  describe("given the like button is clicked on someone else's video (not own)", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      given.currentUserId("different-user");
      when.render();
      when.clickLike();
    });

    it("then the likers dialog should not exist", () => {
      then(get.likersDialog()).shouldNotExist();
    });

    it("then the onLike callback should be called", () => {
      then(get.onLikeSpy()).shouldHaveBeenCalledWith("video-1", true);
    });
  });

  describe("given an active video card and the mute button is clicked", () => {
    beforeEach(() => {
      given.video(mockVideo);
      given.isActive();
      when.render();
      when.clickMute();
    });

    it("then onToggleMute should have been called", () => {
      then(get.onToggleMuteSpy()).shouldHaveBeenCalled();
    });
  });
});
