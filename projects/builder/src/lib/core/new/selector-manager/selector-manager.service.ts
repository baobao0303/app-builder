import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Selector Manager Service
 * Quản lý CSS selectors (classes, IDs)
 */
@Injectable({
  providedIn: 'root',
})
export class SelectorManagerService {
  private selectors: Map<string, string[]> = new Map(); // componentId -> selectors[]
  private selectedIdSubject = new BehaviorSubject<string | null>(null);

  /** Stream of currently selected component id (for outlining/highlight consumers) */
  get selected$(): Observable<string | null> {
    return this.selectedIdSubject.asObservable();
  }

  getSelectedId(): string | null {
    return this.selectedIdSubject.getValue();
  }

  /**
   * Add selector to component
   */
  addSelector(componentId: string, selector: string): void {
    const selectors = this.selectors.get(componentId) || [];
    if (!selectors.includes(selector)) {
      selectors.push(selector);
      this.selectors.set(componentId, selectors);
    }
  }

  /**
   * Remove selector from component
   */
  removeSelector(componentId: string, selector: string): void {
    const selectors = this.selectors.get(componentId) || [];
    const index = selectors.indexOf(selector);
    if (index >= 0) {
      selectors.splice(index, 1);
      this.selectors.set(componentId, selectors);
    }
  }

  /**
   * Get selectors for component
   */
  getSelectors(componentId: string): string[] {
    return [...(this.selectors.get(componentId) || [])];
  }

  /**
   * Generate CSS selector string
   */
  generateSelector(componentId: string): string {
    const selectors = this.getSelectors(componentId);
    return selectors.join('.');
  }

  /**
   * Clear selectors for component
   */
  clearSelectors(componentId: string): void {
    this.selectors.delete(componentId);
  }

  /** Select a component by id (downstream can draw selection frame) */
  select(componentId: string | null): void {
    this.selectedIdSubject.next(componentId);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.selectors.clear();
  }
}
