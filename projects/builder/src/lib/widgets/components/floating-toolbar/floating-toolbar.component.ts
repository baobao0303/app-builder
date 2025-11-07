import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-floating-toolbar',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="floating-toolbar" [style.left.px]="left" [style.top.px]="top">
      <div class="toolbar-content">
        <span class="toolbar-label">{{ label }}</span>
        <div class="toolbar-actions">
          <button class="toolbar-btn" (click)="onAction('magic')" title="Magic">
            <i class="pi pi-sparkles"></i>
          </button>
          <button class="toolbar-btn" (click)="onAction('moveUp')" title="Move Up">
            <i class="pi pi-arrow-up"></i>
          </button>
          <button class="toolbar-btn" (click)="onAction('move')" title="Move">
            <i class="pi pi-arrows-alt"></i>
          </button>
          <button class="toolbar-btn" (click)="onAction('duplicate')" title="Duplicate">
            <i class="pi pi-copy"></i>
          </button>
          <button class="toolbar-btn" (click)="onAction('delete')" title="Delete">
            <i class="pi pi-trash"></i>
          </button>
          <button class="toolbar-btn" (click)="onAction('more')" title="More">
            <i class="pi pi-ellipsis-v"></i>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: fixed;
        z-index: 10000;
        pointer-events: auto;
      }

      .floating-toolbar {
        position: fixed;
        z-index: 10000;
        pointer-events: auto;
        display: block;
      }

      .toolbar-content {
        display: flex;
        align-items: center;
        background: #4285f4;
        border-radius: 8px;
        padding: 8px 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        gap: 12px;
      }

      .toolbar-label {
        color: white;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
      }

      .toolbar-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-left: 8px;
      }

      .toolbar-btn {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .toolbar-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .toolbar-btn:active {
        background: rgba(255, 255, 255, 0.3);
      }

      .toolbar-btn i {
        font-size: 16px;
        display: block;
      }
    `,
  ],
})
export class FloatingToolbarComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() targetElement?: HTMLElement;
  @Input() label = 'Element';
  @Output() action = new EventEmitter<string>();

  left = 0;
  top = 0;
  private updatePositionInterval?: number;

  ngOnInit(): void {
    this.updatePosition();
  }

  ngAfterViewInit(): void {
    // Update position periodically to follow element
    this.updatePositionInterval = window.setInterval(() => {
      this.updatePosition();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.updatePositionInterval) {
      clearInterval(this.updatePositionInterval);
    }
  }

  updatePosition(): void {
    if (!this.targetElement) return;

    const rect = this.targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Position toolbar above the element, centered horizontally
    this.top = rect.top + scrollTop - 50; // 50px above element
    this.left = rect.left + scrollLeft + rect.width / 2 - 150; // Center, assuming toolbar width ~300px
  }

  onAction(action: string): void {
    this.action.emit(action);
  }
}
