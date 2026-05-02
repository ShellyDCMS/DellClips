import { BaseTestDriver } from '../__test-utils__/base-test-driver';

interface SearchBarDriverProps {
  onSearch?: (query: string) => void;
}

export class SearchBarDriver extends BaseTestDriver<SearchBarDriverProps> {
  beforeAndAfter = () => {
    this.helper.beforeAndAfter();
    beforeEach(() => {
      this.props = {};
    });
  };

  given = {
    ...this._given,
    onSearchSpy: () => {
      this.props.onSearch = this.helper.given.spy('onSearch');
    },
  };

  when = {
    ...this._when,
    typeQuery: (query: string) => this.helper.when.type('search-input', query),
    submitForm: () => {
      this.helper.when.type('search-input', '{enter}');
    },
    typeAndSubmit: (query: string) => {
      this.helper.when.type('search-input', `${query}{enter}`);
    },
  };

  get = {
    ...this._get,
    searchInput: () => this.helper.get.elementByTestId('search-input'),
    onSearchSpy: () => this.helper.get.spy('onSearch'),
  };
}
