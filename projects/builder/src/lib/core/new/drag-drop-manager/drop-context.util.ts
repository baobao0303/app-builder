import { ViewContainerRef } from '@angular/core';

import { DropIndicator, DropIndicatorService } from '../../utils/drop-indicator.service';
import { DragDropManagerService, DragState } from './drag-drop-manager.service';

export interface DropContextParams {
  dragDropManager: DragDropManagerService;
  dropIndicator: DropIndicatorService;
  getContainerById: (id?: string | null) => ViewContainerRef | null;
  fallbackContainer: ViewContainerRef;
}

export interface DropContextSnapshot {
  dropState: DragState;
  indicatorState: DropIndicator;
  overContainerId?: string;
  targetContainer: ViewContainerRef;
}

export function captureDropContext({
  dragDropManager,
  dropIndicator,
  getContainerById,
  fallbackContainer,
}: DropContextParams): DropContextSnapshot {
  const dropState = dragDropManager.getState();
  const overContainerId = dropState.over?.overContainerId ?? undefined;

  return {
    dropState,
    indicatorState: dropIndicator.getIndicator(),
    overContainerId,
    targetContainer: getContainerById(overContainerId) ?? fallbackContainer,
  };
}
