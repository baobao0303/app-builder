import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DragStartInfo {
  componentId?: string;
  sourceContainerId: string;
  sourceIndex: number;
}

export interface DragOverInfo {
  overContainerId: string;
  insertIndex: number;
  rect: { left: number; top: number; width: number };
}

export interface DropInfo {
  targetContainerId: string;
  targetIndex: number;
}

export type ExternalDropPayload =
  | { type: 'file-image'; file: File }
  | { type: 'html-json'; html: string }
  | { type: 'text-key'; key: string }
  | { type: 'unknown' };

export interface DragState {
  isDragging: boolean;
  dragging?: DragStartInfo;
  over?: DragOverInfo;
}

export interface DropIndicatorState {
  visible: boolean;
  top: number;
  left: number;
  width: number;
  insertIndex: number | null;
}

@Injectable({ providedIn: 'root' })
export class DragDropManagerService {
  private stateSubject = new BehaviorSubject<DragState>({ isDragging: false });
  private indicatorSubject = new BehaviorSubject<DropIndicatorState>({
    visible: false,
    top: 0,
    left: 0,
    width: 0,
    insertIndex: null,
  });

  get state$(): Observable<DragState> {
    return this.stateSubject.asObservable();
  }

  get dropIndicator$(): Observable<DropIndicatorState> {
    return this.indicatorSubject.asObservable();
  }

  getState(): DragState {
    return this.stateSubject.getValue();
  }

  startDrag(info: DragStartInfo): void {
    this.stateSubject.next({ isDragging: true, dragging: { ...info } });
  }

  updateOver(info: DragOverInfo): void {
    const current = this.stateSubject.getValue();
    this.stateSubject.next({ ...current, over: { ...info } });
    this.indicatorSubject.next({
      visible: true,
      top: info.rect.top,
      left: info.rect.left,
      width: info.rect.width,
      insertIndex: info.insertIndex,
    });
  }

  clearOver(): void {
    const current = this.stateSubject.getValue();
    this.stateSubject.next({ ...current, over: undefined });
    this.indicatorSubject.next({
      ...this.indicatorSubject.getValue(),
      visible: false,
      insertIndex: null,
    });
  }

  endDrag(): void {
    this.stateSubject.next({ isDragging: false });
    this.indicatorSubject.next({
      ...this.indicatorSubject.getValue(),
      visible: false,
      insertIndex: null,
    });
  }

  completeDrop(target: DropInfo): { from?: DragStartInfo; to: DropInfo } {
    const from = this.stateSubject.getValue().dragging;
    this.endDrag();
    return { from, to: target };
  }

  /**
   * Compute insertIndex inside a vertical container given clientY and children rects.
   */
  computeInsertIndex(containerEl: HTMLElement, clientY: number): number {
    const children = Array.from(containerEl.children) as HTMLElement[];
    if (children.length === 0) return 0;
    const containerRect = containerEl.getBoundingClientRect();
    const y = clientY - containerRect.top;
    const lastDropZoneThreshold = 80;
    if (y > containerRect.height - lastDropZoneThreshold) return children.length;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      const mid = rect.top - containerRect.top + rect.height / 2;
      if (y < mid) return i;
    }
    return children.length;
  }

  /**
   * Extract external payload from DataTransfer (image file, json html, text key)
   */
  parseExternalPayload(dt?: DataTransfer | null): ExternalDropPayload {
    if (!dt) return { type: 'unknown' };
    const files = dt.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) return { type: 'file-image', file };
    }
    const json = dt.getData('application/json');
    if (json) {
      try {
        const data = JSON.parse(json) as { content?: string };
        if (data?.content) return { type: 'html-json', html: data.content };
      } catch {}
    }
    const key = dt.getData('text/plain');
    if (key) return { type: 'text-key', key };
    return { type: 'unknown' };
  }
}
