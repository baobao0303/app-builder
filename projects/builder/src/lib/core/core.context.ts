import { InjectionToken } from '@angular/core';
export type ContextType = 'page' | 'section' | 'row' | 'column' | 'widget';

export abstract class CoreContext {
  /** Returns the current context type */
  abstract getContextType(): ContextType;

  /** Returns allowed child context types for this context */
  abstract getAllowedChildren(): ContextType[];

  /** Checks if a child of given type can be added here */
  canAddItem(childType: ContextType): boolean {
    return this.getAllowedChildren().includes(childType);
  }

  /** Checks if an item at index can be removed (mặc định cho phép) */
  canRemoveItem(index: number): boolean {
    return true;
  }

  /** Checks if an item can be moved from -> to (mặc định cho phép) */
  canMoveItem(from: number, to: number): boolean {
    return true;
  }

  // Optional operations (no-op defaults) to be overridden by concrete contexts
  addItem?(child: unknown, options?: { index?: number }): void;
  removeItem?(index: number): void;
  moveItem?(from: number, to: number): void;
}

/**
 * Aggregate all contexts for use
 * Combines all specific context interfaces into one
 */
export interface CoreAggregationContext extends CoreContext {}

/**
 * Injection token for CoreAggregationContext
 */
export const CORE_CONTEXT = new InjectionToken<CoreAggregationContext>('CORE_CONTEXT');
