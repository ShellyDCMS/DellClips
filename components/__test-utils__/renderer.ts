
import { CypressReactComponentHelper } from "@shellygo/cypress-test-utils/react";
import parse from "html-react-parser";
import type { Attributes, ComponentClass, ComponentType, FunctionComponent, JSX } from "react";
import React from "react";
export interface IRenderer {
  render: () => void;
}

export interface ReactOptions<
  P extends {},
  T extends
    | FunctionComponent<P>
    | ComponentClass<P>
    | ((props: P) => JSX.Element)
> {
  type: T;
  props?: (Attributes & P) | null;
  children?: string;
}

export interface Wrapper {
  type: ComponentType<any>;
  props?: Record<string, any>;
}

export interface Options<
  P extends {} = any,
  T extends
    | FunctionComponent<P>
    | ComponentClass<P>
    | ((props: P) => JSX.Element) = any
> {
  
  getReactOptions?: () => ReactOptions<P, T>;
  wrappers?: Wrapper[] | (() => Wrapper[]);
 
}

export class RenderFactory<
  P extends {} = any,
  T extends
    | FunctionComponent<P>
    | ComponentClass<P>
    | ((props: P) => JSX.Element) = any
> {
  protected readonly options: Options<P, T>;

  constructor(options: Options<P, T>) {
    this.options = options;
  }

  /**
   * @returns IRenderer
   * @example
   */
  public createRenderer(): IRenderer {
      return {
        render: () => this.renderReact(this.options.getReactOptions!())
      };
  }

  protected renderReact<
    P extends {},
    T extends
      | FunctionComponent<P>
      | ComponentClass<P>
      | ((props: P) => JSX.Element)
  >({ type, props, children = "" }: ReactOptions<P, T>) {
    const reactComponentHelper = new CypressReactComponentHelper();
    const parsedChildren = this.get.reactChildren(children);
    const component = React.createElement(type, props, parsedChildren);

    const wrappers = typeof this.options.wrappers === 'function'
      ? this.options.wrappers()
      : this.options.wrappers;
    if (wrappers?.length) {
      const wrapped = this.wrapWithProviders(component, wrappers);
      reactComponentHelper.when.mountComponent(wrapped);
    } else {
      reactComponentHelper.when.mount(type, props, parsedChildren);
    }
  }

  protected wrapWithProviders(
    component: React.ReactNode,
    wrappers: Wrapper[]
  ): React.ReactNode {
    return wrappers.reduceRight(
      (child, wrapper) =>
        React.createElement(wrapper.type, wrapper.props || null, child),
      component
    );
  }

  protected get = {
    reactChildren: (children: string) => {
      return parse(children);
    },
  };
}
