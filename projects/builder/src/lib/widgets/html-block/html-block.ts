import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-html-block',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [innerHTML]="html"></div>
  `,
})
export class HtmlBlock {
  @Input() html = '';
}


