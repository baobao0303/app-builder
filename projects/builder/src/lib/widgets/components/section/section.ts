import { Component, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-section',
  standalone: true,
  template: `
    <section class="section dz-section" #host>
      <div class="section-inner" #child></div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .section {
        padding: 16px;
        border: 1px dashed #cbd5e1;
        background: #f8fafc;
        min-height: 100px;
        position: relative;
        width: 100%;
        box-sizing: border-box;
        transition: all 0.2s;
      }
      .section.dz-selected {
        border: 2px solid #60a5fa;
        background: #f0f9ff;
      }
      .section.drag-over {
        border-color: #60a5fa;
        background: #dbeafe;
      }
      .section-inner {
        width: 100%;
        position: relative;
      }
    `,
  ],
})
export class SectionComponent {
  @ViewChild('child', { read: ViewContainerRef, static: true }) private childVcr!: ViewContainerRef;
  @ViewChild('host', { static: true }) hostEl!: ElementRef<HTMLElement>;

  getChildContainer(): ViewContainerRef {
    return this.childVcr;
  }
}
