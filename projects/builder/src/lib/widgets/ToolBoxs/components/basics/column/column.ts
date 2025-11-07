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
      }
      .column[style*='width'] {
        flex: none;
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
