import { Component, OnInit, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TraitManagerService } from '../trait-manager/trait-manager.service';
import { TraitModel } from '../trait-manager/model/trait.model';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-panel.component.html',
  styleUrls: ['./settings-panel.component.scss'],
})
export class SettingsPanelComponent implements OnInit, DoCheck {
  activeTab: 'content' | 'style' | 'advanced' = 'content';

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

  ngOnInit(): void {}

  ngDoCheck(): void {}
}

