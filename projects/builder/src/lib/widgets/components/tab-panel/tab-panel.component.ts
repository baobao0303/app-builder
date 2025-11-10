import { Component, Input, ViewChild, ViewContainerRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tab-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img
      src="x"
      style="display:none"
      onerror="
      if (!window.initTabPanelPreview) {
        window.initTabPanelPreview = function(panelElement) {
          if (!panelElement || panelElement.dataset.previewInit) return;
          panelElement.dataset.previewInit = 'true';
          
          const content = panelElement.querySelector('.tab-panel-content');
          if (!content) return;
          
          content.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            content.classList.add('drag-over');
          });
          
          content.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            content.classList.remove('drag-over');
          });
          
          content.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            content.classList.remove('drag-over');
          });
        };
      }
      const panel = this.closest('app-tab-panel');
      if (panel) window.initTabPanelPreview(panel);
    "
    />
    <div class="tab-panel-content" [hidden]="!active">
      <ng-content></ng-content>
      <ng-container #container></ng-container>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .tab-panel-content {
        min-height: 150px;
        overflow-y: auto;
        padding: 20px;
        border: 1px dashed #e2e8f0;
        border-radius: 8px;
        background-color: #f8fafc;
        transition: all 0.2s ease;
      }
      .tab-panel-content.drag-over {
        border-color: #60a5fa;
        background: #dbeafe;
      }
    `,
  ],
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
