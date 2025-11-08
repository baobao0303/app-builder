import { Component, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-column',
  standalone: true,
  template: `
    <div class="column dz-column" #host>
      <ng-container #child></ng-container>
      <div class="column-label">Column</div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .column {
        flex: 1;
        min-height: 60px;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        position: relative;
        width: 100%;
        box-sizing: border-box;
        min-width: 0;
      }
      /* Mobile: full width, stacked - force override all styles */
      @media (max-width: 767px) {
        .column {
          flex: 1 1 100% !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          margin-bottom: 16px;
          display: block;
        }
        .column:last-child {
          margin-bottom: 0;
        }
        /* Override any inline width styles */
        .column[style*='width'],
        .column[style*='Width'] {
          width: 100% !important;
          flex: 1 1 100% !important;
          max-width: 100% !important;
        }
      }
      /* Tablet and up: flex layout */
      @media (min-width: 768px) {
        .column {
          flex: 1;
        }
        .column[style*='width'] {
          flex: none;
        }
      }
      .column-label {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #64748b;
        font-size: 14px;
        font-weight: 500;
        pointer-events: none;
        z-index: 1;
      }
      @media (max-width: 767px) {
        .column-label {
          font-size: 12px;
        }
      }
    `,
  ],
})
export class ColumnComponent {
  @ViewChild('child', { read: ViewContainerRef, static: true }) private childVcr!: ViewContainerRef;
  @ViewChild('host', { static: true }) hostEl!: ElementRef<HTMLElement>;

  getChildContainer(): ViewContainerRef {
    return this.childVcr;
  }
}
