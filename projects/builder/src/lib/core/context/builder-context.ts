import { inject, Injectable, InjectionToken, Type } from '@angular/core';

import { BlockModel } from '../../widgets/block-manager/model/block.model';
import { ComponentDefinition } from '../../core/dom-components/model/component.model';

export interface BuilderContextConfig {
  registry: Record<string, Type<unknown>>;
  componentDefinitions: Record<string, ComponentDefinition>;
  defaultBlocks: BlockModel[];
}

export const BUILDER_CONTEXT = new InjectionToken<BuilderContextConfig>('BUILDER_CONTEXT');

@Injectable({ providedIn: 'root' })
export class BuilderContextService {
  private readonly config = inject(BUILDER_CONTEXT, { optional: true });

  get registry(): Record<string, Type<unknown>> {
    return this.config?.registry ?? {};
  }

  get componentDefinitions(): Record<string, ComponentDefinition> {
    return this.config?.componentDefinitions ?? {};
  }

  get defaultBlocks(): BlockModel[] {
    return this.config?.defaultBlocks ?? [];
  }
}
