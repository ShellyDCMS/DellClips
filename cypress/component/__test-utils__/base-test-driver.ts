import { CypressHelper } from "@shellygo/cypress-test-utils";

export class BaseTestDriver<T> {
  protected helper = new CypressHelper();
  protected children = "";
  protected renderer: { render: () => void } = { render: () => {} };
  protected props: Partial<T> = {};

  protected _given = {
    children: (value: string) => (this.children = value),
    renderer: (value: { render: () => void }) => {
      this.renderer = value;
    },
  };

  protected _get = {
    children: () => this.children,
    props: () => this.props,
  };

  protected _when = {
    render: () => {
      this.renderer.render();
    },
  };
}
