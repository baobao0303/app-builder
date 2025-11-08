import {
  Component,
  ElementRef,
  ViewChild,
  ViewContainerRef,
  AfterViewInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [CommonModule, PaginationComponent],
  template: `
    <div class="product-carousel" #host>
      <button
        class="carousel-nav-button carousel-prev"
        (click)="goToPrevious()"
        type="button"
        aria-label="Previous"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <div class="carousel-viewport" #viewport>
        <div class="carousel-track" #track>
          <ng-container #child></ng-container>
        </div>
      </div>
      <button
        class="carousel-nav-button carousel-next"
        (click)="goToNext()"
        type="button"
        aria-label="Next"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
      <div class="carousel-pagination-wrapper">
        <app-pagination
          [totalPages]="totalPages"
          [currentPage]="currentPage"
          (pageChange)="goToPage($event)"
        ></app-pagination>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .product-carousel {
        position: relative;
        width: 100%;
      }
      .carousel-nav-button {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 10;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        color: #374151;
      }
      .carousel-nav-button:hover:not(.disabled) {
        background: #f9fafb;
        border-color: #d1d5db;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-50%) scale(1.05);
      }
      .carousel-nav-button:active:not(.disabled) {
        transform: translateY(-50%) scale(0.95);
      }
      .carousel-nav-button.disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .carousel-prev {
        left: 8px;
      }
      .carousel-next {
        right: 8px;
      }
      @media (max-width: 767px) {
        .carousel-nav-button {
          width: 32px;
          height: 32px;
        }
        .carousel-prev {
          left: 4px;
        }
        .carousel-next {
          right: 4px;
        }
        .carousel-nav-button svg {
          width: 20px;
          height: 20px;
        }
      }
      .carousel-viewport {
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        scroll-behavior: smooth;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .carousel-viewport::-webkit-scrollbar {
        display: none;
      }
      .carousel-track {
        display: flex;
        gap: 16px;
        width: fit-content;
        padding: 8px 0;
      }
      .carousel-track > * {
        scroll-snap-align: start;
        flex-shrink: 0;
      }
      /* Mobile: 1-2 items */
      @media (max-width: 767px) {
        .carousel-track > * {
          width: calc(50% - 8px);
          min-width: calc(50% - 8px);
        }
      }
      /* Tablet: 2-3 items */
      @media (min-width: 768px) and (max-width: 1023px) {
        .carousel-track > * {
          width: calc(33.333% - 11px);
          min-width: calc(33.333% - 11px);
        }
      }
      /* Desktop: 3-4 items */
      @media (min-width: 1024px) {
        .carousel-track > * {
          width: calc(25% - 12px);
          min-width: calc(25% - 12px);
        }
      }
      .carousel-pagination-wrapper {
        display: flex;
        justify-content: center;
        margin-top: 16px;
      }
    `,
  ],
})
export class ProductCarouselComponent implements AfterViewInit, OnDestroy {
  @ViewChild('child', { read: ViewContainerRef, static: true })
  private childVcr!: ViewContainerRef;
  @ViewChild('host', { static: true }) hostEl!: ElementRef<HTMLElement>;
  @ViewChild('viewport', { static: false }) viewportEl!: ElementRef<HTMLElement>;
  @ViewChild('track', { static: false }) trackEl!: ElementRef<HTMLElement>;

  currentPage: number = 1;
  totalPages: number = 1;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private scrollTimeout?: number;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updatePagination();
      this.setupScrollListener();
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }

  getChildContainer(): ViewContainerRef {
    return this.childVcr;
  }

  private setupScrollListener(): void {
    if (!this.viewportEl) return;
    const viewport = this.viewportEl.nativeElement;
    viewport.addEventListener('scroll', () => {
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      this.scrollTimeout = window.setTimeout(() => {
        this.updateCurrentPage();
        this.updatePagination();
      }, 100);
    });
  }

  private updateCurrentPage(): void {
    if (!this.viewportEl || !this.trackEl) return;
    const viewport = this.viewportEl.nativeElement;
    const track = this.trackEl.nativeElement;
    const scrollLeft = viewport.scrollLeft;
    const itemWidth = this.getItemWidth();
    const gap = 16;
    const page = Math.round(scrollLeft / (itemWidth + gap)) + 1;
    if (page !== this.currentPage) {
      this.currentPage = page;
    }
  }

  private getItemWidth(): number {
    if (!this.trackEl) return 300;
    // Get first actual child element (skip ng-container)
    const children = Array.from(this.trackEl.nativeElement.children) as HTMLElement[];
    const firstChild = children.find((el) => el.offsetWidth > 0);
    if (!firstChild) return 300;
    return firstChild.offsetWidth;
  }

  private updatePagination(): void {
    if (!this.viewportEl || !this.trackEl) return;
    const viewport = this.viewportEl.nativeElement;
    const track = this.trackEl.nativeElement;
    // Count actual child elements (excluding ng-container)
    const children = Array.from(track.children) as HTMLElement[];
    const actualChildren = children.filter((el) => el.offsetWidth > 0);
    const itemsPerPage = this.getItemsPerPage();
    const totalItems = actualChildren.length;
    this.totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  goToPage(page: number): void {
    if (!this.viewportEl || !this.trackEl) return;
    const viewport = this.viewportEl.nativeElement;
    const track = this.trackEl.nativeElement;
    const itemWidth = this.getItemWidth();
    const gap = 16;
    const itemsPerPage = this.getItemsPerPage();
    // Calculate scroll position: (page - 1) * items per page * (item width + gap)
    const scrollPosition = (page - 1) * itemsPerPage * (itemWidth + gap);
    viewport.scrollTo({
      left: scrollPosition,
      behavior: 'smooth',
    });
    this.currentPage = page;
  }

  goToPrevious(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    } else {
      // Loop to last page if at first page
      this.goToPage(this.totalPages);
    }
  }

  goToNext(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    } else {
      // Loop to first page if at last page
      this.goToPage(1);
    }
  }

  private getItemsPerPage(): number {
    if (!this.viewportEl) return 1;
    const viewportWidth = this.viewportEl.nativeElement.clientWidth;
    if (viewportWidth < 768) return 2;
    if (viewportWidth < 1024) return 3;
    return 4;
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    // Allow native scroll
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;

    // Only handle horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - go to previous page
        if (this.currentPage > 1) {
          this.goToPage(this.currentPage - 1);
        }
      } else {
        // Swipe left - go to next page
        if (this.currentPage < this.totalPages) {
          this.goToPage(this.currentPage + 1);
        }
      }
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (!this.viewportEl) return;
    this.isDragging = true;
    this.dragStartX = event.clientX - this.viewportEl.nativeElement.scrollLeft;
    event.preventDefault();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.viewportEl) return;
    const x = event.clientX - this.dragStartX;
    this.viewportEl.nativeElement.scrollLeft = x;
  }

  @HostListener('mouseup')
  @HostListener('mouseleave')
  onMouseUp(): void {
    this.isDragging = false;
  }
}

