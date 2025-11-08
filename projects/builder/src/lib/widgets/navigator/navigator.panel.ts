import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentModel } from '../../core/dom-components/model/component.model';
import { NavigatorNodeComponent } from './navigator-node.component';

/**
 * Navigator Panel Component
 * Hiển thị cấu trúc component tree (layers)
 */
@Component({
  selector: 'app-navigator-panel',
  standalone: true,
  imports: [CommonModule, NavigatorNodeComponent],
  template: `
    <div class="navigator-panel">
      <h3>Layers</h3>
      @if (rootComponent) {
      <div class="tree">
        <app-navigator-node
          [component]="rootComponent"
          [level]="0"
          (select)="onSelect($event)"
        ></app-navigator-node>
      </div>
      } @else {
      <div class="empty">No components</div>
      }
    </div>
  `,
  styles: [
    `
      .navigator-panel {
        padding: 0;
        height: 100%;
        overflow-y: auto;
      }
      .navigator-panel h3 {
        display: none; /* Hide title as it's in floating panel header */
      }
      .tree {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        padding: 8px;
      }
      .empty {
        padding: 20px;
        text-align: center;
        color: #666;
      }
    `,
  ],
})
export class NavigatorPanelComponent {
  @Input() rootComponent?: ComponentModel;
  @Output() componentSelect = new EventEmitter<ComponentModel>();

  onSelect(component: ComponentModel): void {
    this.componentSelect.emit(component);
  }
}
