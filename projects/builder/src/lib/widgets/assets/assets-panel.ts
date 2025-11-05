import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetManagerService, AssetItem } from '../../core/asset-manager/asset-manager.service';

@Component({
  selector: 'builder-assets-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './assets-panel.html',
  styleUrl: './assets-panel.scss',
})
export class AssetsPanelComponent {
  private assets = inject(AssetManagerService);

  protected get list(): AssetItem[] {
    return this.assets.getAssets();
  }

  protected onFileChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      const item: AssetItem = {
        id: `${Date.now()}-${file.name}`,
        type: file.type.startsWith('image') ? 'image' : 'file',
        src,
        sizeBytes: file.size,
        name: file.name,
      };
      this.assets.add(item);
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  protected remove(id: string): void {
    this.assets.remove(id);
  }
}


