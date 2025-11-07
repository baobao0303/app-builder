import { ComponentRef, Type, ViewContainerRef } from '@angular/core';

import { ComponentDefinition } from '../../../core/dom-components/model/component.model';

export interface NestedContext {
  registry: Record<string, Type<unknown>>;
  setNextComponent(component: Type<any>): void;
  setContainerRef(container: ViewContainerRef): void;
  createWidget(
    component: Type<any>,
    options?: { append?: boolean }
  ): ComponentRef<any> | null | undefined;
  componentRefs: Map<ComponentRef<any>, string>;
  getContainerRefs(container: ViewContainerRef, create?: boolean): ComponentRef<any>[];
  trackComponentRef(
    ref: ComponentRef<any>,
    container: ViewContainerRef,
    options: { parentId?: string; componentId?: string; insertIndex?: number }
  ): void;
  registerDraggable(ref: ComponentRef<any>): void;
  createNestedComponents(parentRef: ComponentRef<any>, children: ComponentDefinition[]): void;
}

export function createNestedComponents(
  context: NestedContext,
  parentRef: ComponentRef<any>,
  children: ComponentDefinition[]
): void {
  const parentContainer =
    typeof (parentRef.instance as any)?.getChildContainer === 'function'
      ? (parentRef.instance as any).getChildContainer()
      : null;

  if (!parentContainer) {
    console.warn('[DynamicZone] Parent component does not have getChildContainer()');
    return;
  }

  children.forEach((childDef, index) => {
    const widgetKey = childDef.attributes?.['data-widget'];
    const componentType = widgetKey ? context.registry[widgetKey] : null;

    if (!componentType) {
      console.warn('[DynamicZone] No component found for', widgetKey || childDef.tagName);
      return;
    }

    context.setNextComponent(componentType as Type<any>);
    context.setContainerRef(parentContainer);
    const childRef = context.createWidget(componentType as Type<any>, { append: true }) as
      | ComponentRef<any>
      | undefined
      | null;

    if (!childRef) {
      console.warn('[DynamicZone] Failed to create child component for', widgetKey);
      return;
    }

    const parentComponentId = context.componentRefs.get(parentRef);
    const childRefs = context.getContainerRefs(parentContainer);
    context.trackComponentRef(childRef, parentContainer, {
      parentId: parentComponentId,
      insertIndex: childRefs.length,
    });

    context.registerDraggable(childRef);

    if (childDef.style) {
      const hostEl = (childRef.location?.nativeElement || null) as HTMLElement | null;
      if (hostEl) {
        Object.entries(childDef.style).forEach(([prop, value]) => {
          (hostEl.style as any)[prop] = value;
        });
      }
    }

    if (childDef.components && childDef.components.length > 0) {
      context.createNestedComponents(childRef, childDef.components);
    }
  });
}
