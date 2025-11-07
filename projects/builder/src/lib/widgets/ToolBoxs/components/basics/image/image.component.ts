import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageSelectModalComponent } from '../../../../modals/image-select-modal/image-select-modal.component';
import { ModalService } from 'builder';

@Component({
  selector: 'app-image',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="image-wrapper dz-image" #host>
      @if (imageSrc) {
      <img [src]="imageSrc" [alt]="imageAlt" class="image" />
      } @else {
      <div class="image-placeholder" (click)="openImageSelect()">
        <div class="placeholder-icon">📷</div>
        <div class="placeholder-text">Click to select image</div>
      </div>
      } @if (imageSrc) {
      <div class="image-overlay" (click)="openImageSelect()">
        <span class="edit-text">Change Image</span>
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
      .image-wrapper {
        position: relative;
        width: 100%;
        min-height: 200px;
        border: 2px dashed #cbd5e1;
        background: #f8fafc;
        cursor: pointer;
        overflow: hidden;
      }
      .image {
        width: 100%;
        height: auto;
        display: block;
      }
      .image-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
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
      .image-overlay {
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
      .image-wrapper:hover .image-overlay {
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
export class ImageComponent {
  @ViewChild('host', { static: true }) hostEl!: ElementRef<HTMLElement>;

  private modal = inject(ModalService);
  imageSrc: string | null = null;
  imageAlt: string = 'Image';

  openImageSelect(): void {
    this.modal.open({
      title: 'Select Image',
      contentComponent: ImageSelectModalComponent,
      data: {
        currentImage: this.imageSrc,
        onSelect: (image: string, name: string) => {
          this.imageSrc = image;
          this.imageAlt = name || 'Image';
        },
      },
      closeOnBackdrop: true,
    });
  }
}
