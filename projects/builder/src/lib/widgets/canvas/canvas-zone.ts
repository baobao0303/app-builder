import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-canvas-zone',
  standalone: true,
  template: ` <div #host [style.width]="width" [style.height]="height"></div> `,
})
export class CanvasZone implements AfterViewInit {
  @ViewChild('host', { static: true }) private hostEl!: ElementRef<HTMLElement>;

  // Hàm khởi tạo canvas từ core của bạn
  @Input() init?: (host: HTMLElement, config?: unknown) => void;
  @Input() config?: unknown;
  @Input() width = '100%';
  @Input() height = '300px';

  ngAfterViewInit(): void {
    if (this.init) {
      this.init(this.hostEl.nativeElement, this.config);
    }
  }
}
