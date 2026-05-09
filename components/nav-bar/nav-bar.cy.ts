import { then } from "@shellygo/cypress-test-utils";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { RenderFactory } from "../__test-utils__/renderer";
import NavBar from "./nav-bar";
import { NavBarDriver } from "./nav-bar.driver";

const mockRouter = {
  back: () => {},
  forward: () => {},
  push: () => {},
  replace: () => {},
  refresh: () => {},
  prefetch: () => Promise.resolve(),
};

describe("NavBar", () => {
  const driver = new NavBarDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  beforeEach(() => {
    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: NavBar,
        props: get.props() as any,
      }),
      wrappers: () => [
        { type: AppRouterContext.Provider, props: { value: mockRouter } },
        { type: PathnameContext.Provider, props: { value: driver.pathnameValue } },
      ],
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given the user is on the feed page", () => {
    beforeEach(() => {
      given.pathname("/feed");
      when.render();
    });

    it("then the nav bar should be visible", () => {
      then(get.navBar()).shouldBeVisible();
    });

    it("then the Home link should display 'Home'", () => {
      then(get.homeLinkText()).shouldInclude("Home");
    });

    it("then the Upload link should display 'Upload'", () => {
      then(get.uploadLinkText()).shouldInclude("Upload");
    });

    it("then the Profile link should display 'Profile'", () => {
      then(get.profileLinkText()).shouldInclude("Profile");
    });

    it("then the Home link should be visible", () => {
      then(get.homeLink()).shouldBeVisible();
    });

    it("then the Upload link should be visible", () => {
      then(get.uploadLink()).shouldBeVisible();
    });

    it("then the Profile link should be visible", () => {
      then(get.profileLink()).shouldBeVisible();
    });
  });

  describe("given the user is on the upload page", () => {
    beforeEach(() => {
      given.pathname("/upload");
      when.render();
    });

    it("then the nav bar should be visible", () => {
      then(get.navBar()).shouldBeVisible();
    });
  });

  describe("given the user is on the profile page", () => {
    beforeEach(() => {
      given.pathname("/profile/me");
      when.render();
    });

    it("then the nav bar should be visible", () => {
      then(get.navBar()).shouldBeVisible();
    });
  });
});
