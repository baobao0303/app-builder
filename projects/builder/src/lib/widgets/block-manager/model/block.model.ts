/**
 * Block Definition Interface
 */
export interface BlockDefinition {
  id: string;
  label: string;
  category?: string;
  content: string;
  attributes?: Record<string, any>;
  media?: string;
  [key: string]: any;
}

export class BlockModel {
  private _id: string;
  private _label: string;
  private _category: string = '';
  private _content: string;
  private _attributes: Record<string, any> = {};
  private _media?: string;
  private _props: Record<string, any> = {};

  constructor(def: BlockDefinition) {
    this._id = def.id;
    this._label = def.label;
    this._category = def.category || '';
    this._content = def.content;
    this._attributes = { ...def.attributes };
    this._media = def.media;

    // Copy other properties
    Object.keys(def).forEach(key => {
      if (!['id', 'label', 'category', 'content', 'attributes', 'media'].includes(key)) {
        this._props[key] = def[key];
      }
    });
  }

  getId(): string {
    return this._id;
  }

  getLabel(): string {
    return this._label;
  }

  getCategory(): string {
    return this._category;
  }

  getContent(): string {
    return this._content;
  }

  getAttributes(): Record<string, any> {
    return { ...this._attributes };
  }

  getMedia(): string | undefined {
    return this._media;
  }

  toJSON(): BlockDefinition {
    return {
      id: this._id,
      label: this._label,
      category: this._category,
      content: this._content,
      attributes: this._attributes,
      media: this._media,
      ...this._props,
    };
  }
}

