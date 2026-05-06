import { BaseTestDriver } from "../__test-utils__/base-test-driver";

interface HashtagSubscribeDriverProps {
  hashtag?: string;
  initialIsSubscribed?: boolean;
}

export class HashtagSubscribeDriver extends BaseTestDriver<HashtagSubscribeDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
    hashtag: (hashtag: string) => {
      this.props.hashtag = hashtag;
    },
    initialIsSubscribed: (value: boolean = true) => {
      this.props.initialIsSubscribed = value;
    },
    interceptSubscribe: () => {
      this.helper.given.interceptAndMockResponse({
        method: "POST",
        url: `**/api/hashtags/${this.props.hashtag}/subscribe`,
        alias: "subscribe",
        response: { body: { subscribed: true } },
      });
    },
    interceptUnsubscribe: () => {
      this.helper.given.interceptAndMockResponse({
        method: "DELETE",
        url: `**/api/hashtags/${this.props.hashtag}/subscribe`,
        alias: "unsubscribe",
        response: { body: { subscribed: false } },
      });
    },
    interceptSubscribeError: () => {
      this.helper.given.interceptAndMockResponse({
        method: "POST",
        url: `**/api/hashtags/${this.props.hashtag}/subscribe`,
        alias: "subscribe",
        response: { statusCode: 500 },
      });
    },
    interceptUnsubscribeError: () => {
      this.helper.given.interceptAndMockResponse({
        method: "DELETE",
        url: `**/api/hashtags/${this.props.hashtag}/subscribe`,
        alias: "unsubscribe",
        response: { statusCode: 500 },
      });
    },
  };

  when = {
    ...this._when,
    clickSubscribe: () =>
      this.helper.when.click(`hashtag-subscribe-${this.props.hashtag}`),
    waitForSubscribe: () => this.helper.when.waitForResponse("subscribe"),
    waitForUnsubscribe: () => this.helper.when.waitForResponse("unsubscribe"),
  };

  get = {
    ...this._get,
    subscribeButton: () =>
      this.helper.get.elementByTestId(`hashtag-subscribe-${this.props.hashtag}`),
    subscribeButtonText: () =>
      this.helper.get.elementsText(`hashtag-subscribe-${this.props.hashtag}`),
    subscribeRequestBody: () => this.helper.get.requestBody("subscribe"),
    unsubscribeRequestBody: () => this.helper.get.requestBody("unsubscribe"),
  };
}
