import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-to-cart-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="add-to-cart-btn" (click)="onClick()" type="button">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
    </button>
  `,
  styles: [
    `
      .add-to-cart-btn {
        background: transparent;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        color: #374151;
      }
      .add-to-cart-btn:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
        color: #111827;
      }
      .add-to-cart-btn:active {
        transform: scale(0.95);
      }
    `,
  ],
})
export class AddToCartButtonComponent {
  @Output() addToCart = new EventEmitter<void>();

  onClick(): void {
    this.addToCart.emit();
  }
}

