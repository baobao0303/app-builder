import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../modal/modal.service';

@Component({
  selector: 'app-image-source-trait',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-source-trait.component.html',
  styleUrls: ['./image-source-trait.component.scss'],
})
export class ImageSourceTraitComponent {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  private modalService = inject(ModalService);

  async openAssetManager(): Promise<void> {
    try {
      const asset = await this.modalService.openAssetManager();
      if (asset && asset.src) {
        this.value = asset.src;
        this.valueChange.emit(this.value);
      }
    } catch (error) {
      // Modal was likely closed without selection
      console.log('Asset manager closed without selection.');
    }
  }
}

