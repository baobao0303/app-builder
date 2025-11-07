import { ComponentRef, Type, ViewContainerRef } from '@angular/core';

import { HtmlBlock } from '../../html-block/html-block';
import { ComponentDefinition } from '../../../core/dom-components/model/component.model';
import { DragDropManagerService } from '../../../core/new/drag-drop-manager/drag-drop-manager.service';
import { DropIndicator } from '../../../core/utils/drop-indicator.service';
import { ComponentModelService } from '../../../core/dom-components/component-model.service';
import { ParserService } from '../../../core/parser/parser.service';

export interface ExternalDropContext {
  parentId: string | undefined;
  useVcr: ViewContainerRef;
  componentRefs: Map<ComponentRef<any>, string>;
  getContainerRefs(container: ViewContainerRef, create?: boolean): ComponentRef<any>[];
  trackComponentRef(
    ref: ComponentRef<any>,
    container: ViewContainerRef,
    options: { parentId?: string; componentId?: string; insertIndex?: number }
  ): void;
  registerDraggable(ref: ComponentRef<any>): void;
  componentModelService: ComponentModelService;
  parser: ParserService;
  dragDropManager: DragDropManagerService;
  registry: Record<string, Type<unknown>>;
  componentDefinitions?: Record<string, ComponentDefinition>;
  setContainerRef(container: ViewContainerRef): void;
  createWidget(
    component: Type<any>,
    options?: { append?: boolean }
  ): ComponentRef<any> | null | undefined;
  insertWidget(component: Type<any>, index: number): ComponentRef<any> | null | undefined;
  createNestedComponents?(parentRef: ComponentRef<any>, defs: ComponentDefinition[]): void;
  add?(
    key: string,
    options?: { index?: number; append?: boolean; targetContainer?: ViewContainerRef }
  ): void;
}

const processHtmlPayload = (
  context: ExternalDropContext,
  html: string,
  insertIndex: number | undefined
) => {
  context.setContainerRef(context.useVcr);

  let ref: ComponentRef<any> | undefined;
  if (insertIndex !== undefined) {
    ref = context.insertWidget(HtmlBlock, insertIndex) as ComponentRef<any>;
  } else {
    ref = context.createWidget(HtmlBlock, { append: true }) as ComponentRef<any>;
  }

  if (ref && ref.instance) {
    (ref.instance as any).html = html;
    (ref.changeDetectorRef as any)?.detectChanges?.();
  }

  let targetParent = context.parentId
    ? context.componentModelService.getComponent(context.parentId)
    : null;
  if (!targetParent) {
    targetParent = context.componentModelService.getRootComponent();
  }

  if (targetParent) {
    const def =
      context.parser.parseHtml(html) || ({ tagName: 'div', content: html } as ComponentDefinition);
    const created = context.componentModelService.createComponent(
      def,
      targetParent.getId(),
      insertIndex
    );

    if (ref) {
      const containerRefs = context.getContainerRefs(context.useVcr);
      const position =
        insertIndex !== undefined && insertIndex >= 0 ? insertIndex : containerRefs.length;

      context.trackComponentRef(ref, context.useVcr, {
        parentId: targetParent.getId(),
        componentId: created.getId(),
        insertIndex: position,
      });
      context.registerDraggable(ref);
    }
  }
};

export function handleExternalDrop(
  context: ExternalDropContext,
  extPayload: ReturnType<DragDropManagerService['parseExternalPayload']>,
  indicator: DropIndicator,
  keyFallback: (key: string) => string | null
): boolean {
  const insertIndex = indicator.insertIndex ?? undefined;

  switch (extPayload.type) {
    case 'html-json': {
      const html = extPayload.html || '';
      if (html) {
        processHtmlPayload(context, html, insertIndex);
        return true;
      }
      break;
    }
    case 'text-key': {
      const key = extPayload.key;
      if (!key) return false;

      const cmp = context.registry[key];
      if (cmp) {
        context.setContainerRef(context.useVcr);

        if (context.componentDefinitions && context.componentDefinitions[key]) {
          let targetParent = context.parentId
            ? context.componentModelService.getComponent(context.parentId)
            : null;
          if (!targetParent) targetParent = context.componentModelService.getRootComponent();
          if (!targetParent) {
            targetParent = context.componentModelService.setRootComponent({
              tagName: 'div',
              attributes: { 'data-zone': 'dynamic-zone' },
            });
          }

          const created = context.componentModelService.createComponent(
            context.componentDefinitions[key],
            targetParent.getId()
          );

          let childRef: ComponentRef<any> | undefined;
          if (insertIndex !== undefined) {
            childRef = context.insertWidget(cmp as Type<any>, insertIndex) as ComponentRef<any>;
          } else {
            childRef = context.createWidget(cmp as Type<any>, {
              append: true,
            }) as ComponentRef<any>;
          }

          if (childRef) {
            const containerRefs = context.getContainerRefs(context.useVcr);
            const position =
              insertIndex !== undefined && insertIndex >= 0 ? insertIndex : containerRefs.length;

            context.trackComponentRef(childRef, context.useVcr, {
              parentId: targetParent.getId(),
              componentId: created.getId(),
              insertIndex: position,
            });
            context.registerDraggable(childRef);

            const definition = context.componentDefinitions[key];
            if (definition.components && definition.components.length > 0) {
              context.createNestedComponents?.(childRef, definition.components);
            }
          }

          return true;
        }

        context.add?.(
          key,
          insertIndex !== undefined
            ? { index: insertIndex, targetContainer: context.useVcr }
            : { append: true }
        );
        return true;
      }

      const html = keyFallback(key);
      if (html) {
        processHtmlPayload(context, html, insertIndex);
        return true;
      }
      break;
    }
    case 'file-image':
    case 'unknown':
    default:
      break;
  }

  return false;
}
