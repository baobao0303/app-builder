import { Injectable } from '@angular/core';
import { ComponentModel } from '../dom-components/model/component.model';

export interface CssGeneratorBuildOptions {
  avoidProtected?: boolean;
  keepUnusedStyles?: boolean;
}

/**
 * CSS Generator Service
 */
@Injectable({
  providedIn: 'root',
})
export class CssGeneratorService {
  /**
   * Generate CSS từ component model (đơn giản hóa)
   * TODO: Tích hợp với CSS Composer sau
   */
  build(component: ComponentModel, opts: CssGeneratorBuildOptions = {}): string {
    // Đơn giản: chỉ lấy inline styles từ component tree
    const styles: string[] = [];
    this._collectStyles(component, styles);
    return styles.join('\n');
  }

  private _collectStyles(component: ComponentModel, styles: string[]): void {
    const style = component.getStyle();
    const classes = component.getClasses();
    const id = component.getId();

    if (Object.keys(style).length > 0) {
      const selector = id ? `#${id}` : classes.length > 0 ? `.${classes[0]}` : '';
      if (selector) {
        const styleStr = Object.entries(style)
          .map(([k, v]) => `  ${k}: ${v};`)
          .join('\n');
        styles.push(`${selector} {\n${styleStr}\n}`);
      }
    }

    // Recursive
    component.getComponents().forEach(child => {
      this._collectStyles(child, styles);
    });
  }
}

