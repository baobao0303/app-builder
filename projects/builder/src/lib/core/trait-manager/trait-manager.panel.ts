import { Component } from '@angular/core';
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
export class TraitManagerPanelComponent {
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
}
