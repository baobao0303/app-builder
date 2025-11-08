import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetManagerService, Asset } from '../asset-manager.service';

@Component({
  selector: 'app-asset-manager-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asset-manager-modal.component.html',
  styleUrls: ['./asset-manager-modal.component.scss'],
})
export class AssetManagerModalComponent {
  @Output() selectAsset = new EventEmitter<Asset>();
  @Output() closeModal = new EventEmitter<void>();

  private assetManager = inject(AssetManagerService);
  assets: Asset[] = [];

  constructor() {
    this.assetManager.assets$.subscribe(assets => {
      this.assets = assets;
    });
  }

  onSelectAsset(asset: Asset): void {
    this.selectAsset.emit(asset);
  }

  onClose(): void {
    this.closeModal.emit();
  }

  triggerFileInput(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = (event: any) => this.handleFileUpload(event);
    input.click();
  }

  handleFileUpload(event: any): void {
    const files = event.target.files;
    if (!files) return;

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const newAsset: Omit<Asset, 'id'> = {
          name: file.name,
          src: e.target.result,
          type: file.type.startsWith('image') ? 'image' : 'video',
        };
        this.assetManager.addAsset(newAsset);
      };
      reader.readAsDataURL(file);
    }
  }
}

