import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pagination-container">
      @for (page of pagesArray; track $index) {
      <span
        class="pagination-dot"
        [class.active]="page === currentPage"
        (click)="goToPage(page)"
      ></span>
      }
    </div>
  `,
  styles: [
    `
      .pagination-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px 0;
      }
      .pagination-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #d1d5db;
        cursor: pointer;
        transition: all 0.2s;
      }
      .pagination-dot:hover {
        background-color: #9ca3af;
        transform: scale(1.2);
      }
      .pagination-dot.active {
        background-color: #ec4899;
        width: 24px;
        border-radius: 4px;
      }
      @media (max-width: 767px) {
        .pagination-dot {
          width: 6px;
          height: 6px;
        }
        .pagination-dot.active {
          width: 20px;
        }
      }
    `,
  ],
})
export class PaginationComponent {
  @Input() totalPages: number = 1;
  @Input() currentPage: number = 1;
  @Output() pageChange = new EventEmitter<number>();

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.pageChange.emit(page);
    }
  }
}

