import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetManagerService, AssetItem } from '../../../core/asset-manager/asset-manager.service';
import { ModalService } from '../../../core/modal-dialog/modal.service';

@Component({
  selector: 'app-video-select-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="video-select-modal">
      <div class="modal-search-bar">
        <input type="text" placeholder="Search..." class="search-input" [(ngModel)]="searchQuery" />
        <select class="source-select" [(ngModel)]="selectedSource">
          <option value="project">Project assets</option>
          <option value="upload">Upload</option>
        </select>
      </div>

      <div class="modal-actions">
        <button type="button" class="action-btn" (click)="uploadVideo()">Upload</button>
        <button type="button" class="action-btn" (click)="addUrl()">Add URL</button>
      </div>

      <div class="video-grid">
        @for (asset of filteredAssets(); track asset.id) {
        <div class="video-item" (click)="selectVideo(asset)">
          <video [src]="asset.src" [poster]="asset.meta?.['poster']" class="video-thumbnail" muted>
            Your browser does not support the video tag.
          </video>
          <div class="video-actions">
            <button
              type="button"
              class="delete-btn"
              (click)="deleteVideo(asset.id); $event.stopPropagation()"
            >
              🗑️
            </button>
          </div>
          <div class="video-label">{{ asset.name }}</div>
        </div>
        } @empty {
        <div class="empty-state">
          <p>No videos available</p>
          <p class="empty-hint">Upload videos or add URLs to get started</p>
        </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .video-select-modal {
        padding: 20px;
        max-width: 800px;
        max-height: 600px;
        overflow-y: auto;
      }
      .modal-search-bar {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
      }
      .search-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }
      .source-select {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        background: white;
      }
      .modal-actions {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
      }
      .action-btn {
        padding: 8px 16px;
        background: #1976d2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }
      .action-btn:hover {
        background: #1565c0;
      }
      .video-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
      }
      .video-item {
        position: relative;
        border: 2px solid transparent;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s;
        background: #000;
      }
      .video-item:hover {
        border-color: #1976d2;
        transform: scale(1.02);
      }
      .video-thumbnail {
        width: 100%;
        height: 150px;
        object-fit: cover;
        display: block;
      }
      .video-actions {
        position: absolute;
        top: 8px;
        right: 8px;
      }
      .delete-btn {
        background: rgba(255, 255, 255, 0.9);
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 14px;
      }
      .video-label {
        padding: 8px;
        background: white;
        font-size: 12px;
        color: #666;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
      .empty-state {
        text-align: center;
        padding: 40px;
        color: #999;
      }
      .empty-hint {
        font-size: 12px;
        margin-top: 8px;
      }
    `,
  ],
})
export class VideoSelectModalComponent implements OnInit {
  private assets = inject(AssetManagerService);
  private modal = inject(ModalService);

  searchQuery: string = '';
  selectedSource: string = 'project';
  onSelect?: (video: string, name: string, poster?: string) => void;

  ngOnInit(): void {
    const state = this.modal.getState();
    if (state?.data) {
      this.onSelect = state.data.onSelect;
    }
  }

  protected getAssets(): AssetItem[] {
    return this.assets.getAssets().filter((a) => a.type === 'video');
  }

  protected filteredAssets() {
    const assets = this.getAssets();
    if (!this.searchQuery) return assets;
    const query = this.searchQuery.toLowerCase();
    return assets.filter(
      (a) => a.name?.toLowerCase().includes(query) || a.src.toLowerCase().includes(query)
    );
  }

  protected selectVideo(asset: AssetItem): void {
    if (this.onSelect) {
      this.onSelect(asset.src, asset.name || 'Video', asset.meta?.['poster']);
    } else {
      // Fallback: update modal state
      const state = this.modal.getState();
      if (state) {
        this.modal.open({
          ...state,
          data: {
            ...state.data,
            selectedVideo: asset.src,
            selectedVideoName: asset.name,
            selectedPoster: asset.meta?.['poster'],
          },
        });
      }
    }
    this.modal.close();
  }

  protected deleteVideo(id: string): void {
    if (confirm('Are you sure you want to delete this video?')) {
      this.assets.remove(id);
    }
  }

  protected uploadVideo(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result || '');
        const item: AssetItem = {
          id: `${Date.now()}-${file.name}`,
          type: 'video',
          src,
          sizeBytes: file.size,
          name: file.name,
        };
        this.assets.add(item);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  protected addUrl(): void {
    const url = prompt('Enter video URL:');
    if (!url) return;

    const posterUrl = prompt('Enter poster/thumbnail URL (optional):');

    const item: AssetItem = {
      id: `${Date.now()}-url`,
      type: 'video',
      src: url,
      name: url.split('/').pop() || 'Video from URL',
      meta: posterUrl ? { poster: posterUrl } : undefined,
    };
    this.assets.add(item);
  }
}

