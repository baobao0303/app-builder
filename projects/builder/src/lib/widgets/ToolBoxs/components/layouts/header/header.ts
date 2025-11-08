import { Component, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header dz-header" #host>
      <div class="header-inner" #child>
        <!-- Header Content -->
        <div class="header-content flex items-center justify-between p-4 bg-white shadow-sm">
          <!-- Logo/Brand -->
          <div class="header-brand flex items-center">
            <a href="#" class="brand-link text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              Your Brand
            </a>
          </div>

          <!-- Navigation -->
          <nav class="header-nav flex items-center space-x-6">
            <a href="#" class="nav-link text-gray-700 hover:text-blue-600 transition-colors">Home</a>
            <a href="#" class="nav-link text-gray-700 hover:text-blue-600 transition-colors">About</a>
            <a href="#" class="nav-link text-gray-700 hover:text-blue-600 transition-colors">Services</a>
            <a href="#" class="nav-link text-gray-700 hover:text-blue-600 transition-colors">Contact</a>
          </nav>

          <!-- CTA Button -->
          <div class="header-actions">
            <button class="cta-button px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .header {
        position: relative;
        width: 100%;
        background: #ffffff;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        z-index: 1000;
        transition: all 0.2s;
      }
      .header.dz-selected {
        border: 2px solid #60a5fa;
        border-bottom: none;
      }
      .header.drag-over {
        border: 2px solid #60a5fa;
        background: #dbeafe;
      }
      .header-inner {
        width: 100%;
        position: relative;
      }
      .header-content {
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
        padding: 12px 16px;
      }
      /* Tablet: medium padding */
      @media (min-width: 768px) {
        .header-content {
          padding: 16px 24px;
        }
      }
      /* Desktop: larger padding */
      @media (min-width: 1024px) {
        .header-content {
          padding: 16px 32px;
        }
      }
      .header-brand {
        flex-shrink: 0;
      }
      .brand-link {
        text-decoration: none;
        color: #111827;
        font-weight: 700;
      }
      .header-nav {
        flex: 1;
        justify-content: center;
      }
      .nav-link {
        text-decoration: none;
        color: #374151;
        font-weight: 500;
        padding: 8px 0;
        position: relative;
      }
      .nav-link:hover {
        color: #2563eb;
      }
      .header-actions {
        flex-shrink: 0;
      }
      .cta-button {
        border: none;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }
      /* Mobile: stack vertically */
      @media (max-width: 767px) {
        .header-content {
          flex-direction: column;
          gap: 12px;
          padding: 12px;
        }
        .header-brand {
          width: 100%;
        }
        .brand-link {
          font-size: 1.125rem;
        }
        .header-nav {
          flex-direction: column;
          width: 100%;
          gap: 8px;
          order: 3;
        }
        .header-actions {
          width: 100%;
          order: 2;
        }
        .cta-button {
          width: 100%;
        }
      }
      /* Tablet: horizontal with adjustments */
      @media (min-width: 768px) and (max-width: 1023px) {
        .header-nav {
          gap: 12px;
        }
        .nav-link {
          font-size: 14px;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  @ViewChild('child', { read: ViewContainerRef, static: true }) private childVcr!: ViewContainerRef;
  @ViewChild('host', { static: true }) hostEl!: ElementRef<HTMLElement>;

  getChildContainer(): ViewContainerRef {
    return this.childVcr;
  }
}

