/**
 * Component Model - Angular version
 * Quản lý component tree và generate HTML
 */

export interface ComponentDefinition {
  tagName?: string;
  attributes?: Record<string, any>;
  style?: Record<string, any>;
  classes?: string[];
  components?: ComponentDefinition[];
  content?: string;
  type?: string;
  [key: string]: any;
}

export interface ToHTMLOptions {
  tag?: string;
  attributes?:
    | Record<string, any>
    | ((component: ComponentModel, attrs: Record<string, any>) => Record<string, any>);
  keepInlineStyle?: boolean;
  withProps?: boolean;
  altQuoteAttr?: boolean;
}

export class ComponentModel {
  private _id: string;
  private _tagName: string = 'div';
  private _attributes: Record<string, any> = {};
  private _style: Record<string, any> = {};
  private _classes: string[] = [];
  private _components: ComponentModel[] = [];
  private _content: string = '';
  private _type: string = 'default';
  private _parent: ComponentModel | null = null;

  constructor(def: ComponentDefinition = {}, parent: ComponentModel | null = null) {
    this._parent = parent;
    this._id = def.attributes?.['id'] || this.generateId();
    this._tagName = def.tagName || 'div';
    this._attributes = { ...def.attributes };
    this._style = { ...def.style };
    this._classes = [...(def.classes || [])];
    this._content = def.content || '';
    this._type = def.type || 'default';

    // Recursively create children
    if (def.components) {
      this._components = def.components.map((c) => new ComponentModel(c, this));
    }
  }

  getId(): string {
    return this._id;
  }

  setId(id: string): void {
    this._id = id;
    this._attributes['id'] = id;
  }

  getTagName(): string {
    return this._tagName;
  }

  setTagName(tagName: string): void {
    this._tagName = tagName;
  }

  getAttributes(): Record<string, any> {
    return { ...this._attributes };
  }

  setAttributes(attrs: Record<string, any>): void {
    this._attributes = { ...this._attributes, ...attrs };
  }

  getStyle(): Record<string, any> {
    return { ...this._style };
  }

  setStyle(style: Record<string, any>): void {
    this._style = { ...style };
  }

  getClasses(): string[] {
    return [...this._classes];
  }

  addClass(className: string): void {
    if (!this._classes.includes(className)) {
      this._classes.push(className);
    }
  }

  removeClass(className: string): void {
    this._classes = this._classes.filter((c) => c !== className);
  }

  getComponents(): ComponentModel[] {
    return [...this._components];
  }

  moveChild(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= this._components.length ||
      toIndex >= this._components.length
    ) {
      return;
    }
    const [moved] = this._components.splice(fromIndex, 1);
    this._components.splice(toIndex, 0, moved);
  }

  addComponent(def: ComponentDefinition, index?: number): ComponentModel {
    const component = new ComponentModel(def, this);
    if (index !== undefined) {
      this._components.splice(index, 0, component);
    } else {
      this._components.push(component);
    }
    return component;
  }

  removeComponent(id: string): boolean {
    const index = this._components.findIndex((c) => c.getId() === id);
    if (index >= 0) {
      this._components.splice(index, 1);
      return true;
    }
    // Recursive search
    for (const comp of this._components) {
      if (comp.removeComponent(id)) {
        return true;
      }
    }
    return false;
  }

  getComponent(id: string): ComponentModel | null {
    if (this._id === id) return this;
    for (const comp of this._components) {
      const found = comp.getComponent(id);
      if (found) return found;
    }
    return null;
  }

  getContent(): string {
    return this._content;
  }

  setContent(content: string): void {
    this._content = content;
  }

  getParent(): ComponentModel | null {
    return this._parent;
  }

  toHTML(opts: ToHTMLOptions = {}): string {
    const customTag = opts.tag;
    const tag = customTag || this._tagName;
    const attrs = this._attrToString(opts);
    const attrString = attrs ? ` ${attrs}` : '';
    const inner = this._getInnerHTML(opts);
    const isVoid = !inner && this._isVoidTag(tag);
    let code = `<${tag}${attrString}${isVoid ? '/' : ''}>${inner}`;
    if (!isVoid) {
      code += `</${tag}>`;
    }
    return code;
  }

  getInnerHTML(opts?: ToHTMLOptions): string {
    return this._getInnerHTML(opts);
  }

  private _getInnerHTML(opts: ToHTMLOptions = {}): string {
    if (this._components.length === 0) {
      return this._content;
    }
    return this._components.map((c) => c.toHTML(opts)).join('');
  }

  private _attrToString(opts: ToHTMLOptions = {}): string {
    const attrs: string[] = [];
    let attributes = this.getAttributes();

    // Handle custom attributes
    if (opts.attributes) {
      if (typeof opts.attributes === 'function') {
        attributes = opts.attributes(this, attributes) || {};
      } else {
        attributes = { ...attributes, ...opts.attributes };
      }
    }

    // Add style if not avoiding inline
    if (!opts.keepInlineStyle && Object.keys(this._style).length > 0) {
      const styleStr = Object.entries(this._style)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');
      attributes['style'] = styleStr;
    }

    // Add classes
    if (this._classes.length > 0) {
      attributes['class'] = this._classes.join(' ');
    }

    // Convert to string
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'boolean') {
          if (value) attrs.push(key);
        } else {
          const escaped = String(value).replace(/"/g, '&quot;');
          attrs.push(`${key}="${escaped}"`);
        }
      }
    }

    return attrs.join(' ');
  }

  private _isVoidTag(tag: string): boolean {
    const voidTags = [
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'param',
      'source',
      'track',
      'wbr',
    ];
    return voidTags.includes(tag.toLowerCase());
  }

  private generateId(): string {
    return `c${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON(): ComponentDefinition {
    return {
      tagName: this._tagName,
      attributes: this.getAttributes(),
      style: this.getStyle(),
      classes: this.getClasses(),
      content: this._content,
      type: this._type,
      components: this._components.map((c) => c.toJSON()),
    };
  }
}
