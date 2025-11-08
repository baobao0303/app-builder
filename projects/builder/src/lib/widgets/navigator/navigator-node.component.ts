import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentModel } from '../../core/dom-components/model/component.model';

/**
 * Navigator Node Component
 * Component đệ quy để hiển thị tree node
 */
@Component({
  selector: 'app-navigator-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="node" [class.selected]="isSelected" (click)="onClick()">
      <span class="toggle" (click)="toggleExpanded($event)">
        @if (hasChildren) {
          {{ expanded ? '▼' : '▶' }}
        } @else {
          &nbsp;&nbsp;
        }
      </span>
      <span class="tag">{{ getDisplayName() }}</span>
      <span class="id">#{{ component.getId() }}</span>
    </div>
    @if (hasChildren && expanded) {
      <div class="children">
        @for (child of component.getComponents(); track child.getId()) {
          <app-navigator-node 
            [component]="child" 
            [level]="level + 1"
            (select)="onSelect($event)"
          ></app-navigator-node>
        }
      </div>
    }
  `,
  styles: [`
    .node {
      padding: 4px 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .node:hover {
      background: #f5f5f5;
    }
    .node.selected {
      background: #e3f2fd;
    }
    .toggle {
      width: 16px;
      display: inline-block;
      text-align: center;
    }
    .tag {
      color: #1976d2;
      font-weight: bold;
    }
    .id {
      color: #666;
      font-size: 10px;
    }
    .children {
      margin-left: 20px;
    }
  `],
})
export class NavigatorNodeComponent {
  @Input() component!: ComponentModel;
  @Input() level: number = 0;
  @Input() isSelected: boolean = false;
  @Output() select = new EventEmitter<ComponentModel>();
  expanded: boolean = true;

  get hasChildren(): boolean {
    return this.component.getComponents().length > 0;
  }

  toggleExpanded(event: Event): void {
    event.stopPropagation();
    this.expanded = !this.expanded;
  }

  onClick(): void {
    this.onSelect(this.component);
  }

  onSelect(component: ComponentModel): void {
    this.select.emit(component);
  }

  getDisplayName(): string {
    // Root component (level 0) should display as "Page"
    if (this.level === 0) {
      return 'Page';
    }
    return this.component.getTagName();
  }
}

