import { BaseTestDriver } from "../__test-utils__/base-test-driver";

interface FollowButtonDriverProps {
  userId?: string;
  initialIsFollowing?: boolean;
}

export class FollowButtonDriver extends BaseTestDriver<FollowButtonDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
    userId: (userId: string) => {
      this.props.userId = userId;
    },
    initialIsFollowing: (value: boolean = true) => {
      this.props.initialIsFollowing = value;
    },
    interceptFollow: () => {
      this.helper.given.interceptAndMockResponse({
        method: "POST",
        url: `**/api/users/${this.props.userId}/follow`,
        alias: "follow",
        response: { body: { following: true } },
      });
    },
    interceptUnfollow: () => {
      this.helper.given.interceptAndMockResponse({
        method: "DELETE",
        url: `**/api/users/${this.props.userId}/follow`,
        alias: "unfollow",
        response: { body: { following: false } },
      });
    },
  };

  when = {
    ...this._when,
    clickFollow: () => this.helper.when.click("follow-button"),
    waitForFollow: () => this.helper.when.waitForResponse("follow"),
    waitForUnfollow: () => this.helper.when.waitForResponse("unfollow"),
  };

  get = {
    ...this._get,
    followButton: () => this.helper.get.elementByTestId("follow-button"),
    followButtonText: () => this.helper.get.elementsText("follow-button"),
  };
}
