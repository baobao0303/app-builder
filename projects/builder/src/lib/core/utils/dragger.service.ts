import { Injectable } from '@angular/core';

/**
 * Dragger Service
 * Quản lý drag operations
 */
@Injectable({
  providedIn: 'root',
})
export class DraggerService {
  private draggedItem: any = null;

  /**
   * Set dragged item
   */
  setDraggedItem(item: any): void {
    this.draggedItem = item;
  }

  /**
   * Get dragged item
   */
  getDraggedItem(): any {
    return this.draggedItem;
  }

  /**
   * Clear dragged item
   */
  clear(): void {
    this.draggedItem = null;
  }
}

