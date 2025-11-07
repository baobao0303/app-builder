import { Component, OnInit, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ColorPickerModule } from 'primeng/colorpicker';
import { TraitManagerService } from './trait-manager.service';
import { TraitModel } from './model/trait.model';

/**
 * Trait Manager Panel Component
 * UI để hiển thị và chỉnh sửa component attributes/traits
 */
@Component({
  selector: 'app-trait-manager-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoCompleteModule, ColorPickerModule],
  templateUrl: './trait-manager.panel.html',
  styleUrls: ['./trait-manager.panel.scss'],
})
export class TraitManagerPanelComponent implements OnInit, DoCheck {
  constructor(private traitManager: TraitManagerService) {}

  get traits(): TraitModel[] {
    return this.traitManager.getTraits();
  }

  updateTrait(trait: TraitModel, event: Event): void {
    const input = event.target as HTMLInputElement | HTMLSelectElement;
    let value: any = input.value;

    if (trait.getType() === 'checkbox') {
      value = (input as HTMLInputElement).checked;
    } else if (trait.getType() === 'number') {
      value = parseFloat(value);
    }

    trait.setValue(value);
    this.traitManager.updateAttribute(trait.getName(), value);
  }

  // State selector (PrimeNG AutoComplete)
  protected stateValue: string | null = null;
  protected stateSuggestions: string[] = [];
  private readonly allStates: string[] = ['hover', 'active', 'nth-of-type(2n)'];

  protected filterStates(event: { query: string }): void {
    const q = (event?.query || '').toLowerCase();
    if (!q) {
      this.stateSuggestions = [...this.allStates];
      return;
    }
    this.stateSuggestions = this.allStates.filter((s) => s.toLowerCase().includes(q));
  }

  // New UI state bindings for Layout/Size group
  protected layoutDisplay: string = 'block';
  protected flexDirection: string = 'row';
  protected width: string = 'auto';
  protected height: string = 'auto';
  protected minWidth: string = 'auto';
  protected minHeight: string = 'auto';
  protected maxWidth: string = 'auto';
  protected maxHeight: string = 'auto';

  // Color controls
  protected color: string = '#000000';
  protected backgroundColor: string = 'transparent';

  // Attributes controls
  protected idValue: string = '';
  protected className: string = '';

  protected setStyle(name: string, value: string): void {
    this.traitManager.updateAttribute(name, value);
  }

  // Readonly helpers to know if selection exists and show current attrs
  get selected(): any {
    return this.traitManager.getSelected?.() ?? null;
  }
  get selectedId(): string {
    const el = this.selected as HTMLElement | null;
    return el ? el.id : '';
  }
  get selectedClass(): string {
    const el = this.selected as HTMLElement | null;
    return el ? el.className : '';
  }

  // Get flexDirection from selected element
  get selectedFlexDirection(): string {
    const el = this.selected as HTMLElement | null;
    if (!el) return 'row';

    // For app-row component, find .row-inner inside
    const tagName = el.tagName?.toLowerCase();
    if (tagName === 'app-row') {
      const rowInner = el.querySelector('.row-inner') as HTMLElement;
      if (rowInner) {
        return rowInner.style.flexDirection || 'row';
      }
    }

    // For row components, check .row-inner element
    if (el.classList.contains('row') || el.classList.contains('dz-row')) {
      const rowInner = el.querySelector('.row-inner') as HTMLElement;
      if (rowInner) {
        return rowInner.style.flexDirection || 'row';
      }
    }

    // Check if element contains .row-inner
    const rowInner = el.querySelector('.row-inner') as HTMLElement;
    if (rowInner) {
      return rowInner.style.flexDirection || 'row';
    }

    // Check parent element for row-inner
    let parent = el.parentElement;
    while (parent) {
      if (
        parent.tagName?.toLowerCase() === 'app-row' ||
        parent.classList.contains('row') ||
        parent.classList.contains('dz-row')
      ) {
        const parentRowInner = parent.querySelector('.row-inner') as HTMLElement;
        if (parentRowInner) {
          return parentRowInner.style.flexDirection || 'row';
        }
      }
      parent = parent.parentElement;
    }

    // For other elements, check direct style
    return el.style.flexDirection || 'row';
  }

  // Check if display is flex or if element is a row component
  get isFlexDisplay(): boolean {
    const el = this.selected as HTMLElement | null;
    if (!el) return false;

    // Check tagName for app-row component
    const tagName = el.tagName?.toLowerCase();
    if (tagName === 'app-row') {
      return true;
    }

    // Row components (dz-row, row) always use flexbox, so always show direction control
    if (
      el.classList.contains('row') ||
      el.classList.contains('dz-row') ||
      el.getAttribute('data-widget') === 'row'
    ) {
      return true;
    }

    // Check if element contains .row-inner (indicates it's a row component)
    const rowInner = el.querySelector('.row-inner');
    if (rowInner) {
      return true;
    }

    // Check parent element for row classes (in case selected element is inside a row)
    let parent = el.parentElement;
    while (parent) {
      if (
        parent.classList.contains('row') ||
        parent.classList.contains('dz-row') ||
        parent.tagName?.toLowerCase() === 'app-row' ||
        parent.getAttribute('data-widget') === 'row'
      ) {
        return true;
      }
      parent = parent.parentElement;
    }

    // Check if layoutDisplay is set to flex (from UI)
    if (this.layoutDisplay === 'flex') {
      return true;
    }

    // Also check the actual element's display
    const display = el.style.display || window.getComputedStyle(el).display;
    return display === 'flex';
  }

  // Sync values when selection changes
  ngOnInit(): void {
    // This will be called when component initializes
    // Values will be synced via getters
  }

  ngDoCheck(): void {
    // Sync flexDirection when selection changes
    if (this.selected) {
      const currentFlexDir = this.selectedFlexDirection;
      if (this.flexDirection !== currentFlexDir) {
        this.flexDirection = currentFlexDir;
      }
      const el = this.selected as HTMLElement;
      const display = el.style.display || window.getComputedStyle(el).display;
      if (this.layoutDisplay !== display) {
        this.layoutDisplay = display || 'block';
      }
    }
  }
}
