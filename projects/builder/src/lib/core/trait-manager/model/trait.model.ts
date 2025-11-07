/**
 * Trait Model - Angular version (simplified from @core_{ibrary)
 * Quản lý attributes/properties của component
 */

export interface TraitDefinition {
  name: string;
  label?: string;
  type?: string;
  value?: any;
  default?: any;
  options?: { value: any; label: string }[];
  [key: string]: any;
}

export class TraitModel {
  private _id: string;
  private _name: string;
  private _label: string;
  private _type: string = 'text';
  private _value: any;
  private _default: any;
  private _options?: { value: any; label: string }[];
  private _props: Record<string, any> = {};

  constructor(def: TraitDefinition) {
    this._name = def.name;
    this._label = def.label || def.name;
    this._type = def.type || 'text';
    this._value = def.value ?? def.default;
    this._default = def.default;
    this._id = def['id'] || `${this._name}-${Date.now()}`;
    this._options = def.options;

    // Copy other properties
    Object.keys(def).forEach((key) => {
      if (!['name', 'label', 'type', 'value', 'default', 'id', 'options'].includes(key)) {
        this._props[key] = def[key];
      }
    });
  }

  getId(): string {
    return this._id;
  }

  getName(): string {
    return this._name;
  }

  getLabel(): string {
    return this._label;
  }

  getType(): string {
    return this._type;
  }

  getValue(): any {
    return this._value;
  }

  setValue(value: any): void {
    this._value = value;
  }

  getDefault(): any {
    return this._default;
  }

  getOptions(): { value: any; label: string }[] | undefined {
    return this._options;
  }

  toJSON(): TraitDefinition {
    return {
      name: this._name,
      label: this._label,
      type: this._type,
      value: this._value,
      default: this._default,
      options: this._options,
      ...this._props,
    };
  }
}
