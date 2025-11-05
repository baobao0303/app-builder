import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DropIndicatorService } from '../../core/utils/drop-indicator.service';

@Component({
  selector: 'builder-drop-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="drop-indicator"
      *ngIf="(indicator$ | async) as ind"
      [style.display]="ind.show ? 'block' : 'none'"
      [style.left.px]="ind.x ?? 0"
      [style.top.px]="ind.y ?? 0"
      [style.width.px]="ind.width ?? 0"
      [style.height.px]="ind.height ?? 2"
    ></div>
  `,
  styles: [
    `
    .drop-indicator {
      position: fixed;
      background: #10b981;
      pointer-events: none;
      z-index: 9999;
      box-shadow: 0 0 4px rgba(16, 185, 129, 0.5);
    }
    `,
  ],
})
export class DropIndicatorComponent {
  private indicator = inject(DropIndicatorService);
  indicator$ = this.indicator.indicator$;
}

