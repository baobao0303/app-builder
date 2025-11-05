import { Directive, ElementRef, HostListener, Input } from '@angular/core';

/**
 * Droppable Directive
 * Cho phép element nhận drop events
 */
@Directive({
  selector: '[appDroppable]',
  standalone: true,
})
export class DroppableDirective {
  @Input() appDroppable?: string; // drop zone identifier

  constructor(private el: ElementRef) {}

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.el.nativeElement.classList.add('drag-over');
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.el.nativeElement.classList.remove('drag-over');
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.el.nativeElement.classList.remove('drag-over');
    // TODO: Emit drop event
  }
}

