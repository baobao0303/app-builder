import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CodeManagerService } from '../../../core/code-manager/code-manager.service';

@Component({
  selector: 'app-download-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './download-modal.component.html',
  styleUrls: ['./download-modal.component.scss'],
})
export class DownloadModalComponent {
  @Output() close = new EventEmitter<void>();

  downloadOptions = {
    html: true,
    css: true,
    js: false, // Default to false as there's no JS editor yet
  };

  constructor(private codeManager: CodeManagerService) {}

  onDownload(): void {
    const { html, css, js } = this.downloadOptions;

    if (html && css && !js) {
      this.codeManager.downloadHtml();
    } else {
      if (html) {
        this.codeManager.downloadHtml({ css: '' }); // Download HTML without CSS
      }
      if (css) {
        this.codeManager.downloadCss();
      }
      if (js) {
        // Implement JS download when available
        console.log('JS download not implemented yet');
      }
    }

    this.close.emit();
  }

  onClose(): void {
    this.close.emit();
  }
}
