import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetManagerService, Asset } from '../../core/asset-manager/asset-manager.service';

@Component({
  selector: 'builder-assets-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assets-panel.html',
  styleUrl: './assets-panel.scss',
})
export class AssetsPanelComponent {
  private assets = inject(AssetManagerService);

  protected get list(): Asset[] {
    return this.assets.getAssets();
  }

  protected onFileChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      const item: Omit<Asset, 'id'> = {
        type: file.type.startsWith('image') ? 'image' : 'video',
        src,
        name: file.name,
      };
      this.assets.addAsset(item);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  protected remove(id: string): void {
    this.assets.removeAsset(id);
  }
}


