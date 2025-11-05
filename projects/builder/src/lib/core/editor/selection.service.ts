import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SelectionService {
  private selectedId: string | undefined;

  select(id: string | undefined): void {
    this.selectedId = id;
  }

  getSelectedId(): string | undefined {
    return this.selectedId;
  }
}
