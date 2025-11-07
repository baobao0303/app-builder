import { Injectable } from '@angular/core';
import { ComponentModelService } from '../../core/dom-components/component-model.service';
import { TraitModel, TraitDefinition } from './model/trait.model';

/**
 * Trait Manager Service - Angular version
 */
@Injectable({
  providedIn: 'root',
})
export class TraitManagerService {
  private traits: TraitModel[] = [];
  private selectedTarget: any = null;

  // Groups of mutually exclusive utility classes to toggle
  private classGroups: Record<string, RegExp> = {
    fontSizeClass: /^text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|\[.*\])$/,
    fontFamilyClass: /^font-(?:sans|serif|mono)$/,
    fontWeightClass: /^font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
    textColorClass: /^text-(?:[a-z]+-\d{3}|\[.*\])$/,
    bgColorClass: /^bg-(?:[a-z]+-\d{3}|\[.*\])$/,
    lineHeightClass: /^leading-(?:none|tight|snug|normal|relaxed|loose|\[.*\])$/,
    letterSpacingClass: /^tracking-(?:tighter|tight|normal|wide|wider|widest|\[.*\])$/,
    textTransformClass: /^(?:uppercase|lowercase|capitalize|normal-case)$/,
    textAlignClass: /^text-(?:left|center|right|justify)$/,
  };

  /**
   * Add trait
   */
  addTrait(trait: TraitDefinition): TraitModel {
    const traitModel = new TraitModel(trait);
    this.traits.push(traitModel);
    return traitModel;
  }

  /**
   * Get trait by id
   */
  getTrait(id: string): TraitModel | null {
    return this.traits.find((t) => t.getId() === id) || null;
  }

  /**
   * Get all traits
   */
  getTraits(): TraitModel[] {
    return [...this.traits];
  }

  /**
   * Update trait
   */
  updateTrait(id: string, props: Partial<TraitDefinition>): boolean {
    const trait = this.getTrait(id);
    if (!trait) return false;

    if (props.value !== undefined) trait.setValue(props.value);
    // TODO: Update other properties

    return true;
  }

  /**
   * Remove trait
   */
  removeTrait(id: string): boolean {
    const index = this.traits.findIndex((t) => t.getId() === id);
    if (index >= 0) {
      this.traits.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Set selected target (component để edit traits)
   */
  constructor(private componentModelService: ComponentModelService) {}

  select(target: any): void {
    this.selectedTarget = target;
  }

  /**
   * Get selected target
   */
  getSelected(): any {
    return this.selectedTarget;
  }

  /**
   * Update attribute on selected target
   */
  updateAttribute(name: string, value: any): void {
    if (!this.selectedTarget) return;
    // Apply attribute directly on HTMLElement style or attributes
    const target: any = this.selectedTarget;

    // Debug log for flexDirection
    if (name === 'flexDirection') {
      console.log('[TraitManager] Updating flexDirection:', {
        value,
        targetTagName: target.tagName,
        targetClassName: target.className,
        hasRowInner: !!target.querySelector('.row-inner'),
      });
    }
    if (target instanceof HTMLElement) {
      // Content editing for text nodes
      if (name === 'textContent') {
        target.textContent = String(value ?? '');
        return;
      }

      // Toggle utility class groups
      if (name in this.classGroups) {
        const reg = this.classGroups[name];
        const classes = target.className.split(/\s+/).filter(Boolean);
        const filtered = classes.filter((c: string) => !reg.test(c));
        const next = String(value || '').trim();
        if (next) filtered.push(next);
        target.className = filtered.join(' ');
        // Apply inline fallback for better immediacy/robustness
        switch (name) {
          case 'textAlignClass': {
            const map: Record<string, any> = {
              'text-left': 'left',
              'text-center': 'center',
              'text-right': 'right',
              'text-justify': 'justify',
              '': '',
            };
            (target.style as any).textAlign = map[next] ?? '';
            break;
          }
          case 'textTransformClass': {
            const map: Record<string, any> = {
              uppercase: 'uppercase',
              lowercase: 'lowercase',
              capitalize: 'capitalize',
              'normal-case': 'none',
              '': '',
            };
            (target.style as any).textTransform = map[next] ?? '';
            break;
          }
          case 'lineHeightClass': {
            const lhMap: Record<string, string> = {
              'leading-none': '1',
              'leading-tight': '1.25',
              'leading-snug': '1.375',
              'leading-normal': '1.5',
              'leading-relaxed': '1.625',
              'leading-loose': '2',
              '': '',
            };
            let v = lhMap[next] ?? '';
            const m = next.match(/^leading-\[(.+)\]$/);
            if (m) v = m[1];
            (target.style as any).lineHeight = v;
            break;
          }
          case 'fontSizeClass': {
            const fsMap: Record<string, string> = {
              'text-xs': '0.75rem',
              'text-sm': '0.875rem',
              'text-base': '1rem',
              'text-lg': '1.125rem',
              'text-xl': '1.25rem',
              'text-2xl': '1.5rem',
              'text-3xl': '1.875rem',
              'text-4xl': '2.25rem',
              '': '',
            };
            let v = fsMap[next] ?? '';
            const m = next.match(/^text-\[(.+)\]$/);
            if (m) v = m[1];
            (target.style as any).fontSize = v;
            break;
          }
          case 'fontFamilyClass': {
            const famMap: Record<string, string> = {
              'font-sans':
                'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
              'font-serif': 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
              'font-mono':
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              '': '',
            };
            (target.style as any).fontFamily = famMap[next] ?? '';
            break;
          }
          case 'fontWeightClass': {
            const fwMap: Record<string, string> = {
              'font-thin': '100',
              'font-extralight': '200',
              'font-light': '300',
              'font-normal': '400',
              'font-medium': '500',
              'font-semibold': '600',
              'font-bold': '700',
              'font-extrabold': '800',
              'font-black': '900',
              '': '',
            };
            (target.style as any).fontWeight = fwMap[next] ?? '';
            break;
          }
          case 'letterSpacingClass': {
            const lsMap: Record<string, string> = {
              'tracking-tighter': '-0.05em',
              'tracking-tight': '-0.025em',
              'tracking-normal': '0',
              'tracking-wide': '0.025em',
              'tracking-wider': '0.05em',
              'tracking-widest': '0.1em',
              '': '',
            };
            let v = lsMap[next] ?? '';
            const m = next.match(/^tracking-\[(.+)\]$/);
            if (m) v = m[1];
            (target.style as any).letterSpacing = v;
            break;
          }
        }
        return;
      }
      // Special handling for flexDirection on row components
      // Instead of setting style, toggle class between row/column
      if (name === 'flexDirection') {
        // Helper function to find the container div (row.dz-row or column.dz-column)
        const findContainerDiv = (element: HTMLElement): HTMLElement | null => {
          // If target is app-row, find .row.dz-row or .column.dz-column inside it
          if (element.tagName?.toLowerCase() === 'app-row') {
            const container = element.querySelector(
              '.row.dz-row, .column.dz-column, .dz-row, .dz-column'
            ) as HTMLElement | null;
            return container;
          }
          // If target itself is the container
          if (
            element.classList.contains('row') ||
            element.classList.contains('dz-row') ||
            element.classList.contains('column') ||
            element.classList.contains('dz-column')
          ) {
            return element;
          }
          return null;
        };

        // Helper function to toggle classes between row and column
        const toggleRowColumnClass = (container: HTMLElement, direction: string): void => {
          const isColumn = direction === 'column' || direction === 'column-reverse';
          const isRow = direction === 'row' || direction === 'row-reverse' || !direction;

          if (isColumn) {
            // Change from row to column
            container.classList.remove('row', 'dz-row');
            container.classList.add('column', 'dz-column');
            console.log('[TraitManager] Changed class from row.dz-row to column.dz-column');
          } else if (isRow) {
            // Change from column to row
            container.classList.remove('column', 'dz-column');
            container.classList.add('row', 'dz-row');
            console.log('[TraitManager] Changed class from column.dz-column to row.dz-row');
          }

          // Apply flex-direction and gap directly to container (.column.dz-column or .row.dz-row)
          container.style.setProperty('display', 'flex', 'important');
          container.style.setProperty('flex-direction', String(direction || 'row'), 'important');
          container.style.setProperty('gap', '16px', 'important');
          container.offsetHeight; // Force reflow
        };

        // Priority 1: If target is app-row, find container div inside it
        if (target.tagName?.toLowerCase() === 'app-row') {
          const container = findContainerDiv(target);
          if (container) {
            console.log('[TraitManager] Toggling class for container (app-row):', value, container);
            toggleRowColumnClass(container, value);
            return;
          }
        }

        // Priority 2: If target is the container div itself
        const container = findContainerDiv(target);
        if (container) {
          console.log('[TraitManager] Toggling class for container (direct):', value, container);
          toggleRowColumnClass(container, value);
          return;
        }

        // Priority 3: Check parent elements for app-row
        let currentParent = target.parentElement;
        let depth = 0;
        while (currentParent && depth < 10) {
          if (currentParent.tagName?.toLowerCase() === 'app-row') {
            const parentContainer = findContainerDiv(currentParent);
            if (parentContainer) {
              console.log(
                '[TraitManager] Toggling class for container (in parent app-row):',
                value,
                parentContainer
              );
              toggleRowColumnClass(parentContainer, value);
              return;
            }
          }
          currentParent = currentParent.parentElement;
          depth++;
        }

        // Fallback: Apply flex-direction style directly to target
        console.warn(
          '[TraitManager] Could not find container div, applying flexDirection style to target:',
          target
        );
        (target.style as any).flexDirection = String(value || 'row');
        return;
      }

      // Common mappings
      const styleMap: Record<string, string> = {
        display: 'display',
        width: 'width',
        height: 'height',
        minWidth: 'minWidth',
        minHeight: 'minHeight',
        maxWidth: 'maxWidth',
        maxHeight: 'maxHeight',
        color: 'color',
        backgroundColor: 'backgroundColor',
        padding: 'padding',
        gap: 'gap',
        justifyContent: 'justifyContent',
        alignItems: 'alignItems',
        flexWrap: 'flexWrap',
      };

      if (name in styleMap) {
        const cssProp = styleMap[name];
        let nextVal: any = value;
        if (cssProp === 'color' || cssProp === 'backgroundColor') {
          nextVal = this.normalizeColorValue(value);
        }
        (target.style as any)[cssProp] = String(nextVal ?? '');
        return;
      }

      if (name === 'textShadow') {
        target.style.textShadow = String(value || '');
        return;
      }

      // Fallback to attribute set (e.g., id, class)
      if (name === 'id') {
        const oldId = target.id || '';
        const nextId = String(value || '');
        // Update DOM
        target.id = nextId;
        // Sync to model service
        this.componentModelService.updateComponentId(oldId, nextId);
        return;
      }
      if (name === 'class') {
        target.className = String(value || '');
        return;
      }
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.traits = [];
    this.selectedTarget = null;
  }

  private normalizeColorValue(value: any): string {
    if (value == null) return '';
    if (typeof value === 'string') {
      const v = value.trim();
      // hex 3 or 6 without '#'
      const m = v.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
      if (m) return `#${m[1]}`;
      // rgb/rgba string passthrough
      if (/^rgba?\(/i.test(v)) return v;
      return v;
    }
    // object {r,g,b,a?}
    const r = (value as any).r;
    const g = (value as any).g;
    const b = (value as any).b;
    const a = (value as any).a;
    if ([r, g, b].every((x) => typeof x === 'number')) {
      if (typeof a === 'number') return `rgba(${r}, ${g}, ${b}, ${a})`;
      return `rgb(${r}, ${g}, ${b})`;
    }
    return String(value);
  }
}
