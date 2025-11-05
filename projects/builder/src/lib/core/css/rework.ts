import { type ParserOptions, type Stylesheet, type StringifyOptions } from './stringify/types';
import { parse } from './index';
import { stringify } from './stringify/index';

export function rework(str: string, options?: ParserOptions) {
  return new Rework(parse(str, options));
}

export class Rework {
  private stylesheet: Stylesheet;

  constructor(stylesheet: Stylesheet) {
    this.stylesheet = stylesheet;
  }
  use(fn: Function) {
    fn(this.stylesheet.stylesheet, this);
    return this;
  }
  toString(options?: StringifyOptions) {
    options = options || {};
    return stringify(this.stylesheet, options);
  }
}
