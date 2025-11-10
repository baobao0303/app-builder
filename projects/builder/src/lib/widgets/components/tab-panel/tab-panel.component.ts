import { Component, Input, ViewChild, ViewContainerRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tab-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tab-panel-content" [hidden]="!active">
      <ng-content></ng-content>
      <ng-container #container></ng-container>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    .tab-panel-content {
      min-height: 150px;
      padding: 20px;
      border: 1px dashed #e2e8f0;
      border-radius: 8px;
      background-color: #f8fafc;
    }
    .tab-panel-content.drag-over {
        border-color: #60a5fa;
        background: #dbeafe;
    }
  `]
})
export class TabPanelComponent {
  @Input() tabId!: string;
  @Input() active = false;

  @ViewChild('container', { read: ViewContainerRef, static: true }) 
  private viewContainerRef!: ViewContainerRef;

  getChildContainer(): ViewContainerRef {
    return this.viewContainerRef;
  }
}


