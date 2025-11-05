import { Injectable } from '@angular/core';
import { ComponentModel, ToHTMLOptions } from '../dom-components/model/component.model';
import { ComponentModelService } from '../dom-components/component-model.service';

export interface HTMLGeneratorBuildOptions extends ToHTMLOptions {
  cleanId?: boolean;
}

/**
 * HTML Generator Service
 */
@Injectable({
  providedIn: 'root',
})
export class HtmlGeneratorService {
  constructor(private componentModelService: ComponentModelService) {}

  /**
   * Generate HTML từ component model
   */
  build(component: ComponentModel, opts: HTMLGeneratorBuildOptions = {}): string {
    return component.toHTML(opts);
  }

  /**
   * Generate HTML từ root component
   */
  generateFromRoot(opts: HTMLGeneratorBuildOptions = {}): string {
    const root = this.componentModelService.getRootComponent();
    if (!root) return '';
    return this.build(root, opts);
  }
}
