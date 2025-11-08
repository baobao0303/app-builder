import { Directive, ElementRef, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTabTooltip]',
  standalone: true,
})
export class TabTooltipDirective implements OnInit, OnDestroy {
  @Input('appTabTooltip') tooltipText: string = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'right';

  private tooltipElement?: HTMLElement;
  private showTimeout?: number;
  private hideTimeout?: number;
  private mouseEnterHandler?: () => void;
  private mouseLeaveHandler?: () => void;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private setupEventListeners(): void {
    const element = this.el.nativeElement;

    this.mouseEnterHandler = () => {
      // Clear any pending hide
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = undefined;
      }

      // Show tooltip after a short delay
      this.showTimeout = window.setTimeout(() => {
        this.showTooltip();
      }, 300);
    };

    this.mouseLeaveHandler = () => {
      // Clear any pending show
      if (this.showTimeout) {
        clearTimeout(this.showTimeout);
        this.showTimeout = undefined;
      }

      // Hide tooltip
      this.hideTooltip();
    };

    this.renderer.listen(element, 'mouseenter', this.mouseEnterHandler);
    this.renderer.listen(element, 'mouseleave', this.mouseLeaveHandler);
  }

  private showTooltip(): void {
    if (!this.tooltipText || this.tooltipElement) return;

    const element = this.el.nativeElement;
    const rect = element.getBoundingClientRect();

    // Create tooltip element
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipElement, 'tab-tooltip');
    this.renderer.addClass(this.tooltipElement, `tooltip-${this.tooltipPosition}`);
    this.renderer.setProperty(this.tooltipElement, 'textContent', this.tooltipText);

    // Append to body
    this.renderer.appendChild(document.body, this.tooltipElement);

    // Calculate position (tooltipElement is guaranteed to exist here)
    if (!this.tooltipElement) return;
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (this.tooltipPosition) {
      case 'top':
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - 8;
        break;
      case 'right':
      default:
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + 8;
        break;
    }

    // Apply position
    this.renderer.setStyle(this.tooltipElement, 'position', 'fixed');
    this.renderer.setStyle(this.tooltipElement, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltipElement, 'left', `${left}px`);
    this.renderer.setStyle(this.tooltipElement, 'z-index', '10000');

    // Add fade-in animation
    setTimeout(() => {
      if (this.tooltipElement) {
        this.renderer.addClass(this.tooltipElement, 'tooltip-visible');
      }
    }, 10);
  }

  private hideTooltip(): void {
    if (!this.tooltipElement) return;

    // Add fade-out animation
    this.renderer.removeClass(this.tooltipElement, 'tooltip-visible');

    // Remove after animation
    this.hideTimeout = window.setTimeout(() => {
      if (this.tooltipElement) {
        this.renderer.removeChild(document.body, this.tooltipElement);
        this.tooltipElement = undefined;
      }
    }, 200);
  }

  private cleanup(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    if (this.tooltipElement) {
      this.renderer.removeChild(document.body, this.tooltipElement);
      this.tooltipElement = undefined;
    }
  }
}

