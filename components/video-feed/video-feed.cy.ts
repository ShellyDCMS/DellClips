import { then } from "@shellygo/cypress-test-utils";
import { RenderFactory } from "../__test-utils__/renderer";
import VideoFeed from "./video-feed";
import { VideoFeedDriver } from "./video-feed.driver";

const makeVideo = (id: string, title: string) => ({
  id,
  title,
  description: `Description for ${title}`,
  playbackUrl: `https://example.com/${id}.m3u8`,
  videoPlaybackId: `playback-${id}`,
  likeCount: 10,
  commentCount: 3,
  hasLiked: false,
  isFollowingAuthor: false,
  createdAt: new Date().toISOString(),
  author: {
    id: "author-1",
    name: "Jane Doe",
    email: "jane@dell.com",
    avatarUrl: null,
  },
  hashtags: ["demo"],
});

const twoVideos = [makeVideo("vid-1", "First Video"), makeVideo("vid-2", "Second Video")];

describe("VideoFeed", () => {
  const driver = new VideoFeedDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  beforeEach(() => {
    given.onOpenCommentsSpy();
    given.onOpenReportSpy();
    given.onHashtagClickSpy();
    given.onProfileClickSpy();

    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: VideoFeed,
        props: get.props() as any,
      }),
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given an empty list of videos", () => {
    beforeEach(() => {
      given.initialVideos([]);
      when.render();
    });

    it("then the empty feed message should be visible", () => {
      then(get.emptyFeed()).shouldBeVisible();
    });

    it("then the video feed container should not exist", () => {
      then(get.videoFeed()).shouldNotExist();
    });
  });

  describe("given a list of videos", () => {
    beforeEach(() => {
      given.initialVideos(twoVideos);
      when.render();
    });

    it("then the video feed container should be visible", () => {
      then(get.videoFeed()).shouldBeVisible();
    });

    it("then there should be 2 video cards", () => {
      then(get.numberOfVideoCards()).shouldEqual(2);
    });

    it("then the empty feed message should not exist", () => {
      then(get.emptyFeed()).shouldNotExist();
    });
  });
});
