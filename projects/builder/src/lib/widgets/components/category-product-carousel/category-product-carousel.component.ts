import {
  Component,
  ElementRef,
  ViewChild,
  ViewContainerRef,
  ComponentRef,
  AfterViewInit,
  ChangeDetectorRef,
  inject,
  EmbeddedViewRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryNavItemComponent } from '../category-nav-item/category-nav-item.component';
import { ProductCarouselComponent } from '../product-carousel/product-carousel.component';
import { ComponentModelService } from '../../../core/dom-components/component-model.service';

export interface Category {
  id: string;
  label: string;
  icon: string;
  badge?: string;
}

@Component({
  selector: 'app-category-product-carousel',
  standalone: true,
  imports: [CommonModule, CategoryNavItemComponent, ProductCarouselComponent],
  template: `
    <div class="category-product-carousel" #host>
      <!-- Category Navigation -->
      <div class="category-nav-container">
        <div class="category-nav-scroll">
          @for (category of categories; track category.id) {
          <app-category-nav-item
            [icon]="category.icon"
            [label]="category.label"
            [badge]="category.badge || ''"
            [isActive]="activeCategoryId === category.id"
            (categoryClick)="selectCategory(category.id)"
          ></app-category-nav-item>
          }
        </div>
      </div>

      <!-- Product Carousel -->
      <div class="carousel-container">
        <app-product-carousel #productCarousel></app-product-carousel>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .category-product-carousel {
        width: 100%;
      }
      .category-nav-container {
        margin-bottom: 24px;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .category-nav-container::-webkit-scrollbar {
        display: none;
      }
      .category-nav-scroll {
        display: flex;
        gap: 12px;
        padding: 8px 0;
        min-width: fit-content;
      }
      .carousel-container {
        width: 100%;
      }
      @media (max-width: 767px) {
        .category-nav-scroll {
          gap: 8px;
        }
      }
    `,
  ],
})
export class CategoryProductCarouselComponent implements AfterViewInit {
  @ViewChild('host', { static: true }) hostEl!: ElementRef<HTMLElement>;
  @ViewChild('productCarousel', { static: false })
  productCarouselRef!: ProductCarouselComponent;

  private componentModelService = inject(ComponentModelService);

  activeCategoryId: string = '';
  // Initialize with first category to avoid ExpressionChangedAfterItHasBeenCheckedError
  categories: Category[] = [
    {
      id: 'fashion',
      label: 'Thời trang & Phụ kiện',
      icon: '👕',
    },
    {
      id: 'supplies',
      label: 'Đồ dùng mẹ & bé',
      icon: '🛒',
    },
    {
      id: 'health',
      label: 'Sức khỏe & Vitamin',
      icon: '💊',
    },
    {
      id: 'bath',
      label: 'Tắm gội cho bé',
      icon: '🛁',
    },
    {
      id: 'milk',
      label: 'Sữa nước',
      icon: '🍼',
    },
    {
      id: 'diapers',
      label: 'Bim tã, vệ sinh',
      icon: '🧷',
    },
  ];

  // Store category for each product (by component ID)
  private productCategories: Map<string, string> = new Map();

  constructor(private cdr: ChangeDetectorRef) {
    // Initialize activeCategoryId with first category in constructor
    // This avoids ExpressionChangedAfterItHasBeenCheckedError
    if (this.categories.length > 0) {
      this.activeCategoryId = this.categories[0].id;
    }
  }

  getChildContainer(): ViewContainerRef | null {
    // Return the Product Carousel's child container
    if (this.productCarouselRef) {
      return this.productCarouselRef.getChildContainer();
    }
    return null;
  }

  selectCategory(categoryId: string): void {
    if (this.activeCategoryId === categoryId) return;

    const previousCategoryId = this.activeCategoryId;
    this.activeCategoryId = categoryId;

    // Get carousel container
    const carouselContainer = this.getChildContainer();
    if (!carouselContainer) {
      console.warn('[CategoryProductCarousel] Carousel container not available');
      return;
    }

    // Show/hide products based on category
    this.filterProductsByCategory(carouselContainer, categoryId);

    this.cdr.detectChanges();
  }

