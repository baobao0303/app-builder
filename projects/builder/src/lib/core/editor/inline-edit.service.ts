import { Injectable } from '@angular/core';
import { TraitManagerService } from '../trait-manager/trait-manager.service';
import { UndoManagerService, EditTextCommand } from '../undo-manager/undo-manager.service';
import { ComponentModelService } from '../dom-components/component-model.service';

interface CornerIndicators {
  left: HTMLElement;
  right: HTMLElement;
}

@Injectable({
  providedIn: 'root',
})
export class InlineEditService {
  private editingElement: HTMLElement | null = null;
  private cornerIndicators = new Map<HTMLElement, CornerIndicators>();

  constructor(
    private traitManager: TraitManagerService,
    private undoManager: UndoManagerService,
    private componentModelService: ComponentModelService
  ) {}

  /**
   * Apply inline edit functionality to an element
   */
  applyToElement(element: HTMLElement): void {
    if (!this.isTextualElement(element)) return;

    // Tạo corner indicator
    this.createCornerIndicator(element);

    // Thêm event listeners
    element.addEventListener('click', this.createClickHandler(element));
    element.style.cursor = 'text';
  }

  /**
   * Remove inline edit functionality from an element
   */
  removeFromElement(element: HTMLElement): void {
    this.removeCornerIndicators(element);
    element.style.cursor = '';
  }

  private isTextualElement(element: HTMLElement): boolean {
    const tag = element.tagName.toLowerCase();
    return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'].includes(tag);
  }

  private createCornerIndicator(element: HTMLElement): void {
    if (this.cornerIndicators.has(element)) return;

    // Đảm bảo parent có position relative
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.position === 'static') {
      element.style.position = 'relative';
    }

    // Tạo indicator ở góc trái
    const leftIndicator = document.createElement('div');
    leftIndicator.className = 'inline-edit-indicator inline-edit-indicator-left';
    Object.assign(leftIndicator.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '8px',
      height: '8px',
      background: '#3b82f6',
      borderRadius: '2px',
      zIndex: '1000',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.2s',
    });

    // Tạo indicator ở góc phải
    const rightIndicator = document.createElement('div');
    rightIndicator.className = 'inline-edit-indicator inline-edit-indicator-right';
    Object.assign(rightIndicator.style, {
      position: 'absolute',
      top: '0',
      right: '0',
      width: '8px',
      height: '8px',
      background: '#3b82f6',
      borderRadius: '2px',
      zIndex: '1000',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.2s',
    });

    element.appendChild(leftIndicator);
    element.appendChild(rightIndicator);
    this.cornerIndicators.set(element, { left: leftIndicator, right: rightIndicator });
  }

  private removeCornerIndicators(element: HTMLElement): void {
    const indicators = this.cornerIndicators.get(element);
    if (indicators) {
      if (indicators.left.parentNode) {
        indicators.left.parentNode.removeChild(indicators.left);
      }
      if (indicators.right.parentNode) {
        indicators.right.parentNode.removeChild(indicators.right);
      }
      this.cornerIndicators.delete(element);
    }
  }

  private createClickHandler(element: HTMLElement): (e: MouseEvent) => void {
    return (e: MouseEvent) => {
      // Allow editing when clicking on the element itself or its text content
      const target = e.target as HTMLElement;
      if (target === element || target.parentElement === element || element.contains(target)) {
        // Don't stop propagation immediately - let select() be called first
        // Use setTimeout to allow select() to complete
        setTimeout(() => {
          this.startEditing(element);
        }, 100);
      }
    };
  }

  private startEditing(element: HTMLElement): void {
    if (this.editingElement === element && element.contentEditable === 'true') return;

    // Stop editing cho element trước đó
    if (this.editingElement && this.editingElement !== element) {
      this.stopEditing(this.editingElement);
    }

    this.editingElement = element;
    const originalText = element.textContent || '';
    (element as any).__originalText = originalText;

    element.contentEditable = 'true';
    element.style.outline = '2px dashed #3b82f6';
    element.style.outlineOffset = '2px';
    element.style.minHeight = '1em';

    this.showIndicator(element);

    // Blur handler
    const onBlur = () => {
      this.stopEditing(element);
      element.removeEventListener('blur', onBlur);
      element.removeEventListener('keydown', onKeyDown);
    };

    // Keydown handler
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.stopEditing(element);
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelEditing(element);
      }
    };

    element.addEventListener('blur', onBlur);
    element.addEventListener('keydown', onKeyDown);

    // Focus và select text
    setTimeout(() => {
      element.focus();
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }, 0);
  }

  private stopEditing(element: HTMLElement): void {
    if (this.editingElement !== element) return;

    const newText = element.textContent || '';
    const originalText = (element as any).__originalText || '';
    
    // Only create undo command if text actually changed
    if (newText !== originalText) {
      // Try to find component ID from element attributes
      const componentId = element.getAttribute('data-component-id') || 
                         element.closest('[data-component-id]')?.getAttribute('data-component-id');
      
      if (componentId) {
        const editCommand = new EditTextCommand(
          this.componentModelService,
          componentId,
          originalText,
          newText,
          element
        );
        
        this.undoManager.execute(editCommand, { label: 'Edit Text' });
      }
    }
    
    this.traitManager.updateAttribute('textContent', newText);

    this.cleanupEditing(element);
    this.editingElement = null;
  }

  private cancelEditing(element: HTMLElement): void {
    if (this.editingElement !== element) return;

    const originalText = (element as any).__originalText || '';
    element.textContent = originalText;

    this.cleanupEditing(element);
    this.editingElement = null;
  }

  private cleanupEditing(element: HTMLElement): void {
    element.contentEditable = 'false';
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.minHeight = '';
    this.hideIndicator(element);
    element.blur();
  }

  private showIndicator(element: HTMLElement): void {
    const indicators = this.cornerIndicators.get(element);
    if (indicators) {
      indicators.left.style.opacity = '1';
      indicators.right.style.opacity = '1';
    }
  }

  private hideIndicator(element: HTMLElement): void {
    const indicators = this.cornerIndicators.get(element);
    if (indicators) {
      indicators.left.style.opacity = '0';
      indicators.right.style.opacity = '0';
    }
  }
}
