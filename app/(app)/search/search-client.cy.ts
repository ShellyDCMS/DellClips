import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { RenderFactory } from "@/components/__test-utils__/renderer";
import Chance from "chance";
import SearchClient from "./search-client";
import { SearchClientDriver } from "./search-client.driver";

const chance = new Chance();

const makeVideo = (id: string) => ({
  id,
  title: chance.sentence({ words: 3 }),
  description: chance.sentence({ words: 6 }),
  playbackUrl: chance.url(),
  videoPlaybackId: chance.guid(),
  likeCount: chance.integer({ min: 0, max: 100 }),
  commentCount: chance.integer({ min: 0, max: 50 }),
  hasLiked: false,
  createdAt: new Date().toISOString(),
  author: {
    id: chance.guid(),
    name: chance.name(),
    email: chance.email({ domain: "dell.com" }),
    avatarUrl: null,
  },
  hashtags: [chance.word()],
});

describe("SearchClient", () => {
  const driver = new SearchClientDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  const mockPush = Cypress.sinon.stub();

  const mockRouter = {
    back: () => {},
    forward: () => {},
    push: mockPush,
    replace: () => {},
    refresh: () => {},
    prefetch: () => Promise.resolve(),
  };

  beforeEach(() => {
    mockPush.reset();
    given.mockRouterPush(mockPush);

    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: SearchClient,
        props: get.props() as any,
      }),
      wrappers: () => [
        { type: AppRouterContext.Provider, props: { value: mockRouter } },
      ],
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given no hashtag and no query (default landing)", () => {
    const trendingTags = [
      { name: chance.word(), count: chance.integer({ min: 1, max: 50 }) },
      { name: chance.word(), count: chance.integer({ min: 1, max: 50 }) },
    ];

    beforeEach(() => {
      given.trendingHashtags(trendingTags);
      when.render();
    });

    it("then the search client container should be visible", () => {
      get.searchClient().should("be.visible");
    });

    it("then the search input should be visible", () => {
      get.searchBar.searchInput().should("be.visible");
    });

    it("then the trending header should be visible", () => {
      get.trendingHeader().should("be.visible");
    });

    it("then the trending header text should display 'Trending'", () => {
      get.trendingHeaderText().should("include", "Trending");
    });

    it("then the hashtag header should not exist", () => {
      get.hashtagHeader().should("not.exist");
    });

    it("then the query header should not exist", () => {
      get.queryHeader().should("not.exist");
    });
  });

  describe("given subscribed hashtags and no search", () => {
    const subscribedTags = [chance.word(), chance.word()];

    beforeEach(() => {
      given.subscribedHashtags(subscribedTags);
      given.trendingHashtags([]);
      when.render();
    });

    it("then the subscriptions header should be visible", () => {
      get.subscriptionsHeader().should("be.visible");
    });

    it("then the subscriptions header text should display 'Your Subscriptions'", () => {
      get.subscriptionsHeaderText().should("include", "Your Subscriptions");
    });
  });

  describe("given a hashtag search", () => {
    const hashtagName = chance.word();

    beforeEach(() => {
      given.hashtag(hashtagName);
      given.initialVideos([]);
      when.render();
    });

    it("then the hashtag header should be visible", () => {
      get.hashtagHeader().should("be.visible");
    });

    it("then the hashtag header should display the hashtag name", () => {
      get.hashtagHeaderText().should("include", hashtagName);
    });

    it("then the no results message should be visible", () => {
      get.noResults().should("be.visible");
    });

    it("then the no results text should display 'No videos found'", () => {
      get.noResultsText().should("include", "No videos found");
    });

    it("then the trending header should not exist", () => {
      get.trendingHeader().should("not.exist");
    });
  });

  describe("given a text query search", () => {
    const searchQuery = chance.word();

    beforeEach(() => {
      given.query(searchQuery);
      given.initialVideos([]);
      when.render();
    });

    it("then the query header should be visible", () => {
      get.queryHeader().should("be.visible");
    });

    it("then the query header should include the search term", () => {
      get.queryHeaderText().should("include", searchQuery);
    });

    it("then the hashtag header should not exist", () => {
      get.hashtagHeader().should("not.exist");
    });
  });

  describe("given a hashtag search with results", () => {
    const hashtagName = chance.word();
    const videos = [makeVideo("vid-1"), makeVideo("vid-2")];

    beforeEach(() => {
      given.hashtag(hashtagName);
      given.initialVideos(videos);
      when.render();
    });

    it("then the search results grid should be visible", () => {
      get.searchResultsGrid().should("be.visible");
    });

    it("then the no results message should not exist", () => {
      get.noResults().should("not.exist");
    });
  });
});
