import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-discount-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="discount-badge"
      [class.badge-top-left]="position === 'top-left'"
      [class.badge-top-right]="position === 'top-right'"
      [style.background-color]="backgroundColor"
      [style.color]="textColor"
    >
      {{ text }}
    </div>
  `,
  styles: [
    `
      .discount-badge {
        position: absolute;
        top: 8px;
        left: 8px;
        background-color: #ef4444;
        color: #ffffff;
        font-size: 12px;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 4px;
        z-index: 10;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .badge-top-left {
        top: 8px;
        left: 8px;
      }
      .badge-top-right {
        top: 8px;
        right: 8px;
        left: auto;
      }
    `,
  ],
})
export class DiscountBadgeComponent {
  @Input() text: string = '50%';
  @Input() position: 'top-left' | 'top-right' = 'top-left';
  @Input() backgroundColor: string = '#ef4444';
  @Input() textColor: string = '#ffffff';
}

