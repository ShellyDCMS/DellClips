import { BaseTestDriver } from "../__test-utils__/base-test-driver";

interface NavBarDriverProps {}

export class NavBarDriver extends BaseTestDriver<NavBarDriverProps> {
  pathnameValue = "/feed";

  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
      this.pathnameValue = "/feed";
    });
  };

  given = {
    ...this._given,
    pathname: (value: string) => {
      this.pathnameValue = value;
    },
  };

  when = {
    ...this._when,
  };

  get = {
    ...this._get,
    navBar: () => this.helper.get.elementByTestId("nav-bar"),
    homeLink: () => this.helper.get.elementByTestId("nav-home"),
    uploadLink: () => this.helper.get.elementByTestId("nav-upload"),
    profileLink: () => this.helper.get.elementByTestId("nav-profile"),
    homeLinkText: () => this.helper.get.elementsText("nav-home"),
    uploadLinkText: () => this.helper.get.elementsText("nav-upload"),
    profileLinkText: () => this.helper.get.elementsText("nav-profile"),
  };
}
