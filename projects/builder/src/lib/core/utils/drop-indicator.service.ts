import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DropIndicator {
  show: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  targetEl?: HTMLElement;
  insertIndex?: number;
}

@Injectable({ providedIn: 'root' })
export class DropIndicatorService {
  private indicatorSubject = new BehaviorSubject<DropIndicator>({ show: false });
  readonly indicator$ = this.indicatorSubject.asObservable();

  show(x: number, y: number, width: number, targetEl?: HTMLElement, insertIndex?: number): void {
    this.indicatorSubject.next({ show: true, x, y, width, height: 2, targetEl, insertIndex });
  }

  hide(): void {
    this.indicatorSubject.next({ show: false });
  }

  getIndicator(): DropIndicator {
    return this.indicatorSubject.getValue();
  }
}

