import { BaseTestDriver } from "@/components/__test-utils__/base-test-driver";
import { HashtagSubscribeDriver } from "@/components/hashtag-subscribe/hashtag-subscribe.driver";
import { SearchBarDriver } from "@/components/search-bar/search-bar.driver";

interface SearchClientDriverProps {
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
  hashtag?: string;
  query?: string;
  isSubscribed?: boolean;
  trendingHashtags?: { name: string; count: number }[];
  subscribedHashtags?: string[];
  currentUserId?: string;
}

export class SearchClientDriver extends BaseTestDriver<SearchClientDriverProps> {
  private searchBarDriver = new SearchBarDriver();
  private hashtagSubscribeDriver = new HashtagSubscribeDriver();

  mockRouterPush: ((...args: unknown[]) => void) | null = null;

  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {
        initialVideos: [],
        hashtag: "",
        query: "",
        isSubscribed: false,
        trendingHashtags: [],
        subscribedHashtags: [],
        currentUserId: "current-user",
      };
      this.mockRouterPush = null;
    });
  };

  given = {
    ...this._given,
    initialVideos: (videos: SearchClientDriverProps["initialVideos"]) => {
      this.props.initialVideos = videos;
    },
    hashtag: (hashtag: string) => {
      this.props.hashtag = hashtag;
    },
    query: (query: string) => {
      this.props.query = query;
    },
    isSubscribed: (value: boolean = true) => {
      this.props.isSubscribed = value;
    },
    trendingHashtags: (tags: { name: string; count: number }[]) => {
      this.props.trendingHashtags = tags;
    },
    subscribedHashtags: (tags: string[]) => {
      this.props.subscribedHashtags = tags;
    },
    currentUserId: (userId: string) => {
      this.props.currentUserId = userId;
    },
    mockRouterPush: (spy: (...args: unknown[]) => void) => {
      this.mockRouterPush = spy;
    },
  };

  when = {
    ...this._when,
    searchBar: this.searchBarDriver.when,
    hashtagSubscribe: this.hashtagSubscribeDriver.when,
    clickHashtagsTab: () => this.helper.when.click("tab-hashtags"),
    clickPeopleTab: () => this.helper.when.click("tab-people"),
    typeUserSearch: (text: string) => this.helper.when.type("user-search-input", text),
    waitUntil: (checkFunction: () => any) => this.helper.when.waitUntil(checkFunction),
  };

  get = {
    ...this._get,
    searchClient: () => this.helper.get.elementByTestId("search-client"),
    hashtagHeader: () => this.helper.get.elementByTestId("hashtag-header"),
    hashtagHeaderText: () => this.helper.get.elementsText("hashtag-header"),
    queryHeader: () => this.helper.get.elementByTestId("query-header"),
    queryHeaderText: () => this.helper.get.elementsText("query-header"),
    subscriptionsHeader: () => this.helper.get.elementByTestId("subscriptions-header"),
    subscriptionsHeaderText: () => this.helper.get.elementsText("subscriptions-header"),
    trendingHeader: () => this.helper.get.elementByTestId("trending-header"),
    trendingHeaderText: () => this.helper.get.elementsText("trending-header"),
    noResults: () => this.helper.get.elementByTestId("no-results"),
    noResultsText: () => this.helper.get.elementsText("no-results"),
    searchResultsGrid: () => this.helper.get.elementByTestId("search-results-grid"),
    searchBar: this.searchBarDriver.get,
    hashtagSubscribe: this.hashtagSubscribeDriver.get,
    hashtagCloud: () => this.helper.get.elementByTestId("hashtag-cloud"),
    tabHashtags: () => this.helper.get.elementByTestId("tab-hashtags"),
    tabHashtagsText: () => this.helper.get.elementsText("tab-hashtags"),
    tabPeople: () => this.helper.get.elementByTestId("tab-people"),
    tabPeopleText: () => this.helper.get.elementsText("tab-people"),
    userSearchInput: () => this.helper.get.elementByTestId("user-search-input"),
    userResults: () => this.helper.get.elementByTestId("user-results"),
    noUserResults: () => this.helper.get.elementByTestId("no-user-results"),
    noUserResultsText: () => this.helper.get.elementsText("no-user-results"),
  };
}
