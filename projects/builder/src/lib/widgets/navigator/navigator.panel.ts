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
        padding: 10px;
        max-height: 500px;
        overflow-y: auto;
      }
      .tree {
        font-family: monospace;
        font-size: 12px;
      }
      .empty {
        padding: 20px;
        text-align: center;
        color: #999;
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
