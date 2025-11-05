/**
 * Sector Model - Angular version (simplified from @core_{ibrary)
 * Quản lý một sector trong Style Manager
 */

export interface SectorProperties {
  id?: string;
  name: string;
  open?: boolean;
  visible?: boolean;
  properties?: PropertyDefinition[];
}

export interface PropertyDefinition {
  name: string;
  property: string;
  type?: string;
  default?: any;
  [key: string]: any;
}

export class SectorModel {
  private _id: string;
  private _name: string;
  private _open: boolean = true;
  private _visible: boolean = true;
  private _properties: PropertyModel[] = [];

  constructor(props: SectorProperties) {
    this._name = props.name;
    this._id = props.id || props.name.replace(/ /g, '_').toLowerCase();
    this._open = props.open ?? true;
    this._visible = props.visible ?? true;

    if (props.properties) {
      this._properties = props.properties.map((p) => new PropertyModel(p));
    }
  }

  getId(): string {
    return this._id;
  }

  getName(): string {
    return this._name;
  }

  setName(name: string): void {
    this._name = name;
  }

  isOpen(): boolean {
    return this._open;
  }

  setOpen(open: boolean): void {
    this._open = open;
  }

  isVisible(): boolean {
    return this._visible;
  }

  setVisible(visible: boolean): void {
    this._visible = visible;
  }

  getProperties(): PropertyModel[] {
    return [...this._properties];
  }

  addProperty(prop: PropertyDefinition): PropertyModel {
    const property = new PropertyModel(prop);
    this._properties.push(property);
    return property;
  }

  removeProperty(id: string): boolean {
    const index = this._properties.findIndex((p) => p.getId() === id);
    if (index >= 0) {
      this._properties.splice(index, 1);
      return true;
    }
    return false;
  }

  toJSON(): SectorProperties {
    return {
      id: this._id,
      name: this._name,
      open: this._open,
      visible: this._visible,
      properties: this._properties.map((p) => p.toJSON()),
    };
  }
}

export class PropertyModel {
  private _id: string;
  private _name: string;
  private _property: string;
  private _type: string = 'text';
  private _value: any;
  private _default: any;
  private _props: Record<string, any> = {};

  constructor(def: PropertyDefinition) {
    this._name = def.name;
    this._property = def.property || def.name;
    this._type = def.type || 'text';
    this._value = def.default;
    this._default = def.default;
    this._id = def['id'] || `${this._property}-${Date.now()}`;

    // Copy other properties
    Object.keys(def).forEach((key) => {
      if (!['name', 'property', 'type', 'default', 'id'].includes(key)) {
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

  getProperty(): string {
    return this._property;
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

  toJSON(): PropertyDefinition {
    return {
      name: this._name,
      property: this._property,
      type: this._type,
      default: this._default,
      ...this._props,
    };
  }
}
