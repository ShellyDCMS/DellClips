import { RenderFactory } from "@/components/__test-utils__/renderer";
import { then } from "@shellygo/cypress-test-utils";
import Chance from "chance";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
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
      wrappers: () => [{ type: AppRouterContext.Provider, props: { value: mockRouter } }],
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
      then(get.searchClient()).shouldBeVisible();
    });

    it("then the search input should be visible", () => {
      then(get.searchBar.searchInput()).shouldBeVisible();
    });

    it("then the trending header should be visible", () => {
      then(get.trendingHeader()).shouldBeVisible();
    });

    it("then the trending header text should display 'Trending'", () => {
      then(get.trendingHeaderText()).shouldInclude("Trending");
    });

    it("then the hashtag header should not exist", () => {
      then(get.hashtagHeader()).shouldNotExist();
    });

    it("then the query header should not exist", () => {
      then(get.queryHeader()).shouldNotExist();
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
      then(get.subscriptionsHeader()).shouldBeVisible();
    });

    it("then the subscriptions header text should display 'Your Subscriptions'", () => {
      then(get.subscriptionsHeaderText()).shouldInclude("Your Subscriptions");
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
      then(get.hashtagHeader()).shouldBeVisible();
    });

    it("then the hashtag header should display the hashtag name", () => {
      then(get.hashtagHeaderText()).shouldInclude(hashtagName);
    });

    it("then the no results message should be visible", () => {
      then(get.noResults()).shouldBeVisible();
    });

    it("then the no results text should display 'No videos found'", () => {
      then(get.noResultsText()).shouldInclude("No videos found");
    });

    it("then the trending header should not exist", () => {
      then(get.trendingHeader()).shouldNotExist();
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
      then(get.queryHeader()).shouldBeVisible();
    });

    it("then the query header should include the search term", () => {
      then(get.queryHeaderText()).shouldInclude(searchQuery);
    });

    it("then the hashtag header should not exist", () => {
      then(get.hashtagHeader()).shouldNotExist();
    });
  });

  describe("given trending hashtags on default landing (hashtag cloud)", () => {
    const trendingTags = [
      { name: chance.word(), count: chance.integer({ min: 10, max: 50 }) },
      { name: chance.word(), count: chance.integer({ min: 1, max: 5 }) },
      { name: chance.word(), count: chance.integer({ min: 20, max: 100 }) },
    ];

    beforeEach(() => {
      given.trendingHashtags(trendingTags);
      when.render();
    });

    it("then the hashtag cloud should be visible", () => {
      then(get.hashtagCloud()).shouldBeVisible();
    });

    it("then the hashtags tab should be visible", () => {
      then(get.tabHashtags()).shouldBeVisible();
    });

    it("then the hashtags tab text should display 'Hashtags'", () => {
      then(get.tabHashtagsText()).shouldInclude("Hashtags");
    });

    it("then the people tab should be visible", () => {
      then(get.tabPeople()).shouldBeVisible();
    });

    it("then the people tab text should display 'People'", () => {
      then(get.tabPeopleText()).shouldInclude("People");
    });
  });

  describe("given no trending hashtags on default landing", () => {
    beforeEach(() => {
      given.trendingHashtags([]);
      when.render();
    });

    it("then the hashtag cloud should not exist", () => {
      then(get.hashtagCloud()).shouldNotExist();
    });
  });

  describe("given the people tab is clicked", () => {
    beforeEach(() => {
      given.trendingHashtags([]);
      when.render();
      when.clickPeopleTab();
    });

    it("then the user search input should be visible", () => {
      then(get.userSearchInput()).shouldBeVisible();
    });

    it("then the hashtag cloud should not exist", () => {
      then(get.hashtagCloud()).shouldNotExist();
    });

    it("then the trending header should not exist", () => {
      then(get.trendingHeader()).shouldNotExist();
    });
  });

  describe("given the people tab is active and switching back to hashtags tab", () => {
    const trendingTags = [
      { name: chance.word(), count: chance.integer({ min: 1, max: 50 }) },
    ];

    beforeEach(() => {
      given.trendingHashtags(trendingTags);
      when.render();
      when.clickPeopleTab();
      when.clickHashtagsTab();
    });

    it("then the trending header should be visible", () => {
      then(get.trendingHeader()).shouldBeVisible();
    });

    it("then the user search input should not exist", () => {
      then(get.userSearchInput()).shouldNotExist();
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
      then(get.searchResultsGrid()).shouldBeVisible();
    });

    it("then the no results message should not exist", () => {
      then(get.noResults()).shouldNotExist();
    });
  });
});
