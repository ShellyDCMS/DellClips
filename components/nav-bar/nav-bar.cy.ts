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
      get.navBar().should("be.visible");
    });

    it("then the Home link should display 'Home'", () => {
      get.homeLinkText().should("include", "Home");
    });

    it("then the Upload link should display 'Upload'", () => {
      get.uploadLinkText().should("include", "Upload");
    });

    it("then the Profile link should display 'Profile'", () => {
      get.profileLinkText().should("include", "Profile");
    });

    it("then the Home link should be visible", () => {
      get.homeLink().should("be.visible");
    });

    it("then the Upload link should be visible", () => {
      get.uploadLink().should("be.visible");
    });

    it("then the Profile link should be visible", () => {
      get.profileLink().should("be.visible");
    });
  });

  describe("given the user is on the upload page", () => {
    beforeEach(() => {
      given.pathname("/upload");
      when.render();
    });

    it("then the nav bar should be visible", () => {
      get.navBar().should("be.visible");
    });
  });

  describe("given the user is on the profile page", () => {
    beforeEach(() => {
      given.pathname("/profile/me");
      when.render();
    });

    it("then the nav bar should be visible", () => {
      get.navBar().should("be.visible");
    });
  });
});
