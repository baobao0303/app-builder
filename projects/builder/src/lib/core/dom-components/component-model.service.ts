import { Injectable } from '@angular/core';
import { ComponentModel, ComponentDefinition } from './model/component.model';

/**
 * Service quản lý component tree
 * Quản lý ComponentModel instances và tree structure
 */
@Injectable({
  providedIn: 'root',
})
export class ComponentModelService {
  private rootComponent: ComponentModel | null = null;
  private componentsMap = new Map<string, ComponentModel>();

  /**
   * Tạo component mới
   */
  createComponent(def: ComponentDefinition, parentId?: string, index?: number): ComponentModel {
    const parent = parentId ? this.getComponent(parentId) : null;

    if (parent) {
      // Add as child of parent to keep tree consistent
      const child = parent.addComponent(def, index);
      this.componentsMap.set(child.getId(), child);
      return child;
    }

    const component = new ComponentModel(def, null);
    this.componentsMap.set(component.getId(), component);
    this.rootComponent = component;
    return component;
  }

  /**
   * Lấy component theo ID
   */
  getComponent(id: string): ComponentModel | null {
    return this.componentsMap.get(id) || null;
  }

  /**
   * Cập nhật component
   */
  updateComponent(id: string, props: Partial<ComponentDefinition>): boolean {
    const component = this.getComponent(id);
    if (!component) return false;

    if (props.tagName) component.setTagName(props.tagName);
    if (props.attributes) component.setAttributes(props.attributes);
    if (props.style) component.setStyle(props.style);
    if (props.classes) {
      props.classes.forEach((cls) => component.addClass(cls));
    }
    if (props.content !== undefined) component.setContent(props.content);

    return true;
  }

  /**
   * Xóa component
   */
  removeComponent(id: string): boolean {
    const component = this.getComponent(id);
    if (!component) return false;

    const parent = component.getParent();
    if (parent) {
      parent.removeComponent(id);
    } else if (this.rootComponent?.getId() === id) {
      this.rootComponent = null;
    }

    this.componentsMap.delete(id);
    return true;
  }

  /**
   * Lấy root component
   */
  getRootComponent(): ComponentModel | null {
    return this.rootComponent;
  }

  /**
   * Set root component
   */
  setRootComponent(def: ComponentDefinition): ComponentModel {
    this.rootComponent = new ComponentModel(def, null);
    this.componentsMap.set(this.rootComponent.getId(), this.rootComponent);
    return this.rootComponent;
  }

  /**
   * Xóa toàn bộ
   */
  clear(): void {
    this.rootComponent = null;
    this.componentsMap.clear();
  }

  /**
   * Generate HTML từ root component
   */
  generateHTML(opts?: any): string {
    if (!this.rootComponent) return '';
    return this.rootComponent.toHTML(opts);
  }

  /**
   * Reorder children under a parent component
   */
  reorderChild(parentId: string, from: number, to: number): void {
    const parent = this.getComponent(parentId);
    if (!parent) return;
    parent.moveChild(from, to);
  }
}
