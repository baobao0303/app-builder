import { Injectable } from '@angular/core';
import { ComponentModel, ComponentDefinition } from '../dom-components/model/component.model';

/**
 * Parser Service
 * Parse HTML/CSS để import vào editor
 */
@Injectable({
  providedIn: 'root',
})
export class ParserService {
  /**
   * Parse HTML string thành ComponentDefinition
   */
  parseHtml(html: string): ComponentDefinition | null {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const body = doc.body;

      if (!body || body.children.length === 0) {
        return null;
      }

      // Parse first element
      const element = body.children[0];
      return this.parseElement(element);
    } catch (error) {
      console.error('Parse HTML failed:', error);
      return null;
    }
  }

  /**
   * Parse DOM element thành ComponentDefinition
   */
  private parseElement(element: Element): ComponentDefinition {
    const def: ComponentDefinition = {
      tagName: element.tagName.toLowerCase(),
      attributes: {},
      classes: [],
      style: {},
      components: [],
    };

    // Parse attributes
    Array.from(element.attributes).forEach(attr => {
      if (attr.name === 'class') {
        def.classes = attr.value.split(' ').filter(Boolean);
      } else if (attr.name === 'style') {
        def.style = this.parseStyle(attr.value);
      } else {
        def.attributes![attr.name] = attr.value;
      }
    });

    // Parse children
    Array.from(element.children).forEach(child => {
      const childDef = this.parseElement(child);
      def.components!.push(childDef);
    });

    // Parse text content if no children
    if (element.children.length === 0) {
      const text = element.textContent?.trim();
      if (text) {
        def.content = text;
      }
    }

    return def;
  }

  /**
   * Parse CSS string thành style object
   */
  parseStyle(styleStr: string): Record<string, string> {
    const styles: Record<string, string> = {};
    const rules = styleStr.split(';').filter(Boolean);

    rules.forEach(rule => {
      const [key, value] = rule.split(':').map(s => s.trim());
      if (key && value) {
        styles[key] = value;
      }
    });

    return styles;
  }

  /**
   * Parse CSS rules
   */
  parseCss(css: string): Array<{ selector: string; styles: Record<string, string> }> {
    const rules: Array<{ selector: string; styles: Record<string, string> }> = [];
    
    // Simple CSS parser (có thể cải thiện sau)
    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    let match;

    while ((match = ruleRegex.exec(css)) !== null) {
      const selector = match[1].trim();
      const stylesStr = match[2].trim();
      const styles = this.parseStyle(stylesStr);
      rules.push({ selector, styles });
    }

    return rules;
  }
}

