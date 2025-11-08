import { Component, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-main',
  standalone: true,
  template: `
    <main class="main dz-main" #host id="site-content">
      <div class="main-inner" #child>
        <!-- Title -->
        <h1 class="main-title dz-heading text-3xl font-bold text-center mb-4">
          Begin each day by telling yourself
        </h1>

        <!-- Metadata -->
        <div class="main-metadata flex items-center justify-center gap-4 text-sm text-gray-600 mb-6">
          <div class="metadata-item flex items-center gap-1">
            <span class="metadata-icon">👤</span>
            <span>By admin</span>
          </div>
          <div class="metadata-item flex items-center gap-1">
            <span class="metadata-icon">📅</span>
            <span>December 31, 2020</span>
          </div>
          <div class="metadata-item flex items-center gap-1">
            <span class="metadata-icon">💬</span>
            <span>0 Comments</span>
          </div>
        </div>

        <!-- Feature Image -->
        <div class="main-image-wrapper mb-6">
          <div class="dz-image image-placeholder" style="width: 100%; min-height: 300px; background: #f0f0f0; border: 2px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; color: #64748b;">
            <span>Feature Image</span>
          </div>
        </div>

        <!-- Text Content -->
        <div class="main-content">
          <p class="main-text dz-text text-base text-gray-700 mb-4">
            Begin each day by telling yourself:
          </p>
          <blockquote class="main-quote text-lg italic text-gray-600 border-l-4 border-blue-500 pl-4">
            "Today I shall be meeting with interference. inaratitude."
          </blockquote>
        </div>
      </div>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .main {
        padding: 16px;
        background: #ffffff;
        min-height: 400px;
        position: relative;
        width: 100%;
        box-sizing: border-box;
        transition: all 0.2s;
        max-width: 1200px;
        margin: 0 auto;
      }
      /* Tablet: medium padding */
      @media (min-width: 768px) {
        .main {
          padding: 24px;
        }
      }
      /* Desktop: larger padding */
      @media (min-width: 1024px) {
        .main {
          padding: 32px;
        }
      }
      .main.dz-selected {
        border: 2px solid #60a5fa;
        background: #f0f9ff;
      }
      .main.drag-over {
        border-color: #60a5fa;
        background: #dbeafe;
      }
      .main-inner {
        width: 100%;
        position: relative;
      }
      .main-title {
        color: #111827;
        margin: 0 0 16px 0;
        font-weight: 700;
        line-height: 1.2;
        font-size: 1.5rem;
      }
      /* Tablet: larger title */
      @media (min-width: 768px) {
        .main-title {
          font-size: 1.875rem;
        }
      }
      /* Desktop: even larger */
      @media (min-width: 1024px) {
        .main-title {
          font-size: 2.25rem;
        }
      }
      .main-metadata {
        margin-bottom: 24px;
      }
      .metadata-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .metadata-icon {
        font-size: 16px;
      }
      .main-image-wrapper {
        margin-bottom: 24px;
      }
      .main-content {
        margin-top: 24px;
      }
      .main-text {
        margin-bottom: 16px;
        color: #374151;
      }
      .main-quote {
        margin: 16px 0;
        padding-left: 16px;
        border-left: 4px solid #3b82f6;
        color: #4b5563;
        font-style: italic;
      }
    `,
  ],
})
export class MainComponent {
  @ViewChild('child', { read: ViewContainerRef, static: true }) private childVcr!: ViewContainerRef;
  @ViewChild('host', { static: true }) hostEl!: ElementRef<HTMLElement>;

  getChildContainer(): ViewContainerRef {
    return this.childVcr;
  }
}


