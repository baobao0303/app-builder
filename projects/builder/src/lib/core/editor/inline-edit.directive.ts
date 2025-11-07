import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { TraitManagerService } from '../trait-manager/trait-manager.service';

@Directive({
  selector: '[appInlineEdit]',
  standalone: true,
})
export class InlineEditDirective implements OnInit, OnDestroy {
  @Input() editable = true;
  private isEditing = false;
  private originalText = '';
  private leftIndicator?: HTMLElement;
  private rightIndicator?: HTMLElement;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private traitManager: TraitManagerService
  ) {}

  ngOnInit(): void {
    if (this.isTextualElement() && this.editable) {
      this.setupEditable();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private isTextualElement(): boolean {
    const tag = this.el.nativeElement.tagName.toLowerCase();
    return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'].includes(tag);
  }

  private setupEditable(): void {
    // Thêm corner indicator div ở góc trên bên phải
    this.createCornerIndicator();

    // Enable contenteditable khi được select
    this.el.nativeElement.style.cursor = 'text';
  }

  private createCornerIndicator(): void {
    // Đảm bảo parent có position relative
    const computedStyle = window.getComputedStyle(this.el.nativeElement);
    if (computedStyle.position === 'static') {
      this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    }

    // Tạo indicator ở góc trái
    const leftIndicator = this.renderer.createElement('div');
    this.renderer.addClass(leftIndicator, 'inline-edit-indicator');
    this.renderer.addClass(leftIndicator, 'inline-edit-indicator-left');
    this.renderer.setStyle(leftIndicator, 'position', 'absolute');
    this.renderer.setStyle(leftIndicator, 'top', '0');
    this.renderer.setStyle(leftIndicator, 'left', '0');
    this.renderer.setStyle(leftIndicator, 'width', '8px');
    this.renderer.setStyle(leftIndicator, 'height', '8px');
    this.renderer.setStyle(leftIndicator, 'background', '#3b82f6');
    this.renderer.setStyle(leftIndicator, 'border-radius', '2px');
    this.renderer.setStyle(leftIndicator, 'z-index', '1000');
    this.renderer.setStyle(leftIndicator, 'pointer-events', 'none');
    this.renderer.setStyle(leftIndicator, 'opacity', '0');
    this.renderer.setStyle(leftIndicator, 'transition', 'opacity 0.2s');

    // Tạo indicator ở góc phải
    const rightIndicator = this.renderer.createElement('div');
    this.renderer.addClass(rightIndicator, 'inline-edit-indicator');
    this.renderer.addClass(rightIndicator, 'inline-edit-indicator-right');
    this.renderer.setStyle(rightIndicator, 'position', 'absolute');
    this.renderer.setStyle(rightIndicator, 'top', '0');
    this.renderer.setStyle(rightIndicator, 'right', '0');
    this.renderer.setStyle(rightIndicator, 'width', '8px');
    this.renderer.setStyle(rightIndicator, 'height', '8px');
    this.renderer.setStyle(rightIndicator, 'background', '#3b82f6');
    this.renderer.setStyle(rightIndicator, 'border-radius', '2px');
    this.renderer.setStyle(rightIndicator, 'z-index', '1000');
    this.renderer.setStyle(rightIndicator, 'pointer-events', 'none');
    this.renderer.setStyle(rightIndicator, 'opacity', '0');
    this.renderer.setStyle(rightIndicator, 'transition', 'opacity 0.2s');

    this.renderer.appendChild(this.el.nativeElement, leftIndicator);
    this.renderer.appendChild(this.el.nativeElement, rightIndicator);
    this.leftIndicator = leftIndicator;
    this.rightIndicator = rightIndicator;
  }

  @HostListener('click', ['$event'])
  onElementClick(event: MouseEvent): void {
    if (!this.editable || !this.isTextualElement()) return;
    if (event.target === this.el.nativeElement) {
      event.stopPropagation();
      this.startEditing();
    }
  }

  @HostListener('focus', ['$event'])
  onFocus(event: FocusEvent): void {
    if (this.isEditing) {
      this.showIndicator();
    }
  }

  @HostListener('blur', ['$event'])
  onBlur(event: FocusEvent): void {
    if (this.isEditing) {
      this.stopEditing();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isEditing) return;

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.stopEditing();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEditing();
    }
  }

  private startEditing(): void {
    if (this.isEditing) return;

    this.isEditing = true;
    this.originalText = this.el.nativeElement.textContent || '';

    this.renderer.setAttribute(this.el.nativeElement, 'contenteditable', 'true');
    this.renderer.setStyle(this.el.nativeElement, 'outline', '2px dashed #3b82f6');
    this.renderer.setStyle(this.el.nativeElement, 'outline-offset', '2px');
    this.renderer.setStyle(this.el.nativeElement, 'min-height', '1em');

    this.showIndicator();

    // Focus và select text
    setTimeout(() => {
      this.el.nativeElement.focus();
      const range = document.createRange();
      range.selectNodeContents(this.el.nativeElement);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }, 0);
  }

  private stopEditing(): void {
    if (!this.isEditing) return;

    this.isEditing = false;
    const newText = this.el.nativeElement.textContent || '';

    // Cập nhật vào trait manager
    this.traitManager.updateAttribute('textContent', newText);

    this.cleanupEditing();
  }

  private cancelEditing(): void {
    if (!this.isEditing) return;

    this.isEditing = false;
    // Khôi phục text gốc
    this.el.nativeElement.textContent = this.originalText;

    this.cleanupEditing();
  }

  private cleanupEditing(): void {
    this.renderer.removeAttribute(this.el.nativeElement, 'contenteditable');
    this.renderer.removeStyle(this.el.nativeElement, 'outline');
    this.renderer.removeStyle(this.el.nativeElement, 'outline-offset');
    this.renderer.removeStyle(this.el.nativeElement, 'min-height');

    this.hideIndicator();
    this.el.nativeElement.blur();
  }

  private showIndicator(): void {
    if (this.leftIndicator) {
      this.renderer.setStyle(this.leftIndicator, 'opacity', '1');
    }
    if (this.rightIndicator) {
      this.renderer.setStyle(this.rightIndicator, 'opacity', '1');
    }
  }

  private hideIndicator(): void {
    if (this.leftIndicator) {
      this.renderer.setStyle(this.leftIndicator, 'opacity', '0');
    }
    if (this.rightIndicator) {
      this.renderer.setStyle(this.rightIndicator, 'opacity', '0');
    }
  }

  private cleanup(): void {
    if (this.leftIndicator) {
      this.renderer.removeChild(this.el.nativeElement, this.leftIndicator);
      this.leftIndicator = undefined;
    }
    if (this.rightIndicator) {
      this.renderer.removeChild(this.el.nativeElement, this.rightIndicator);
      this.rightIndicator = undefined;
    }
  }
}
