import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rating-container">
      <div class="stars">
        @for (star of starsArray; track $index) {
        <span class="star" [class.filled]="star.filled">⭐</span>
        }
      </div>
      @if (salesCount) {
      <span class="sales-count">{{ salesCount }}</span>
      }
    </div>
  `,
  styles: [
    `
      .rating-container {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 8px 0;
      }
      .stars {
        display: flex;
        gap: 2px;
      }
      .star {
        font-size: 14px;
        color: #d1d5db;
        line-height: 1;
      }
      .star.filled {
        color: #fbbf24;
        filter: grayscale(0);
      }
      .star:not(.filled) {
        filter: grayscale(1) opacity(0.3);
      }
      .sales-count {
        font-size: 12px;
        color: #6b7280;
      }
    `,
  ],
})
export class RatingComponent {
  @Input() rating: number = 5;
  @Input() salesCount: string = '';
  @Input() starColor: string = '#fbbf24';

  get starsArray(): Array<{ filled: boolean }> {
    return Array.from({ length: 5 }, (_, i) => ({
      filled: i < this.rating,
    }));
  }
}