  private filterProductsByCategory(container: ViewContainerRef, categoryId: string): void {
    // Get all child views in the container
    for (let i = 0; i < container.length; i++) {
      const view = container.get(i);
      if (!view) continue;

      // Try to get element from EmbeddedViewRef or ComponentRef
      let element: HTMLElement | null = null;
      if ((view as any).rootNodes && (view as any).rootNodes.length > 0) {
        element = (view as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
      } else if ((view as any).location) {
        element = (view as unknown as ComponentRef<any>).location.nativeElement;
      }
      if (!element) continue;

      // Get component ID from element
      const componentId = element.id || element.getAttribute('data-component-id');
      if (!componentId) continue;

      // Get category for this product (default to current active category if not set)
      const productCategory = this.productCategories.get(componentId) || this.activeCategoryId;

      // Show/hide based on category match
      if (productCategory === categoryId) {
        element.style.display = '';
        element.removeAttribute('data-category-hidden');
      } else {
        element.style.display = 'none';
        element.setAttribute('data-category-hidden', 'true');
      }
    }
  }

  // Call this method when a product is added to mark it with current category
  markProductWithCategory(componentId: string, categoryId?: string): void {
    const category = categoryId || this.activeCategoryId;
    this.productCategories.set(componentId, category);

    // Also set data attribute on the element
    const carouselContainer = this.getChildContainer();
    if (carouselContainer) {
      for (let i = 0; i < carouselContainer.length; i++) {
        const view = carouselContainer.get(i);
        if (!view) continue;

        // Try to get element from EmbeddedViewRef or ComponentRef
        let element: HTMLElement | null = null;
        if ((view as any).rootNodes && (view as any).rootNodes.length > 0) {
          element = (view as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
        } else if ((view as any).location) {
          element = (view as unknown as ComponentRef<any>).location.nativeElement;
        }
        if (element && (element.id === componentId || element.getAttribute('data-component-id') === componentId)) {
          element.setAttribute('data-category', category);
          // Show if matches active category
          if (category === this.activeCategoryId) {
            element.style.display = '';
            element.removeAttribute('data-category-hidden');
          } else {
            element.style.display = 'none';
            element.setAttribute('data-category-hidden', 'true');
          }
          break;
        }
      }
    }
  }

  ngAfterViewInit(): void {
    // Setup observer to mark new products with current category
    this.setupProductObserver();
  }

  private setupProductObserver(): void {
    // Use MutationObserver to detect when new products are added
    setTimeout(() => {
      const carouselContainer = this.getChildContainer();
      if (!carouselContainer) return;

      // Check periodically for new products and mark them
      const checkInterval = setInterval(() => {
        const container = this.getChildContainer();
        if (!container) {
          clearInterval(checkInterval);
          return;
        }

        for (let i = 0; i < container.length; i++) {
          const view = container.get(i);
          if (!view) continue;

          // Try to get element from EmbeddedViewRef or ComponentRef
          let element: HTMLElement | null = null;
          if ((view as any).rootNodes && (view as any).rootNodes.length > 0) {
            element = (view as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
          } else if ((view as any).location) {
            element = (view as unknown as ComponentRef<any>).location.nativeElement;
          }
          if (!element) continue;

          const componentId = element.id || element.getAttribute('data-component-id');
          if (!componentId) continue;

          // If product doesn't have category yet, mark it with current category
          if (!this.productCategories.has(componentId)) {
            this.markProductWithCategory(componentId, this.activeCategoryId);
          }
        }
      }, 500);

      // Clean up after 30 seconds (products should be added by then)
      setTimeout(() => clearInterval(checkInterval), 30000);
    }, 1000);
  }
}

