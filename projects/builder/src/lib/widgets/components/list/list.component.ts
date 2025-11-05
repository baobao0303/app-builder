import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="list-wrapper dz-list">
      <ul class="list">
        <li class="list-item">
          <div class="list-item-content">
            <span class="list-item-text">List item 1</span>
          </div>
        </li>
        <li class="list-item">
          <div class="list-item-content">
            <span class="list-item-text">List item 2</span>
          </div>
        </li>
        <li class="list-item">
          <div class="list-item-content">
            <span class="list-item-text">List item 3</span>
          </div>
        </li>
      </ul>
    </div>
  `,
  styles: [
    `
    :host {
      display: block;
      width: 100%;
    }
    .list-wrapper {
      width: 100%;
    }
    .list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .list-item {
      padding: 12px 16px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .list-item:hover {
      background: #f9fafb;
      border-color: #d1d5db;
    }
    .list-item-content {
      display: flex;
      align-items: center;
    }
    .list-item-text {
      font-size: 14px;
      color: #374151;
      flex: 1;
    }
    `,
  ],
})
export class ListComponent {}

