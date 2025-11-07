import { Injectable, InjectionToken } from '@angular/core';
import { CoreAggregationContext, ContextType } from 'builder';

export interface ViewContext extends CoreAggregationContext {}

export const VIEW_CONTEXT = new InjectionToken<ViewContext>('VIEW_CONTEXT');

@Injectable({ providedIn: 'root' })
export class AppViewContextService implements ViewContext {
  private readonly allowedChildren: ContextType[] = ['section'];

  getContextType(): ContextType {
    return 'page';
  }

  getAllowedChildren(): ContextType[] {
    return this.allowedChildren;
  }

  canAddItem(childType: ContextType): boolean {
    return this.allowedChildren.includes(childType);
  }

  canRemoveItem(_index: number): boolean {
    return true;
  }

  canMoveItem(_from: number, _to: number): boolean {
    return true;
  }
}

