import { Injectable } from '@angular/core';
import { ComponentModel } from '../dom-components/model/component.model';

export interface JsGeneratorBuildOptions {
  // Options cho JS generation
}

/**
 * JS Generator Service
 */
@Injectable({
  providedIn: 'root',
})
export class JsGeneratorService {
  /**
   * Generate JS từ component model (đơn giản hóa)
   * TODO: Tích hợp với script management sau
   */
  build(component: ComponentModel, opts: JsGeneratorBuildOptions = {}): string {
    // Đơn giản: chỉ return empty string
    // TODO: Collect scripts từ component tree
    return '';
  }
}
