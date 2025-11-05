import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-canvas-widget',
  standalone: true,
  template: `
    <div #host style="min-width: 200px; min-height: 120px;">
      <!-- Placeholder: bên ngoài có thể truyền init để mount canvas thực -->
    </div>
  `,
})
export class CanvasWidget implements AfterViewInit {
  @ViewChild('host', { static: true }) private host!: ElementRef<HTMLElement>;

  // Hàm khởi tạo canvas thực tế từ thư viện ngoài, ví dụ (el) => init(el)
  @Input() init?: (host: HTMLElement) => void;

  ngAfterViewInit(): void {
    if (this.init) {
      this.init(this.host.nativeElement);
    }
  }
}


