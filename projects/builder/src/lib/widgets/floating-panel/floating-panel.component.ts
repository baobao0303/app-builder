import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef, ElementRef, Renderer2, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-floating-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="floating-panel" #panel [style.left.px]="positionX" [style.top.px]="positionY">
      <div class="floating-panel-header" #header (mousedown)="onHeaderMouseDown($event)">
        <div class="floating-panel-title">
          <span class="drag-handle-icon">⋮⋮</span>
          <span class="title-text">{{ title }}</span>
        </div>
        <div class="floating-panel-controls">
          <button class="control-btn minimize" (click)="toggleMinimize($event)" title="Minimize">
            <span>−</span>
          </button>
          <button class="control-btn close" (click)="close($event)" title="Close">
            <span>×</span>
          </button>
        </div>
      </div>
      <div class="floating-panel-content" [class.minimized]="isMinimized">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .floating-panel {
        position: fixed;
        z-index: 1000;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        width: 320px;
        min-height: 400px;
        max-height: 600px;
        display: flex;
        flex-direction: column;
        user-select: none;
      }

      .floating-panel-header {
        background: #f8f9fa;
        border-bottom: 1px solid #e0e0e0;
        padding: 10px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
        border-radius: 4px 4px 0 0;
      }

      .floating-panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        color: #333;
        font-size: 14px;
      }

      .drag-handle-icon {
        color: #666;
        font-size: 16px;
        line-height: 1;
        cursor: move;
      }

      .title-text {
        flex: 1;
      }

      .floating-panel-controls {
        display: flex;
        gap: 4px;
      }

      .control-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #444;
        font-size: 18px;
        line-height: 1;
        transition: background-color 0.2s;
      }

      .control-btn:hover {
        background: #e0e0e0;
      }

      .control-btn.close:hover {
        background: #ff4444;
        color: #fff;
      }

      .floating-panel-content {
        flex: 1;
        overflow: auto;
        transition: max-height 0.3s ease, opacity 0.3s ease;
        background: #ffffff;
        max-height: 500px; /* Default max height */
      }

      .floating-panel-content.minimized {
        max-height: 0 !important;
        overflow: hidden;
        padding: 0;
        opacity: 0;
      }
    `,
  ],
})
export class FloatingPanelComponent implements OnInit, OnDestroy {
  @Input() title = 'Panel';
  @Input() initialX = 100;
  @Input() initialY = 100;

  positionX = 100;
  positionY = 100;
  isMinimized = false;
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  dragStartLeft = 0;
  dragStartTop = 0;

  private dragMouseMoveListener?: () => void;
  private dragMouseUpListener?: () => void;

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.positionX = this.initialX;
    this.positionY = this.initialY;
  }

  ngOnDestroy(): void {
    this.stopDragging();
  }

  onHeaderMouseDown(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('.control-btn')) {
      return; // Don't start drag if clicking on control buttons
    }

    event.preventDefault();
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.dragStartLeft = this.positionX;
    this.dragStartTop = this.positionY;

    this.dragMouseMoveListener = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.dragStartX;
        const deltaY = e.clientY - this.dragStartY;
        this.positionX = this.dragStartLeft + deltaX;
        this.positionY = this.dragStartTop + deltaY;
      }
    });

    this.dragMouseUpListener = this.renderer.listen('document', 'mouseup', () => {
      this.stopDragging();
    });
  }

  private stopDragging(): void {
    this.isDragging = false;
    if (this.dragMouseMoveListener) {
      this.dragMouseMoveListener();
      this.dragMouseMoveListener = undefined;
    }
    if (this.dragMouseUpListener) {
      this.dragMouseUpListener();
      this.dragMouseUpListener = undefined;
    }
  }

  toggleMinimize(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.isMinimized = !this.isMinimized;
    console.log('Navigator panel minimized:', this.isMinimized);
  }

  @Input() onClose?: () => void;
  @Output() closed = new EventEmitter<void>();

  close(event: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    console.log('Navigator panel close clicked', { hasOnClose: !!this.onClose });
    
    // Emit event first
    this.closed.emit();
    
    // Then call callback if provided
    if (this.onClose) {
      try {
        this.onClose();
      } catch (error) {
        console.error('Error calling onClose callback:', error);
      }
    } else {
      // Default: hide panel
      const panel = this.elementRef.nativeElement.querySelector('.floating-panel');
      if (panel) {
        panel.style.display = 'none';
      }
    }
  }
}

