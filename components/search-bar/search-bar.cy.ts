import { then } from "@shellygo/cypress-test-utils";
import { RenderFactory } from "../__test-utils__/renderer";
import SearchBar from "./search-bar";
import { SearchBarDriver } from "./search-bar.driver";

describe("SearchBar", () => {
  const driver = new SearchBarDriver();
  driver.beforeAndAfter();

  const { given, when, get } = driver;

  beforeEach(() => {
    given.onSearchSpy();

    const renderFactory = new RenderFactory({
      getReactOptions: () => ({
        type: SearchBar,
        props: get.props() as any,
      }),
    });

    given.renderer(renderFactory.createRenderer());
  });

  describe("given the search bar is rendered", () => {
    beforeEach(() => {
      when.render();
    });

    it("then the search input should be visible", () => {
      then(get.searchInput()).shouldBeVisible();
    });

    it("then the search input should have correct placeholder", () => {
      then(get.searchInput()).shouldHaveAttribute("placeholder", "Search videos or #hashtags");
    });
  });

  describe("given a search query is submitted", () => {
    beforeEach(() => {
      when.render();
      when.typeAndSubmit("DellTech");
    });

    it("then the onSearch callback should be called with the trimmed query", () => {
      then(get.onSearchSpy()).shouldHaveBeenCalledWith("DellTech");
    });
  });

  describe("given a hashtag search is submitted", () => {
    beforeEach(() => {
      when.render();
      when.typeAndSubmit("#engineering");
    });

    it("then the onSearch callback should be called with the hashtag", () => {
      then(get.onSearchSpy()).shouldHaveBeenCalledWith("#engineering");
    });
  });

  describe("given an empty query is submitted", () => {
    beforeEach(() => {
      when.render();
      when.submitForm();
    });

    it("then the onSearch callback should not be called", () => {
      then(get.onSearchSpy()).shouldNotHaveBeenCalled();
    });
  });

  describe("given a whitespace-only query is submitted", () => {
    beforeEach(() => {
      when.render();
      when.typeAndSubmit("   ");
    });

    it("then the onSearch callback should not be called", () => {
      then(get.onSearchSpy()).shouldNotHaveBeenCalled();
    });
  });
});
