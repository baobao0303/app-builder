import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraitManagerService } from './trait-manager.service';
import { TraitModel } from './model/trait.model';

/**
 * Trait Manager Panel Component
 * UI để hiển thị và chỉnh sửa component attributes/traits
 */
@Component({
  selector: 'app-trait-manager-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trait-manager-panel">
      <h3>Trait Manager</h3>
      @for (trait of traits; track trait.getId()) {
        <div class="trait">
          <label>{{ trait.getLabel() }}</label>
          @if (trait.getType() === 'select' && trait.getOptions()) {
            <select (change)="updateTrait(trait, $event)">
              @for (opt of trait.getOptions(); track opt.value) {
                <option [value]="opt.value" [selected]="opt.value === trait.getValue()">
                  {{ opt.label }}
                </option>
              }
            </select>
          } @else if (trait.getType() === 'checkbox') {
            <input 
              type="checkbox" 
              [checked]="trait.getValue()"
              (change)="updateTrait(trait, $event)"
            />
          } @else {
            <input 
              [type]="trait.getType()" 
              [value]="trait.getValue()"
              (input)="updateTrait(trait, $event)"
            />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .trait-manager-panel {
      padding: 10px;
      max-height: 500px;
      overflow-y: auto;
    }
    .trait {
      margin-bottom: 10px;
    }
    .trait label {
      display: block;
      margin-bottom: 4px;
    }
    .trait input,
    .trait select {
      width: 100%;
      padding: 4px;
    }
  `],
})
export class TraitManagerPanelComponent {
  traits: TraitModel[] = [];

  constructor(private traitManager: TraitManagerService) {
    this.traits = this.traitManager.getTraits();
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
}

