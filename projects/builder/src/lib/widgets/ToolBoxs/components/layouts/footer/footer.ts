import { Component, ElementRef, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer dz-footer" #host>
      <div class="footer-inner" #child>
        <!-- Footer Content -->
        <div class="footer-content">
          <!-- Footer Top Section -->
          <div class="footer-top grid grid-cols-1 md:grid-cols-4 gap-8 p-8 bg-gray-900 text-white">
            <!-- Column 1: About -->
            <div class="footer-column">
              <h3 class="footer-title text-lg font-bold mb-4">About Us</h3>
              <p class="footer-text text-gray-400 text-sm mb-4">
                Your company description goes here. Tell visitors about your brand and mission.
              </p>
              <div class="footer-social flex space-x-4">
                <a href="#" class="social-link text-gray-400 hover:text-white transition-colors">Facebook</a>
                <a href="#" class="social-link text-gray-400 hover:text-white transition-colors">Twitter</a>
                <a href="#" class="social-link text-gray-400 hover:text-white transition-colors">LinkedIn</a>
              </div>
            </div>

            <!-- Column 2: Quick Links -->
            <div class="footer-column">
              <h3 class="footer-title text-lg font-bold mb-4">Quick Links</h3>
              <ul class="footer-links space-y-2">
                <li><a href="#" class="footer-link text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="#" class="footer-link text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" class="footer-link text-gray-400 hover:text-white transition-colors">Services</a></li>
                <li><a href="#" class="footer-link text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <!-- Column 3: Resources -->
            <div class="footer-column">
              <h3 class="footer-title text-lg font-bold mb-4">Resources</h3>
              <ul class="footer-links space-y-2">
                <li><a href="#" class="footer-link text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" class="footer-link text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" class="footer-link text-gray-400 hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" class="footer-link text-gray-400 hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>

            <!-- Column 4: Contact -->
            <div class="footer-column">
              <h3 class="footer-title text-lg font-bold mb-4">Contact</h3>
              <ul class="footer-contact space-y-2 text-gray-400 text-sm">
                <li>📧 info@example.com</li>
                <li>📞 +1 (555) 123-4567</li>
                <li>📍 123 Main St, City, State 12345</li>
              </ul>
            </div>
          </div>

          <!-- Footer Bottom Section -->
          <div class="footer-bottom border-t border-gray-800 p-4 bg-gray-950">
            <div class="footer-bottom-content flex flex-col md:flex-row justify-between items-center max-w-1200 mx-auto">
              <p class="footer-copyright text-gray-400 text-sm">
                © 2024 Your Company. All rights reserved.
              </p>
              <div class="footer-legal flex space-x-4 mt-4 md:mt-0">
                <a href="#" class="legal-link text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
                <a href="#" class="legal-link text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .footer {
        position: relative;
        width: 100%;
        background: #111827;
        color: #ffffff;
        transition: all 0.2s;
      }
      .footer.dz-selected {
        border: 2px solid #60a5fa;
        border-top: none;
      }
      .footer.drag-over {
        border: 2px solid #60a5fa;
        background: #1e293b;
      }
      .footer-inner {
        width: 100%;
        position: relative;
      }
      .footer-content {
        width: 100%;
      }
      .footer-top {
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
        padding: 24px 16px;
      }
      /* Tablet: medium padding */
      @media (min-width: 768px) {
        .footer-top {
          padding: 32px 24px;
        }
      }
      /* Desktop: larger padding */
      @media (min-width: 1024px) {
        .footer-top {
          padding: 48px 32px;
        }
      }
      .footer-column {
        min-width: 0;
      }
      .footer-title {
        color: #ffffff;
        margin-bottom: 16px;
      }
      .footer-text {
        line-height: 1.6;
      }
      .footer-social {
        margin-top: 16px;
      }
      .social-link {
        text-decoration: none;
        font-size: 14px;
      }
      .footer-links {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .footer-links li {
        margin: 0;
      }
      .footer-link {
        text-decoration: none;
        display: inline-block;
        font-size: 14px;
      }
      .footer-contact {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .footer-contact li {
        margin: 0;
        line-height: 1.6;
      }
      .footer-bottom {
        width: 100%;
      }
      .footer-bottom-content {
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
        padding: 0 16px;
      }
      .footer-copyright {
        margin: 0;
      }
      .footer-legal {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .legal-link {
        text-decoration: none;
      }
      /* Mobile: single column */
      @media (max-width: 767px) {
        .footer-top {
          grid-template-columns: 1fr;
          gap: 24px;
          padding: 24px 16px;
        }
        .footer-column {
          text-align: center;
        }
        .footer-title {
          font-size: 1rem;
        }
        .footer-text,
        .footer-link,
        .footer-contact li {
          font-size: 13px;
        }
        .footer-bottom {
          padding: 16px;
        }
        .footer-bottom-content {
          flex-direction: column;
          text-align: center;
          gap: 12px;
        }
        .footer-legal {
          flex-direction: column;
          gap: 8px;
        }
      }
      /* Tablet: 2 columns */
      @media (min-width: 768px) and (max-width: 1023px) {
        .footer-top {
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
      }
    `,
  ],
})
export class FooterComponent {
  @ViewChild('child', { read: ViewContainerRef, static: true }) private childVcr!: ViewContainerRef;
  @ViewChild('host', { static: true }) hostEl!: ElementRef<HTMLElement>;

  getChildContainer(): ViewContainerRef {
    return this.childVcr;
  }
}

