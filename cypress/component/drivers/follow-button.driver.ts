import FollowButton from "@/components/follow-button";
import { CypressHelper } from "@shellygo/cypress-test-utils";

export class FollowButtonDriver {
  private helper = new CypressHelper();

  given = {
    followButtonIsRendered: (
      userId: string = "user-123",
      isFollowing: boolean = false
    ) => {
      this.helper.given.component(FollowButton, {
        props: {
          userId,
          initialIsFollowing: isFollowing,
        },
      });
    },

    userIsNotFollowed: (userId: string = "user-123") => {
      this.given.followButtonIsRendered(userId, false);
    },

    userIsFollowed: (userId: string = "user-123") => {
      this.given.followButtonIsRendered(userId, true);
    },
  };

  when = {
    clickingFollowButton: () => {
      this.helper.when.click("follow-button");
    },
  };

  get = {
    followButton: () => this.helper.get.elementByTestId("follow-button"),

    buttonText: () =>
      this.helper.get.elementByTestId("follow-button").invoke("text"),

    isShowingFollow: () =>
      this.helper.get.elementByTestId("follow-button").should("contain", "Follow"),

    isShowingFollowing: () =>
      this.helper.get
        .elementByTestId("follow-button")
        .should("contain", "Following"),
  };
}