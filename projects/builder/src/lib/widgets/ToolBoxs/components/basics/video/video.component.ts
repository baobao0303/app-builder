import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VideoSelectModalComponent } from '../../../../modals/video-select-modal/video-select-modal.component';
import { ModalService } from 'builder';

@Component({
  selector: 'app-video',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-wrapper dz-video" #host>
      @if (videoSrc) {
      <video [src]="videoSrc" [controls]="true" class="video" [poster]="posterSrc">
        Your browser does not support the video tag.
      </video>
      } @else {
      <div class="video-placeholder" (click)="openVideoSelect()">
        <div class="placeholder-icon">🎬</div>
        <div class="placeholder-text">Click to select video</div>
      </div>
      } @if (videoSrc) {
      <div class="video-overlay" (click)="openVideoSelect()">
        <span class="edit-text">Change Video</span>
      </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .video-wrapper {
        position: relative;
        width: 100%;
        min-height: 300px;
        border: 2px dashed #cbd5e1;
        background: #f8fafc;
        cursor: pointer;
        overflow: hidden;
      }
      .video {
        width: 100%;
        height: auto;
        display: block;
        min-height: 300px;
        background: #000;
      }
      .video-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        padding: 20px;
        color: #64748b;
      }
      .placeholder-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }
      .placeholder-text {
        font-size: 14px;
        font-weight: 500;
      }
      .video-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
      }
      .video-wrapper:hover .video-overlay {
        opacity: 1;
      }
      .edit-text {
        color: white;
        font-size: 14px;
        font-weight: 500;
      }
    `,
  ],
})
export class VideoComponent {
  @ViewChild('host', { static: true }) hostEl!: ElementRef<HTMLElement>;

  private modal = inject(ModalService);
  videoSrc: string | null = null;
  posterSrc: string | null = null;

  openVideoSelect(): void {
    this.modal.open({
      title: 'Select Video',
      contentComponent: VideoSelectModalComponent,
      data: {
        currentVideo: this.videoSrc,
        onSelect: (video: string, name: string, poster?: string) => {
          this.videoSrc = video;
          this.posterSrc = poster || null;
        },
      },
      closeOnBackdrop: true,
    });
  }
}

