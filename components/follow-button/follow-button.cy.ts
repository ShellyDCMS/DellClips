import { RenderFactory } from "../__test-utils__/renderer";
import FollowButton from "./follow-button";
import { FollowButtonDriver } from "./follow-button.driver";

describe("FollowButton", () => {
  const driver = new FollowButtonDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  beforeEach(() => {
    given.userId("user-123");

    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: FollowButton,
        props: get.props() as any,
      }),
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given initialIsFollowing is false (default)", () => {
    beforeEach(() => {
      when.render();
    });

    it('then the button should display "Follow"', () => {
      get.followButtonText().should("include", "Follow");
    });

    it("then the button should be visible", () => {
      get.followButton().should("be.visible");
    });
  });

  describe("given initialIsFollowing is true", () => {
    beforeEach(() => {
      given.initialIsFollowing(true);
      when.render();
    });

    it('then the button should display "Following"', () => {
      get.followButtonText().should("include", "Following");
    });
  });

  describe("given the user clicks the Follow button", () => {
    beforeEach(() => {
      when.render();
      when.clickFollow();
    });

    it('then the button text should change to "Following"', () => {
      get.followButtonText().should("include", "Following");
    });
  });

  describe("given the user clicks the Following button to unfollow", () => {
    beforeEach(() => {
      given.initialIsFollowing(true);
      when.render();
      when.clickFollow();
    });

    it('then the button text should change back to "Follow"', () => {
      get.followButtonText().should("include", "Follow");
    });
  });
});
