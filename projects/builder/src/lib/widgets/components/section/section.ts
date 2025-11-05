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
    .section { padding: 16px; border: 1px dashed #cbd5e1; background: #f8fafc; }
    .section-inner { min-height: 24px; }
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


