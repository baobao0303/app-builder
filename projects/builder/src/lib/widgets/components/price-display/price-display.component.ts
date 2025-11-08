import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-price-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="price-container">
      <div class="price-row">
        <span class="current-price">{{ formatPrice(currentPrice) }}</span>
        @if (discountPercent) {
        <span class="discount-tag">-{{ discountPercent }}%</span>
        }
      </div>
      @if (originalPrice && originalPrice > currentPrice) {
      <div class="original-price-row">
        <span class="original-price">{{ formatPrice(originalPrice) }}</span>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .price-container {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .price-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .current-price {
        font-size: 18px;
        font-weight: 700;
        color: #111827;
      }
      .discount-tag {
        background-color: #ef4444;
        color: #ffffff;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .original-price-row {
        display: flex;
        align-items: center;
      }
      .original-price {
        font-size: 14px;
        color: #9ca3af;
        text-decoration: line-through;
      }
    `,
  ],
})
export class PriceDisplayComponent {
  @Input() currentPrice: number = 0;
  @Input() originalPrice: number | null = null;
  @Input() discountPercent: number | null = null;
  @Input() currency: string = '₫';

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + this.currency;
  }
}

