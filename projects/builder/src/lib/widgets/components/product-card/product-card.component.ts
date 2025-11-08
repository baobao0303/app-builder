import { Component, Input, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageSelectModalComponent } from '../../modals/image-select-modal/image-select-modal.component';
import { ModalService } from 'builder';
import { DiscountBadgeComponent } from '../discount-badge/discount-badge.component';
import { RatingComponent } from '../rating/rating.component';
import { PriceDisplayComponent } from '../price-display/price-display.component';
import { AddToCartButtonComponent } from '../add-to-cart-button/add-to-cart-button.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    DiscountBadgeComponent,
    RatingComponent,
    PriceDisplayComponent,
    AddToCartButtonComponent,
  ],
  template: `
    <div class="product-card" #host>
      <div class="product-image-wrapper">
        @if (imageSrc) {
        <img [src]="imageSrc" [alt]="title" class="product-image" />
        } @else {
        <div class="image-placeholder" (click)="openImageSelect()">
          <div class="placeholder-icon">📷</div>
          <div class="placeholder-text">Click to select image</div>
        </div>
        } @if (discountPercent) {
        <app-discount-badge
          [text]="discountPercent + '%'"
          position="top-left"
          backgroundColor="#ef4444"
        ></app-discount-badge>
        }
      </div>
      <div class="product-content">
        <div class="product-title">{{ title }}</div>
        <app-rating [rating]="rating" [salesCount]="salesCount"></app-rating>
        <div class="product-price-row">
          <app-price-display
            [currentPrice]="currentPrice"
            [originalPrice]="originalPrice"
            [discountPercent]="discountPercent"
            [currency]="currency"
          ></app-price-display>
          <app-add-to-cart-button (addToCart)="onAddToCart()"></app-add-to-cart-button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .product-card {
        border: 1px solid #ef4444;
        border-radius: 8px;
        overflow: hidden;
        background: #ffffff;
        transition: all 0.2s;
        width: 100%;
        box-sizing: border-box;
      }
      .product-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
      .product-image-wrapper {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        overflow: hidden;
        background: #f9fafb;
      }
      .product-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .image-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #f3f4f6;
        cursor: pointer;
        color: #6b7280;
      }
      .placeholder-icon {
        font-size: 48px;
        margin-bottom: 8px;
      }
      .placeholder-text {
        font-size: 12px;
      }
      .product-content {
        padding: 12px;
      }
      .product-title {
        font-size: 14px;
        font-weight: 500;
        color: #111827;
        margin: 0 0 8px 0;
        line-height: 1.4;
        min-height: 40px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .product-price-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 8px;
      }
      @media (max-width: 767px) {
        .product-card {
          max-width: 100%;
        }
      }
      @media (min-width: 768px) {
        .product-card {
          max-width: 300px;
        }
      }
    `,
  ],
})
export class ProductCardComponent {
  @ViewChild('host', { static: true }) hostEl!: ElementRef<HTMLElement>;

  private modal = inject(ModalService);

  @Input() imageSrc: string | null = null;
  @Input() title: string = 'Product Title';
  @Input() rating: number = 5;
  @Input() salesCount: string = 'Đã bán 500+';
  @Input() currentPrice: number = 174500;
  @Input() originalPrice: number | null = null;
  @Input() discountPercent: number | null = 50;
  @Input() currency: string = '₫';

  openImageSelect(): void {
    this.modal.open({
      title: 'Select Product Image',
      contentComponent: ImageSelectModalComponent,
      data: {
        currentImage: this.imageSrc,
        onSelect: (image: string, name: string) => {
          this.imageSrc = image;
        },
      },
      closeOnBackdrop: true,
    });
  }

  onAddToCart(): void {
    console.log('Add to cart:', this.title);
  }
}
