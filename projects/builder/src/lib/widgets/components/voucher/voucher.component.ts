import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-voucher',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="voucher-card">
      <!-- Left section -->
      <div class="voucher-left">
        <div class="voucher-badge">{{ badge }}</div>
        <img [src]="logoUrl" alt="logo" class="voucher-logo" />
        <div class="voucher-left-desc">{{ leftDesc }}</div>
      </div>

      <!-- Right section -->
      <div class="voucher-right">
        <div class="voucher-title">{{ title }}</div>
        <div class="voucher-subtitle">{{ subTitle }}</div>

        <div class="voucher-footer">
          <div class="voucher-date">Thời hạn:<br />{{ dateRange }}</div>
          <button class="voucher-btn">{{ buttonText }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .voucher-card {
        display: flex;
        border: 1px solid #d9d9d9;
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
        width: 320px;
        margin: 8px;
        box-shadow: 0 0 3px rgba(0, 0, 0, 0.05);
      }

      .voucher-left {
        position: relative;
        width: 112px;
        text-align: center;
        border-right: 1.5px dashed #f5c0d4;
        background-color: #fff;
      }

      .voucher-badge {
        background: #ff6400;
        color: #fff;
        font-size: 10px;
        font-weight: 500;
        padding: 2px 6px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .voucher-logo {
        border: 1px solid #d9d9d9;
        border-radius: 50%;
        width: 54px;
        height: 54px;
        margin: 8px auto;
        object-fit: contain;
      }

      .voucher-left-desc {
        font-size: 12px;
        color: #333;
        line-height: 1.3;
        width: 80%;
        margin: 0 auto 8px;
      }

      .voucher-right {
        flex: 1;
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .voucher-title {
        color: #ec4899;
        font-size: 16px;
        font-weight: 700;
      }

      .voucher-subtitle {
        color: #ec4899;
        font-size: 13px;
        margin-bottom: 6px;
      }

      .voucher-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
        color: #636363;
      }

      .voucher-btn {
        background: #f21e78;
        color: #fff;
        border: none;
        border-radius: 50px;
        min-width: 80px;
        height: 30px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
      }
    `,
  ],
})
export class VoucherComponent {
  @Input() badge = 'Chỉ Online';
  @Input() logoUrl = 'https://cdn1.concung.com/img/voucher_logo.png?v=1761108356';
  @Input() leftDesc = 'Trừ sữa dưới 2T';
  @Input() title = 'Giảm 12%';
  @Input() subTitle = 'tối đa 150.000đ đơn từ 699.000đ';
  @Input() dateRange = '31/10 - 30/11';
  @Input() buttonText = 'Lưu';
}
