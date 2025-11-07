import { Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-heading',
  standalone: true,
  template: ` <h1 class="dz-heading text-xl font-serif font-bold">Heading</h1> `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .dz-heading {
        color: #111827;
        margin: 0;
        border: 1px dashed transparent;
        cursor: text;
      }
    `,
  ],
})
export class HeadingComponent {
  @ViewChild('host', { static: true }) hostEl!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    this.hostEl.nativeElement.addEventListener('click', () => {
      this.hostEl.nativeElement.focus();
    });
  }
}
