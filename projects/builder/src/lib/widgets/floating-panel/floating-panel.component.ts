import {
  Component,
  Input,
  Output,
  EventEmitter,
  ContentChild,
  TemplateRef,
  ElementRef,
  Renderer2,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-floating-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="floating-panel"
      #panel
      [style.left.px]="positionX"
      [style.top.px]="positionY"
      [class.is-dragging]="isDragging"
    >
      <div class="floating-panel-header" #header (mousedown)="onHeaderMouseDown($event)">
        <div class="floating-panel-title">
          <svg
            class="drag-handle-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 4C5.55228 4 6 4.44772 6 5C6 5.55228 5.55228 6 5 6C4.44772 6 4 5.55228 4 5C4 4.44772 4.44772 4 5 4Z"
              fill="currentColor"
            />
            <path
              d="M5 7C5.55228 7 6 7.44772 6 8C6 8.55228 5.55228 9 5 9C4.44772 9 4 8.55228 4 8C4 7.44772 4.44772 7 5 7Z"
              fill="currentColor"
            />
            <path
              d="M5 10C5.55228 10 6 10.4477 6 11C6 11.5523 5.55228 12 5 12C4.44772 12 4 11.5523 4 11C4 10.4477 4.44772 10 5 10Z"
              fill="currentColor"
            />
            <path
              d="M8 5C8 4.44772 8.44772 4 9 4C9.55228 4 10 4.44772 10 5C10 5.55228 9.55228 6 9 6C8.44772 6 8 5.55228 8 5Z"
              fill="currentColor"
            />
            <path
              d="M8 8C8 7.44772 8.44772 7 9 7C9.55228 7 10 7.44772 10 8C10 8.55228 9.55228 9 9 9C8.44772 9 8 8.55228 8 8Z"
              fill="currentColor"
            />
            <path
              d="M8 11C8 10.4477 8.44772 10 9 10C9.55228 10 10 10.4477 10 11C10 11.5523 9.55228 12 9 12C8.44772 12 8 11.5523 8 11Z"
              fill="currentColor"
            />
          </svg>
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
        max-height: 600px;
        display: flex;
        flex-direction: column;
        user-select: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .floating-panel.is-dragging {
        transition: none;
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
        transition: all 0.2s ease;
      }

      .control-btn:hover {
        background: #e0e0e0;
        transform: scale(1.1);
      }

      .control-btn.close:hover {
        background: #ff4444;
        color: #fff;
        transform: scale(1.1);
      }

      .control-btn:active {
        transform: scale(0.95);
      }

      .floating-panel-content {
        flex: 1;
        overflow: auto;
        transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        background: #ffffff;
        max-height: 500px; /* Default max height */
        min-height: 400px; /* Minimum height when expanded */
        opacity: 1;
        transform: scaleY(1);
        transform-origin: top;
      }

      .floating-panel-content.minimized {
        max-height: 0 !important;
        min-height: 0 !important;
        overflow: hidden;
        padding: 0;
        opacity: 0;
        border: none;
        transform: scaleY(0);
        margin: 0;
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

  constructor(private renderer: Renderer2, private elementRef: ElementRef) {}

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
