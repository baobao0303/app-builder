import { Injectable, Type } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ModalConfig<TData = any> {
  title?: string;
  contentComponent?: Type<any>;
  data?: TData;
  closeOnBackdrop?: boolean;
}

export interface ModalState<TData = any> extends ModalConfig<TData> {
  open: boolean;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private stateSubject = new BehaviorSubject<ModalState>({ open: false });
  readonly state$ = this.stateSubject.asObservable();

  open<TData = any>(config: ModalConfig<TData>): void {
    this.stateSubject.next({ ...config, open: true });
  }

  close(): void {
    this.stateSubject.next({ open: false });
  }

  getState(): ModalState | undefined {
    return this.stateSubject.getValue();
  }
}
