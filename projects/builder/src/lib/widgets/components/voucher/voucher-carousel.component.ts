import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { VoucherComponent } from './voucher.component';

@Component({
  selector: 'app-voucher-carousel',
  standalone: true,
  imports: [CommonModule, CarouselModule, VoucherComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="vcw-root" [style.width.px]="containerWidth || null">
      <p-carousel
        [value]="items"
        [numVisible]="getVisibleItemsCount()"
        [numScroll]="getVisibleItemsCount()"
        [circular]="false"
        [showIndicators]="true"
        [showNavigators]="true"
        [responsiveOptions]="responsiveOptions"
        class="vcw-carousel"
      >
        <ng-template let-item pTemplate="item">
          <div class="vcw-item">
            <app-voucher
              [title]="item.title"
              [subTitle]="item.subTitle"
              [dateRange]="item.dateRange"
              [buttonText]="item.buttonText"
            ></app-voucher>
          </div>
        </ng-template>
      </p-carousel>
    </div>
  `,
  styles: [
    `
      .vcw-root {
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        min-width: 0 !important;
      }

      /* Override PrimeNG Carousel CSS để giữ nguyên style */
      .vcw-carousel {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        min-width: 0 !important;
      }

      .vcw-carousel ::ng-deep .p-carousel {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        min-width: 0 !important;
      }

      .vcw-carousel ::ng-deep .p-carousel-container {
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        min-width: 0 !important;
      }

      .vcw-carousel ::ng-deep .p-carousel-content {
        display: flex !important;
        gap: 12px !important;
        width: max-content !important;
        box-sizing: border-box !important;
      }

      .vcw-carousel ::ng-deep .p-carousel-items-container {
        width: 100% !important;
        max-width: 100% !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
      }

      .vcw-carousel ::ng-deep .p-carousel-item {
        flex: 0 0 auto !important;
        width: 340px !important;
        max-width: 340px !important;
        min-width: 0 !important;
        box-sizing: border-box !important;
      }

      .vcw-item {
        width: 340px;
        max-width: 340px;
        box-sizing: border-box;
      }

      /* Override nút điều hướng của PrimeNG */
      .vcw-carousel ::ng-deep .p-carousel-prev,
      .vcw-carousel ::ng-deep .p-carousel-next {
        background: #111827 !important;
        color: #fff !important;
        border: none !important;
        border-radius: 999px !important;
        width: 28px !important;
        height: 28px !important;
        opacity: 0.8 !important;
        z-index: 10 !important;
      }

      .vcw-carousel ::ng-deep .p-carousel-prev:hover,
      .vcw-carousel ::ng-deep .p-carousel-next:hover {
        opacity: 1 !important;
      }

      .vcw-carousel ::ng-deep .p-carousel-prev:disabled,
      .vcw-carousel ::ng-deep .p-carousel-next:disabled {
        opacity: 0.3 !important;
        cursor: not-allowed !important;
      }

      /* Override dots của PrimeNG */
      .vcw-carousel ::ng-deep .p-carousel-indicators {
        display: flex !important;
        justify-content: center !important;
        gap: 8px !important;
        padding: 8px 0 !important;
      }

      .vcw-carousel ::ng-deep .p-carousel-indicator button {
        width: 8px !important;
        height: 8px !important;
        border-radius: 999px !important;
        background: #d1d5db !important;
        border: none !important;
        padding: 0 !important;
      }

      .vcw-carousel ::ng-deep .p-carousel-indicator.p-highlight button {
        background: #6b7280 !important;
      }
    `,
  ],
})
export class VoucherCarouselComponent {
  @Input() gap = 12;
  @Input() cardWidth = 340; // 单张卡片宽度
  @Input() containerWidth?: number; // Width cố định của container (nếu không có thì dùng 100%)
  @Input() items: Array<{
    title: string;
    subTitle: string;
    dateRange: string;
    buttonText: string;
  }> = [
    {
      title: 'Giảm 12%',
      subTitle: 'tối đa 150.000đ đơn từ 699.000đ',
      dateRange: '31/10 - 30/11',
      buttonText: 'Lưu',
    },
    {
      title: 'Giảm 10%',
      subTitle: 'tối đa 100.000đ đơn từ 699.000đ',
      dateRange: '31/10 - 30/11',
      buttonText: 'Lưu',
    },
    {
      title: 'Giảm 30K',
      subTitle: 'đơn từ 99.000đ',
      dateRange: '31/10 - 30/11',
      buttonText: 'Lưu',
    },
    { title: '50K', subTitle: 'đơn từ 299.000đ', dateRange: '31/10 - 30/11', buttonText: 'Lưu' },
    {
      title: 'Giảm 15%',
      subTitle: 'tối đa 200.000đ đơn từ 899.000đ',
      dateRange: '01/11 - 30/11',
      buttonText: 'Lưu',
    },
    {
      title: 'Giảm 20K',
      subTitle: 'đơn từ 149.000đ',
      dateRange: '01/11 - 30/11',
      buttonText: 'Lưu',
    },
    {
      title: 'Giảm 8%',
      subTitle: 'tối đa 80.000đ đơn từ 599.000đ',
      dateRange: '01/11 - 30/11',
      buttonText: 'Lưu',
    },
    {
      title: 'Giảm 25K',
      subTitle: 'đơn từ 199.000đ',
      dateRange: '01/11 - 30/11',
      buttonText: 'Lưu',
    },
    {
      title: 'Giảm 18%',
      subTitle: 'tối đa 180.000đ đơn từ 799.000đ',
      dateRange: '01/11 - 30/11',
      buttonText: 'Lưu',
    },
    {
      title: 'Giảm 40K',
      subTitle: 'đơn từ 399.000đ',
      dateRange: '01/11 - 30/11',
      buttonText: 'Lưu',
    },
  ];

  // Tính số items có thể hiển thị trong container
  getVisibleItemsCount(): number {
    if (this.containerWidth) {
      const itemFullWidth = this.cardWidth + this.gap;
      const count = Math.floor((this.containerWidth + this.gap) / itemFullWidth);
      return Math.max(1, count);
    }
    // Nếu không có containerWidth, tính dựa trên viewport (sẽ được tính động bởi PrimeNG)
    return 3; // Default
  }

  // Responsive options cho PrimeNG Carousel
  responsiveOptions = [
    {
      breakpoint: '1400px',
      numVisible: 4,
      numScroll: 4,
    },
    {
      breakpoint: '1200px',
      numVisible: 3,
      numScroll: 3,
    },
    {
      breakpoint: '992px',
      numVisible: 2,
      numScroll: 2,
    },
    {
      breakpoint: '768px',
      numVisible: 1,
      numScroll: 1,
    },
  ];
}
