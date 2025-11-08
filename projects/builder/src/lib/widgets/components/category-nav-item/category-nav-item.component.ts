import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-nav-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="category-nav-item"
      [class.active]="isActive"
      (click)="onClick()"
    >
      <div class="category-icon">{{ icon }}</div>
      <div class="category-label">{{ label }}</div>
      @if (badge) {
      <div class="category-badge">{{ badge }}</div>
      }
    </div>
  `,
  styles: [
    `
      .category-nav-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 12px 16px;
        border: 2px solid transparent;
        border-radius: 8px;
        background: #ffffff;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 100px;
        text-align: center;
      }
      .category-nav-item:hover {
        background: #f9fafb;
        border-color: #e5e7eb;
      }
      .category-nav-item.active {
        background: #fef3c7;
        border-color: #ef4444;
      }
      .category-icon {
        font-size: 32px;
        margin-bottom: 8px;
        line-height: 1;
      }
      .category-label {
        font-size: 12px;
        font-weight: 500;
        color: #374151;
        text-align: center;
        line-height: 1.3;
      }
      .category-nav-item.active .category-label {
        color: #111827;
        font-weight: 600;
      }
      .category-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        background: #ef4444;
        color: #ffffff;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 4px;
        border-radius: 4px;
      }
      @media (max-width: 767px) {
        .category-nav-item {
          min-width: 80px;
          padding: 8px 12px;
        }
        .category-icon {
          font-size: 24px;
        }
        .category-label {
          font-size: 11px;
        }
      }
    `,
  ],
})
export class CategoryNavItemComponent {
  @Input() icon: string = '📦';
  @Input() label: string = 'Category';
  @Input() isActive: boolean = false;
  @Input() badge: string = '';

  onClick(): void {
    // Emit event or handle click
    console.log('Category clicked:', this.label);
  }
}

