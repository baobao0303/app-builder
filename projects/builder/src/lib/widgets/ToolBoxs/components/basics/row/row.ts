import { Component, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-row',
  standalone: true,
  template: `
    <div class="row dz-row" #host>
      <ng-container #child></ng-container>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .row {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-height: 60px;
        border: 1px dashed #cbd5e1;
        background: #f8fafc;
        width: 100%;
        box-sizing: border-box;
      }
      /* Mobile: force column layout, ensure children stack */
      @media (max-width: 767px) {
        .row {
          flex-direction: column !important;
          gap: 16px;
        }
        /* Ensure all direct children (columns) are full width */
        .row > * {
          width: 100% !important;
          flex: 1 1 100% !important;
          max-width: 100% !important;
        }
      }
      /* Tablet and up: horizontal layout */
      @media (min-width: 768px) {
        .row {
          flex-direction: row;
        }
      }
      /* Desktop: maintain horizontal with gap */
      @media (min-width: 1024px) {
        .row {
          gap: 24px;
        }
      }
    `,
  ],
})
export class RowComponent {
  @ViewChild('child', { read: ViewContainerRef, static: true }) private childVcr!: ViewContainerRef;
  @ViewChild('host', { static: true }) hostEl!: ElementRef<HTMLElement>;

  getChildContainer(): ViewContainerRef {
    return this.childVcr;
  }
}
