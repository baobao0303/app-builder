import { Component, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-row',
  standalone: true,
  template: `
    <div class="row dz-row" #host>
      <div class="row-inner" #child></div>
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
        gap: 8px;
        padding: 8px;
        min-height: 60px;
        border: 1px dashed #cbd5e1;
        background: #f8fafc;
        width: 100%;
        box-sizing: border-box;
      }
      .row-inner {
        display: flex;
        gap: 8px;
        width: 100%;
        min-height: 44px;
        flex: 1;
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
