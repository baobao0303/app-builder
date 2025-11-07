import { Component } from '@angular/core';

@Component({
  selector: 'app-text',
  standalone: true,
  template: `
    <p class="dz-text">Paragraph text</p>
  `,
  styles: [
    `
      :host { display: block; width: 100%; }
      .dz-text { margin: 0; color: #374151; font-size: 0.875rem; line-height: 1.25rem; }
    `,
  ],
})
export class TextComponent {}


