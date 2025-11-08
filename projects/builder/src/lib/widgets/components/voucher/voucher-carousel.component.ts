import { Component, Input, ViewEncapsulation, ViewChild, ViewContainerRef, ElementRef, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { VoucherComponent } from './voucher.component';

@Component({
  selector: 'app-voucher-carousel',
  standalone: true,
  imports: [CommonModule, CarouselModule, VoucherComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="vcw-root dz-voucher-carousel" #host>
      <div class="vcw-carousel-inner" #child>
        <!-- Children components will be inserted here -->
      </div>
      <div class="vcw-placeholder" *ngIf="isEmpty()">
        <span class="vcw-placeholder-text">Voucher carousel</span>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        min-width: 0 !important;
      }

      .vcw-root {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        min-height: 100px;
        border: 1px dashed #cbd5e1;
        background: #f8fafc;
        box-sizing: border-box;
        position: relative;
        transition: all 0.2s;
      }

      .vcw-root.dz-selected {
        border: 2px solid #60a5fa;
        background: #f0f9ff;
      }

      .vcw-root.drag-over {
        border-color: #60a5fa;
        background: #dbeafe;
      }

      .vcw-carousel-inner {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        min-width: 0 !important;
        min-height: 60px;
        position: relative;
        box-sizing: border-box;
      }

      .vcw-placeholder {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        color: #94a3b8;
        font-size: 14px;
        font-weight: 500;
        z-index: 1;
      }

      .vcw-placeholder-text {
        display: inline-block;
      }
    `,
  ],
})
export class VoucherCarouselComponent implements AfterViewInit {
  @ViewChild('child', { read: ViewContainerRef, static: true }) private childVcr!: ViewContainerRef;
  @ViewChild('host', { static: true }) hostEl!: ElementRef<HTMLElement>;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    // Initial check
    this.cdr.detectChanges();
  }

  getChildContainer(): ViewContainerRef {
    return this.childVcr;
  }

  isEmpty(): boolean {
    // Check directly from ViewContainerRef length
    // This will be re-evaluated on each change detection cycle
    return this.childVcr?.length === 0;
  }
}
