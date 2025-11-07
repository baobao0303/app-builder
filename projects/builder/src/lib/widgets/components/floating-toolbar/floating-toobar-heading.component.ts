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
  selector: 'app-floating-toolbar-heading',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      *ngIf="targetElement"
      class="floating-toolbar-heading-container"
      [style.left.px]="left"
      [style.top.px]="top"
    >
      <div class="floating-toolbar-heading">
        <button class="toolbar-btn" (click)="applyBold()" title="Bold"><strong>B</strong></button>
        <button class="toolbar-btn" (click)="applyItalic()" title="Italic"><em>I</em></button>
        <button class="toolbar-btn" (click)="applyUnderline()" title="Underline"><u>U</u></button>
        <button class="toolbar-btn" (click)="applyStrikethrough()" title="Strikethrough">
          <s>S</s>
        </button>
        <button class="toolbar-btn" title="Link"><i class="pi pi-link"></i></button>

        <select class="toolbar-select">
          <option>Font size</option>
          <option>Small</option>
          <option>Normal</option>
          <option>Large</option>
        </select>

        <button class="toolbar-btn"><i class="pi pi-tag"></i></button>
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

      .floating-toolbar-heading-container {
        position: fixed;
        z-index: 10000;
        pointer-events: auto;
        display: block;
      }

      .floating-toolbar-heading {
        display: flex;
        align-items: center;
        background: #1f1f1f;
        border: 1px solid #2d2d2d;
        border-radius: 6px;
        padding: 4px 6px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        gap: 2px;
      }

      .toolbar-btn {
        background: transparent;
        border: none;
        color: #fff;
        cursor: pointer;
        padding: 6px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }

      .toolbar-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .toolbar-btn i {
        font-size: 15px;
      }

      .toolbar-btn strong,
      .toolbar-btn em,
      .toolbar-btn u,
      .toolbar-btn s {
        font-size: 14px;
        display: block;
        line-height: 1;
      }

      .toolbar-btn strong {
        font-weight: 700;
        font-style: normal;
        text-decoration: none;
      }

      .toolbar-btn em {
        font-weight: 600;
        font-style: italic;
        text-decoration: none;
      }

      .toolbar-btn u {
        font-weight: 600;
        font-style: normal;
        text-decoration: underline;
      }

      .toolbar-btn s {
        font-weight: 600;
        font-style: normal;
        text-decoration: line-through;
      }

      .toolbar-select {
        background: #2a2a2a;
        border: 1px solid #3a3a3a;
        color: #fff;
        border-radius: 4px;
        padding: 3px 8px;
        margin: 0 4px;
        font-size: 13px;
      }

      .toolbar-select:focus {
        outline: none;
        border-color: #555;
      }
    `,
  ],
})
export class FloatingToolbarHeadingComponent implements OnInit, OnDestroy, AfterViewInit {
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

    // Position toolbar at the top-left of the element
    this.top = rect.top + scrollTop - 40; // 40px above the element
    this.left = rect.left + scrollLeft; // Align with the left edge
  }

  private applyTextStyle(command: string, value?: string): void {
    if (!this.targetElement) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Không có text được chọn, không làm gì cả
      return;
    }

    // Make element contentEditable if not already
    const wasEditable = this.targetElement.contentEditable === 'true';
    if (!wasEditable) {
      this.targetElement.contentEditable = 'true';
    }

    // Focus the element
    this.targetElement.focus();

    // Check if selection is within the target element
    const range = selection.getRangeAt(0);
    if (!this.targetElement.contains(range.commonAncestorContainer)) {
      // Selection is not within target element, restore and return
      if (!wasEditable) {
        this.targetElement.contentEditable = 'false';
      }
      return;
    }

    // Map command to tag name
    const tagMap: Record<string, string> = {
      bold: 'strong',
      italic: 'em',
      underline: 'u',
      strikeThrough: 's',
    };

    const tagName = tagMap[command];
    if (!tagName) {
      // Try execCommand for other commands
      try {
        document.execCommand(command, false, value);
      } catch (e) {
        console.error('Error executing command:', e);
      }
    } else {
      // Check if selection is already wrapped in the tag
      const isAlreadyWrapped = this.isSelectionWrappedInTag(range, tagName);

      if (isAlreadyWrapped) {
        // Remove the tag (toggle off)
        this.unwrapSelection(range, tagName);
      } else {
        // Apply the tag (toggle on)
        this.wrapSelection(range, tagName);
      }
    }

    // Restore contentEditable state if it wasn't editable before
    if (!wasEditable) {
      this.targetElement.contentEditable = 'false';
    }

    // Emit action event
    this.action.emit(command);
  }

  private isSelectionWrappedInTag(range: Range, tagName: string): boolean {
    let node: Node | null = range.commonAncestorContainer;

    // If the node is a text node, check its parent
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    // Check if the node or any of its parents is the tag we're looking for
    while (node && node !== this.targetElement) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName.toLowerCase() === tagName) {
          return true;
        }
      }
      node = node.parentElement;
    }

    return false;
  }

  private wrapSelection(range: Range, tagName: string): void {
    try {
      // Check if selection is collapsed (no text selected)
      if (range.collapsed) {
        return;
      }

      // Check if the entire selection is already wrapped
      let startContainer = range.startContainer;
      let endContainer = range.endContainer;

      // If containers are text nodes, get their parents
      if (startContainer.nodeType === Node.TEXT_NODE) {
        startContainer = startContainer.parentElement || startContainer;
      }
      if (endContainer.nodeType === Node.TEXT_NODE) {
        endContainer = endContainer.parentElement || endContainer;
      }

      // Check if both are within the same tag
      if (
        startContainer === endContainer &&
        startContainer.nodeType === Node.ELEMENT_NODE &&
        (startContainer as HTMLElement).tagName.toLowerCase() === tagName
      ) {
        // Already wrapped, unwrap instead
        this.unwrapSelection(range, tagName);
        return;
      }

      // Extract and wrap the contents
      const contents = range.extractContents();
      const wrapper = document.createElement(tagName);
      wrapper.appendChild(contents);
      range.insertNode(wrapper);

      // Update selection to select the wrapped content
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(wrapper);
        selection.addRange(newRange);
      }
    } catch (e) {
      console.error('Error wrapping selection:', e);
    }
  }

  private unwrapSelection(range: Range, tagName: string): void {
    try {
      let node: Node | null = range.commonAncestorContainer;

      // If the node is a text node, check its parent
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }

      // Find the tag element
      while (node && node !== this.targetElement) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.tagName.toLowerCase() === tagName) {
            // Replace the tag with its contents
            const parent = element.parentElement;
            if (parent) {
              while (element.firstChild) {
                parent.insertBefore(element.firstChild, element);
              }
              parent.removeChild(element);
            }
            break;
          }
        }
        node = node.parentElement;
      }
    } catch (e) {
      console.error('Error unwrapping selection:', e);
    }
  }

  applyBold(): void {
    this.applyTextStyle('bold');
  }

  applyItalic(): void {
    this.applyTextStyle('italic');
  }

  applyUnderline(): void {
    this.applyTextStyle('underline');
  }

  applyStrikethrough(): void {
    this.applyTextStyle('strikeThrough');
  }
}
