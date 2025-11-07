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
  selector: 'app-floating-toolbar-edit-heading',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="floating-toolbar" [style.left.px]="left" [style.top.px]="top">
      <div class="toolbar-content">
        <span class="toolbar-label">{{ label }}</span>
        <div class="toolbar-actions">
          <button class="toolbar-btn" (click)="actitonAI()" title="Edit">
            <i class="pi pi-pencil"></i>
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
        padding: 3.5px 7px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        gap: 0;
      }

      .toolbar-label {
        color: white;
        font-size: 14px;
        font-weight: normal;
        white-space: nowrap;
      }

      .toolbar-actions {
        display: flex;
        align-items: center;
        gap: 0;
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

      .toolbar-btn.disabled,
      .toolbar-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }

      .toolbar-btn i {
        font-size: 16px;
        display: block;
      }
    `,
  ],
})
export class FloatingToolbarEditHeadingComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() targetElement?: HTMLElement;
  @Input() label = 'Element';
  @Input() canMoveUp = true;
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

    // Position toolbar ở dưới bên trái của element
    this.top = rect.bottom + scrollTop + 4; // 4px margin từ bottom
    this.left = rect.left + scrollLeft; // Align với left edge
  }

  onAction(action: string): void {
    this.action.emit(action);
  }

  actitonAI(): void {
    this.action.emit('ai');
  }
}
