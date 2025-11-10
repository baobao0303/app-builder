import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-floating-toolbar-add-tab',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="custom-floating-toolbar" [style.left.px]="left" [style.top.px]="top">
      <div class="toolbar-content">
        <div class="toolbar-actions">
          <button class="toolbar-btn" (click)="onAddClick()" title="Add New Tab">
            <i class="pi pi-plus"></i>
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
        z-index: 10001; /* Cao hơn toolbar mặc định */
        pointer-events: auto;
      }

      .custom-floating-toolbar {
        position: fixed;
        z-index: 10001;
        pointer-events: auto;
        display: block;
      }

      .toolbar-content {
        display: flex;
        align-items: center;
        background: #212529; /* Màu đen */
        border-radius: 8px;
        padding: 4px 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .toolbar-actions {
        display: flex;
        align-items: center;
      }

      .toolbar-btn {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        padding: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .toolbar-btn:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      .toolbar-btn i {
        font-size: 18px;
        font-weight: bold;
      }
    `,
  ],
})
export class FloatingToolbarAddTabComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() targetElement?: HTMLElement;
  @Output() addTab = new EventEmitter<void>();

  left = 0;
  top = 0;
  private updatePositionInterval?: number;

  ngOnInit(): void {
    this.updatePosition();
  }

  ngAfterViewInit(): void {
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

    // Định vị toolbar ở giữa, phía trên của element
    this.top = rect.top + scrollTop - 45; // 45px phía trên
    this.left = rect.left + scrollLeft + rect.width / 2 - 25; // Căn giữa toolbar (width ~50px)
  }

  onAddClick(): void {
    this.addTab.emit();
  }
}



