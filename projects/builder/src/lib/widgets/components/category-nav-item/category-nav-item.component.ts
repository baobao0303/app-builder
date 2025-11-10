import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../core/modal-dialog/modal.service';
import { VideoSelectModalComponent } from '../../modals/video-select-modal/video-select-modal.component';

interface VideoItem {
  src: string;
  name: string;
  poster?: string;
}

@Component({
  selector: 'app-category-nav-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="vcr-container">
      <!-- Hiển thị các video đã chọn -->
      @for (video of videos; track $index) {
        <div class="category-nav-item" [class.active]="isActive" (click)="onVideoClick($index)">
          <div class="category-icon">🎥</div>
          <div class="category-label">{{ video.name }}</div>
          <div class="category-badge">{{ $index + 1 }}</div>
        </div>
      }
      
      <!-- Nút thêm video (dấu cộng) -->
      <div class="category-nav-item add-button" (click)="onAddClick($event)">
        <div class="category-icon">➕</div>
        <div class="category-label">Add Video</div>
      </div>
    </div>
  `,
  styles: [
    `
      .vcr-container {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .category-nav-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 12px 16px;
        border: 2px solid transparent;
        border-radius: 8px;
        background: #ffffff;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 100px;
        text-align: center;
      }
      .category-nav-item:hover {
        background: #f9fafb;
        border-color: #e5e7eb;
      }
      .category-nav-item.active {
        background: #fef3c7;
        border-color: #ef4444;
      }
      .category-nav-item.add-button {
        border: 2px dashed #d1d5db;
        background: #f9fafb;
      }
      .category-nav-item.add-button:hover {
        border-color: #1976d2;
        background: #eff6ff;
      }
      .category-icon {
        font-size: 32px;
        margin-bottom: 8px;
        line-height: 1;
      }
      .category-label {
        font-size: 12px;
        font-weight: 500;
        color: #374151;
        text-align: center;
        line-height: 1.3;
      }
      .category-nav-item.active .category-label {
        color: #111827;
        font-weight: 600;
      }
      .category-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        background: #ef4444;
        color: #ffffff;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
      }
      @media (max-width: 767px) {
        .category-nav-item {
          min-width: 80px;
          padding: 8px 12px;
        }
        .category-icon {
          font-size: 24px;
        }
        .category-label {
          font-size: 11px;
        }
      }
    `,
  ],
})
export class CategoryNavItemComponent {
  private modalService = inject(ModalService);
  
  @Input() icon: string = '📦';
  @Input() label: string = 'Category';
  @Input() isActive: boolean = false;
  @Input() badge: string = '';
  @Output() categoryClick = new EventEmitter<void>();
  @Output() videosChange = new EventEmitter<VideoItem[]>();

  videos: VideoItem[] = [];

  onAddClick(event: MouseEvent): void {
    event.stopPropagation();
    
    this.modalService.open({
      contentComponent: VideoSelectModalComponent,
      title: 'Select Video',
      data: {
        onSelect: (src: string, name: string, poster?: string) => {
          const newVideo: VideoItem = { src, name, poster };
          this.videos = [...this.videos, newVideo];
          this.videosChange.emit(this.videos);
        }
      }
    });
  }

  onVideoClick(index: number): void {
    this.categoryClick.emit();
    // Có thể thêm logic để xem hoặc chỉnh sửa video đã chọn
  }

  onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.categoryClick.emit();
  }
}

