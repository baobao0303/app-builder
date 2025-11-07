import { Component } from '@angular/core';

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
      }
    `,
  ],
})
export class HeadingComponent {}
