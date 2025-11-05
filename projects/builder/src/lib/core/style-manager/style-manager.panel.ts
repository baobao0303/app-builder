import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StyleManagerService } from './style-manager.service';
import { SectorModel, PropertyModel } from './model/sector.model';

/**
 * Style Manager Panel Component
 * UI để hiển thị và chỉnh sửa styles
 */
@Component({
  selector: 'app-style-manager-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="style-manager-panel">
      <h3>Style Manager</h3>
      @for (sector of sectors; track sector.getId()) {
        <div class="sector">
          <div class="sector-header" (click)="toggleSector(sector)">
            <span>{{ sector.getName() }}</span>
            <span>{{ sector.isOpen() ? '▼' : '▶' }}</span>
          </div>
          @if (sector.isOpen()) {
            <div class="sector-properties">
              @for (prop of sector.getProperties(); track prop.getId()) {
                <div class="property">
                  <label>{{ prop.getName() }}</label>
                  <input 
                    [type]="prop.getType()" 
                    [value]="prop.getValue()"
                    (input)="updateProperty(sector, prop, $event)"
                  />
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .style-manager-panel {
      padding: 10px;
      max-height: 500px;
      overflow-y: auto;
    }
    .sector {
      margin-bottom: 10px;
      border: 1px solid #ddd;
    }
    .sector-header {
      padding: 8px;
      background: #f5f5f5;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
    }
    .sector-properties {
      padding: 10px;
    }
    .property {
      margin-bottom: 8px;
    }
    .property label {
      display: block;
      margin-bottom: 4px;
    }
    .property input {
      width: 100%;
      padding: 4px;
    }
  `],
})
export class StyleManagerPanelComponent {
  sectors: SectorModel[] = [];

  constructor(private styleManager: StyleManagerService) {
    this.sectors = this.styleManager.getSectors();
  }

  toggleSector(sector: SectorModel): void {
    sector.setOpen(!sector.isOpen());
  }

  updateProperty(sector: SectorModel, property: PropertyModel, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = property.getType() === 'number' ? parseFloat(input.value) : input.value;
    property.setValue(value);
    this.styleManager.updateStyle(property.getProperty(), value);
  }
}

