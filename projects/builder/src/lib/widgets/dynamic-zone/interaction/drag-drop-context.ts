import { ComponentRef, ViewContainerRef } from '@angular/core';

import { captureDropContext } from '../../../core/new/drag-drop-manager/drop-context.util';
import { DragDropManagerService } from '../../../core/new/drag-drop-manager/drag-drop-manager.service';
import { DropIndicatorService } from '../../../core/utils/drop-indicator.service';
import { ComponentModelService } from '../../../core/dom-components/component-model.service';

export interface DragContextDeps {
  dragDropManager: DragDropManagerService;
  dropIndicator: DropIndicatorService;
  getContainerById(id?: string | null): ViewContainerRef | null;
  fallbackContainer: ViewContainerRef;
}

export interface DropDependencies {
  deps: DragContextDeps;
  componentRefs: Map<ComponentRef<any>, string>;
  getContainerRefs(container: ViewContainerRef, create?: boolean): ComponentRef<any>[];
  indexOfRef(ref: ComponentRef<any>): number;
  componentModelService: ComponentModelService;
  ensureContainerRegistered(container: ViewContainerRef): string;
  handleCrossContainerMove(args: {
    fromIndex: number;
    toIndex: number;
    fromContainer: ViewContainerRef;
    toContainer: ViewContainerRef;
    sourceContainerId: string;
    targetContainerId: string;
    sourceParentId?: string;
    targetParentId?: string;
  }): void;
  reorderWithinContainer(container: ViewContainerRef, from: number, to: number): void;
}

export const captureRootDropContext = (deps: DragContextDeps) =>
  captureDropContext({
    dragDropManager: deps.dragDropManager,
    dropIndicator: deps.dropIndicator,
    getContainerById: deps.getContainerById,
    fallbackContainer: deps.fallbackContainer,
  });

export function handleInternalDrop(
  indicatorInsertIndex: number | null,
  dropDeps: DropDependencies,
  ref: ComponentRef<any>,
  event: DragEvent,
  childContainer: ViewContainerRef | null,
  innerEl: HTMLElement | null,
  targetMeta: { containerId: string; parentId?: string } | undefined,
  targetContainerId: string,
  targetContainer: ViewContainerRef
): boolean {
  const fromStr = event.dataTransfer?.getData('text/dz-index');
  if (!fromStr) return false;

  const indicatorFallback =
    indicatorInsertIndex ?? dropDeps.indexOfRef(ref);
  const from = parseInt(fromStr, 10);
  const sourceContainerId =
    event.dataTransfer?.getData('text/dz-container') || targetContainerId;
  const sourceContainer =
    dropDeps.deps.getContainerById(sourceContainerId) ?? targetContainer;
  const dropTargetEl = event.target as HTMLElement;
  const isDroppingIntoChild =
    !!childContainer &&
    !!innerEl &&
    (dropTargetEl === innerEl || innerEl.contains(dropTargetEl));

  const destinationContainer =
    isDroppingIntoChild && childContainer ? childContainer : targetContainer;
  const destinationContainerId =
    isDroppingIntoChild && childContainer
      ? dropDeps.ensureContainerRegistered(childContainer)
      : targetContainerId;

  const destinationIndex = (() => {
    if (isDroppingIntoChild && childContainer) {
      return Math.max(
        0,
        indicatorInsertIndex ??
          dropDeps.getContainerRefs(childContainer, false).length
      );
    }
    return indicatorFallback;
  })();

  if (sourceContainer === destinationContainer) {
    dropDeps.reorderWithinContainer(destinationContainer, from, destinationIndex);

    const parentId =
      isDroppingIntoChild && childContainer
        ? dropDeps.componentRefs.get(ref) ??
          targetMeta?.parentId ??
          dropDeps.componentModelService.getRootComponent()?.getId()
        : targetMeta?.parentId ?? dropDeps.componentModelService.getRootComponent()?.getId();

    if (parentId) {
      dropDeps.componentModelService.reorderChild(parentId, from, destinationIndex);
    }
    return true;
  }

  const parentId =
    isDroppingIntoChild && childContainer
      ? dropDeps.componentRefs.get(ref) || undefined
      : event.dataTransfer?.getData('text/dz-parent') || targetMeta?.parentId;

  dropDeps.handleCrossContainerMove({
    fromIndex: from,
    toIndex: destinationIndex,
    fromContainer: sourceContainer,
    toContainer: destinationContainer,
    sourceContainerId,
    targetContainerId: destinationContainerId,
    sourceParentId: parentId || undefined,
    targetParentId:
      isDroppingIntoChild && childContainer
        ? dropDeps.componentRefs.get(ref) || undefined
        : targetMeta?.parentId,
  });

  return true;
}

