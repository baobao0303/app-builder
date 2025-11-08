import { Component, Type, ViewChild, signal, OnInit, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  DynamicZone,
  ToolBox,
  CORE_CONTEXT,
  EditorService,
  ComponentModelService,
  ComponentDefinition,
  StyleManagerService,
  TraitManagerService,
  StorageManagerService,
  UndoManagerService,
  NavigatorPanelComponent,
  BlockManagerPanelComponent,
  AssetsPanelComponent,
  ModalHostComponent,
  DropIndicatorComponent,
  BlockModel,
  CommandManagerService,
  KeymapService,
  CodeManagerService,
  ComponentModel,
  BuilderContextService,
  BUILDER_CONTEXT,
} from 'builder';
import { NavigationComponent } from '../../projects/builder/src/lib/core/navigation/navigation.component';
import { SettingsPanelComponent } from '../../projects/builder/src/lib/core/settings-panel/settings-panel.component';
import { FloatingPanelComponent } from '../../projects/builder/src/lib/widgets/floating-panel/floating-panel.component';
import { DownloadModalComponent } from '../../projects/builder/src/lib/widgets/modals/download-modal/download-modal.component';
import { collectUsedClasses } from '../../projects/builder/src/lib/core/css/collect-used-classes';
import { purgeTailwindCss } from '../../projects/builder/src/lib/core/css/purge-tailwind';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    DynamicZone,
    ToolBox,
    NavigatorPanelComponent,
    BlockManagerPanelComponent,
    AssetsPanelComponent,
    SettingsPanelComponent,
    ModalHostComponent,
    DropIndicatorComponent,
    NavigationComponent,
    FloatingPanelComponent,
    DownloadModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('Page Builder');

  @ViewChild('dz', { static: false })
  private dz?: DynamicZone;

  protected registry!: Record<string, Type<unknown>>;

  protected componentDefinitions!: Record<string, ComponentDefinition>;

  // UI State
  protected activePanel: 'blocks' | 'navigator' | 'assets' | 'properties' = 'blocks';
  protected blocks: BlockModel[] = [];
  protected showNavigatorFloating = signal(true); // Always show floating navigator
  protected initialNavigatorX = signal(0);
  protected initialNavigatorY = signal(0);
  protected isDragDisabled = signal(false); // Track drag mode
  protected isHandToolActive = signal(false); // Track hand/pan tool state
  protected isLeftSidebarHidden = signal(false); // Track left sidebar visibility
  protected isFullscreen = signal(false); // Track fullscreen state
  protected showDownloadModal = signal(false);

  // Zoom State
  protected zoomLevel = signal(100);
  protected showZoomMenu = signal(false);
  protected zoomLevels = [25, 50, 75, 100, 125, 150, 200, 300, 400];

  // Pan State (for canvas movement)
  protected panX = signal(0);
  protected panY = signal(0);
  protected isPanning = signal(false);
  private panStartX = 0;
  private panStartY = 0;
  private panStartPanX = 0;
  private panStartPanY = 0;
  private isSpacePressed = false;

  // Device/Viewport State
  protected activeDevice = signal<'mobile' | 'tablet' | 'desktop'>('desktop');
  protected deviceSizes = {
    mobile: { width: 375, height: 667, name: 'Mobile' },
    tablet: { width: 768, height: 1024, name: 'Tablet' },
    desktop: { width: null, height: null, name: 'Desktop' }, // null = full width
  };

  // Sidebar widths (percent)
  protected leftWidth = signal(20); // 2 parts out of 10 (20%)
  protected rightWidth = signal(25); // Not used anymore, kept for compatibility
  protected centerWidth(): number {
    const l = this.leftWidth();
    return Math.max(0, 100 - l); // No right sidebar, so only subtract left width
  }

  // Resizer drag state
  private isDraggingRight = false;
  private layoutRoot?: HTMLElement;
  private startX = 0;
  private startRightWidth = 0;

  // Left Resizer drag state
  protected isDraggingLeft = signal(false);
  protected ghostLeftPosition = signal(0);
  private startLeftWidth = 0;
  private leftSidebarVisible = signal(true);
  private rightSidebarVisible = signal(true);

  constructor(
    private editorService: EditorService,
    private componentModelService: ComponentModelService,
    private styleManager: StyleManagerService,
    private traitManager: TraitManagerService,
    private storageManager: StorageManagerService,
    private undoManager: UndoManagerService,
    private commandManager: CommandManagerService,
    private keymaps: KeymapService,
    private codeManager: CodeManagerService,
    private builderContext: BuilderContextService
  ) {
    this.registry = this.builderContext.registry;
    this.componentDefinitions = this.builderContext.componentDefinitions;
    this.blocks = this.builderContext.defaultBlocks.map((block) => new BlockModel(block.toJSON()));

    // Khởi tạo editor
    this.editorService.init();
    this.initDefaults();
    this.registerCommands();
    this.bindKeymaps();
  }

  ngOnInit(): void {
    this.calculateNavigatorPosition();

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen.set(!!document.fullscreenElement);
    });
    document.addEventListener('webkitfullscreenchange', () => {
      this.isFullscreen.set(!!(document as any).webkitFullscreenElement);
    });
    document.addEventListener('msfullscreenchange', () => {
      this.isFullscreen.set(!!(document as any).msFullscreenElement);
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.calculateNavigatorPosition();
  }

  private calculateNavigatorPosition(): void {
    const panelWidth = 320; // From floating-panel.component.ts
    const panelHeight = 500; // Approximate height for vertical centering

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Position on the right, with a 20px margin
    const x = viewportWidth - panelWidth - 20;

    // Vertically center
    const y = Math.max(0, (viewportHeight - panelHeight) / 2);

    this.initialNavigatorX.set(x);
    this.initialNavigatorY.set(y);
  }

  // Called from template once wrapper renders
  protected onLayoutInit(el: HTMLElement): void {
    this.layoutRoot = el;
  }

  // Right resizer handlers
  protected startDragRight(event: MouseEvent): void {
    // Ensure layout root is resolved from the DOM tree
    if (!this.layoutRoot) {
      const el = event.currentTarget as HTMLElement | null;
      this.layoutRoot = (el && el.closest('.builder-layout')) as HTMLElement | undefined;
    }
    this.isDraggingRight = true;
    this.startX = event.clientX;
    this.startRightWidth = this.rightWidth();
    document.addEventListener('mousemove', this.onDragRight);
    document.addEventListener('mouseup', this.stopDragRight);
    event.preventDefault();
  }

  private onDragRight = (event: MouseEvent) => {
    if (!this.isDraggingRight || !this.layoutRoot) return;
    const rect = this.layoutRoot.getBoundingClientRect();
    const dx = this.startX - event.clientX; // dragging left increases right pane
    const total = rect.width;
    const deltaPercent = (dx / total) * 100;
    const next = this.startRightWidth + deltaPercent;
    // Clamp between 15% and 45%
    const clamped = Math.min(45, Math.max(10, next));
    // Ensure center at least 20%
    const minCenter = 20;
    if (100 - this.leftWidth() - clamped < minCenter) {
      this.rightWidth.set(100 - this.leftWidth() - minCenter);
    } else {
      this.rightWidth.set(clamped);
    }
  };

  // Left resizer handlers
  protected startDragLeft(event: MouseEvent): void {
    if (!this.layoutRoot) {
      const el = event.currentTarget as HTMLElement | null;
      this.layoutRoot = (el && el.closest('.builder-layout')) as HTMLElement | undefined;
    }
    this.isDraggingLeft.set(true);
    this.startX = event.clientX;
    this.startLeftWidth = this.leftWidth();
    this.ghostLeftPosition.set(event.clientX);
    document.addEventListener('mousemove', this.onDragLeft);
    document.addEventListener('mouseup', this.stopDragLeft);
    event.preventDefault();
  }

  private onDragLeft = (event: MouseEvent) => {
    if (!this.isDraggingLeft() || !this.layoutRoot) return;
    this.ghostLeftPosition.set(event.clientX);
  };

  private stopDragLeft = (event: MouseEvent) => {
    if (!this.isDraggingLeft() || !this.layoutRoot) return;

    const rect = this.layoutRoot.getBoundingClientRect();
    const finalX = event.clientX;
    const total = rect.width;
    const newWidthPercent = (finalX / total) * 100;
    const clamped = Math.min(45, Math.max(10, newWidthPercent));
    const minCenter = 20;

    if (100 - this.rightWidth() - clamped < minCenter) {
      this.leftWidth.set(100 - this.rightWidth() - minCenter);
    } else {
      this.leftWidth.set(clamped);
    }

    this.isDraggingLeft.set(false);
    document.removeEventListener('mousemove', this.onDragLeft);
    document.removeEventListener('mouseup', this.stopDragLeft);
  };

  private stopDragRight = () => {
    this.isDraggingRight = false;
    document.removeEventListener('mousemove', this.onDragRight);
    document.removeEventListener('mouseup', this.stopDragRight);
  };

  private initDefaults(): void {
    // Khởi tạo một số sectors cho Style Manager
    this.styleManager.addSector('layout', {
      name: 'Layout',
      open: true,
      properties: [
        { name: 'Width', property: 'width', type: 'text', default: 'auto' },
        { name: 'Height', property: 'height', type: 'text', default: 'auto' },
        { name: 'Padding', property: 'padding', type: 'text', default: '0' },
      ],
    });

    // Khởi tạo một số traits
    this.traitManager.addTrait({
      name: 'id',
      label: 'ID',
      type: 'text',
    });
    this.traitManager.addTrait({
      name: 'class',
      label: 'Class',
      type: 'text',
    });
  }

  protected exportZone(): void {
    if (!this.dz) return;

    const inner = this.dz.exportHtml();
    const css = this.editorService.getCss();
    const domStyles = this.dz.exportStyles();
    const combinedCss = `${css}\n${domStyles}`;
    this.codeManager.downloadHtml({
      html: inner,
      css: combinedCss,
      title: 'Export',
      filename: 'zone.html',
    });
  }

  protected async exportCss(): Promise<void> {
    if (!this.dz) return;

    const inner = this.dz.exportHtml();
    const editorCss = this.editorService.getCss();
    const domStyles = this.dz.exportStyles();

    // Thu thập các class đang sử dụng
    const usedClasses = collectUsedClasses(inner);

    // Lấy Tailwind CSS từ page
    const tailwindCss = await this.getTailwindCssFromPage();

    let combinedCss = '';

    if (tailwindCss) {
      // Purge Tailwind CSS dựa trên các class đang sử dụng
      const purgedCss = purgeTailwindCss({
        tailwindCss,
        usedClasses,
      });
      combinedCss = `${purgedCss}\n${editorCss}\n${domStyles}`;
    } else {
      // Nếu không lấy được Tailwind CSS, chỉ xuất CSS thường
      combinedCss = `${editorCss}\n${domStyles}`;
    }

    // 1) Download external CSS
    this.codeManager.downloadCss({ css: combinedCss, filename: 'styles.css' });

    // 2) Download HTML linking to that CSS
    let htmlDoc = this.codeManager.buildHtmlDocumentLinkingCss({
      html: inner,
      title: 'Export',
      cssHref: 'styles.css',
    });
    const carouselRuntimeScriptExport = `\n(function(){\n  function initAll(){ var roots=document.querySelectorAll('.vcw-root'); [].forEach.call(roots, initCarousel); }\n  function initCarousel(root){ var viewport=root.querySelector('.vcw-viewport'); var track=root.querySelector('.vcw-track'); if(!viewport||!track) return; var prev=root.querySelector('.vcw-prev'); var next=root.querySelector('.vcw-next'); var dotsWrap=root.querySelector('.vcw-dots'); var toggleBtn=root.querySelector('.vcw-toggle'); var page=0; function itemWidth(){ var it=track.querySelector('.vcw-item'); return it?it.getBoundingClientRect().width:320;} function gap(){ var cs=getComputedStyle(track); var g=cs.columnGap||cs.gap||'0'; return parseFloat(g)||0;} function step(){ return itemWidth()+gap(); } function totalPages(){ var s=step(); var excess=Math.max(0, track.scrollWidth - viewport.clientWidth); return Math.max(1, Math.floor(excess/s) + 1);} function ensureControls(){ if(!prev){ prev=document.createElement('button'); prev.className='vcw-arrow vcw-prev'; prev.textContent='\u2039'; viewport.appendChild(prev);} if(!next){ next=document.createElement('button'); next.className='vcw-arrow vcw-next'; next.textContent='\u203A'; viewport.appendChild(next);} if(!dotsWrap){ dotsWrap=document.createElement('div'); dotsWrap.className='vcw-dots'; root.appendChild(dotsWrap);} var tp=totalPages(); dotsWrap.innerHTML=''; for(var i=0;i<tp;i++){ var b=document.createElement('button'); b.type='button'; b.className='vcw-dot'+(i===page?' active':''); (function(idx){ b.addEventListener('click', function(){ page=idx; update();});})(i); dotsWrap.appendChild(b);} } function update(){ var s=step(); viewport.scrollTo({left: page*s, behavior:'smooth'}); if(dotsWrap){ var ds=dotsWrap.querySelectorAll('.vcw-dot'); [].forEach.call(ds, function(d,i){ if(d.classList){ if(i===page) d.classList.add('active'); else d.classList.remove('active'); }});} } ensureControls(); if(prev) prev.addEventListener('click', function(){ page=Math.max(0,page-1); update();}); if(next) next.addEventListener('click', function(){ page=Math.min(totalPages()-1,page+1); update();}); if(toggleBtn){ var shown=true; var ctrls=[prev,next,dotsWrap]; toggleBtn.textContent='Ẩn điều khiển'; toggleBtn.addEventListener('click', function(){ shown=!shown; ctrls.forEach(function(el){ if(el) el.style.display= shown? '' : 'none';}); toggleBtn.textContent= shown? 'Ẩn điều khiển' : 'Hiện điều khiển';}); } window.addEventListener('resize', function(){ ensureControls(); update();}); update(); } if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', initAll);} else { initAll(); }\n})();\n`;
    htmlDoc = htmlDoc.replace('</body>', `<script>${carouselRuntimeScriptExport}<\/script></body>`);
    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  protected async exportWithTailwind(): Promise<void> {
    if (!this.dz) return;
    const inner = this.dz.exportHtml();
    const domStyles = this.dz.exportStyles();
    const editorCss = this.editorService.getCss();

    // Dùng collectUsedClasses từ @css để thu thập class đang dùng
    const usedClasses = collectUsedClasses(inner);

    // Lấy Tailwind CSS từ page (từ styleSheets, style tags, link tags)
    const tailwindCss = await this.getTailwindCssFromPage();

    if (tailwindCss) {
      // Dùng purgeTailwindCss từ @css để purge CSS
      const purgedCss = purgeTailwindCss({
        tailwindCss,
        usedClasses,
      });
      console.log('purgedCss', purgedCss);

      const combinedCss = `${purgedCss}\n${editorCss}\n${domStyles}`;

      // Build HTML với CSS đã purge (không cần CDN)
      let doc = this.codeManager.buildHtmlDocument({
        html: inner,
        css: combinedCss,
        title: 'Export Tailwind',
      });
      const runtimeScript = `\n(function(){\n  function initAll(){ var roots=document.querySelectorAll('.vcw-root'); [].forEach.call(roots, initCarousel);}\n  function initCarousel(root){ var viewport=root.querySelector('.vcw-viewport'); var track=root.querySelector('.vcw-track'); if(!viewport||!track) return; var prev=root.querySelector('.vcw-prev'); var next=root.querySelector('.vcw-next'); var dotsWrap=root.querySelector('.vcw-dots'); var toggleBtn=root.querySelector('.vcw-toggle'); var page=0; function itemWidth(){ var it=track.querySelector('.vcw-item'); return it?it.getBoundingClientRect().width:320;} function gap(){ var cs=getComputedStyle(track); var g=cs.columnGap||cs.gap||'0'; return parseFloat(g)||0;} function step(){ return itemWidth()+gap(); } function totalPages(){ var s=step(); var excess=Math.max(0, track.scrollWidth - viewport.clientWidth); return Math.max(1, Math.floor(excess/s) + 1);} function ensureControls(){ if(!prev){ prev=document.createElement('button'); prev.className='vcw-arrow vcw-prev'; prev.textContent='\u2039'; viewport.appendChild(prev);} if(!next){ next=document.createElement('button'); next.className='vcw-arrow vcw-next'; next.textContent='\u203A'; viewport.appendChild(next);} if(!dotsWrap){ dotsWrap=document.createElement('div'); dotsWrap.className='vcw-dots'; root.appendChild(dotsWrap);} var tp=totalPages(); dotsWrap.innerHTML=''; for(var i=0;i<tp;i++){ var b=document.createElement('button'); b.type='button'; b.className='vcw-dot'+(i===page?' active':''); (function(idx){ b.addEventListener('click', function(){ page=idx; update();});})(i); dotsWrap.appendChild(b);} } function update(){ var s=step(); viewport.scrollTo({left: page*s, behavior:'smooth'}); if(dotsWrap){ var ds=dotsWrap.querySelectorAll('.vcw-dot'); [].forEach.call(ds, function(d,i){ if(d.classList){ if(i===page) d.classList.add('active'); else d.classList.remove('active'); }});} } ensureControls(); if(prev) prev.addEventListener('click', function(){ page=Math.max(0,page-1); update();}); if(next) next.addEventListener('click', function(){ page=Math.min(totalPages()-1,page+1); update();}); if(toggleBtn){ var shown=true; var ctrls=[prev,next,dotsWrap]; toggleBtn.textContent='Ẩn điều khiển'; toggleBtn.addEventListener('click', function(){ shown=!shown; ctrls.forEach(function(el){ if(el) el.style.display= shown? '' : 'none';}); toggleBtn.textContent= shown? 'Ẩn điều khiển' : 'Hiện điều khiển';}); } window.addEventListener('resize', function(){ ensureControls(); update();}); update(); } if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', initAll);} else { initAll(); }\n})();\n`;
      doc = doc.replace('</body>', `<script>${runtimeScript}<\/script></body>`);

      const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Fallback: nếu không lấy được CSS, dùng CDN
      let doc = this.codeManager.buildHtmlDocument({
        html: inner,
        css: `${editorCss}\n${domStyles}`,
        title: 'Export Tailwind',
      });
      doc = doc.replace('</head>', '<script src="https://cdn.tailwindcss.com"></script></head>');
      const runtimeScriptCdn = `\n(function(){\n  function initAll(){ var roots=document.querySelectorAll('.vcw-root'); [].forEach.call(roots, initCarousel);}\n  function initCarousel(root){ var viewport=root.querySelector('.vcw-viewport'); var track=root.querySelector('.vcw-track'); if(!viewport||!track) return; var prev=root.querySelector('.vcw-prev'); var next=root.querySelector('.vcw-next'); var dotsWrap=root.querySelector('.vcw-dots'); var toggleBtn=root.querySelector('.vcw-toggle'); var page=0; function itemWidth(){ var it=track.querySelector('.vcw-item'); return it?it.getBoundingClientRect().width:320;} function gap(){ var cs=getComputedStyle(track); var g=cs.columnGap||cs.gap||'0'; return parseFloat(g)||0;} function step(){ return itemWidth()+gap(); } function totalPages(){ var s=step(); var excess=Math.max(0, track.scrollWidth - viewport.clientWidth); return Math.max(1, Math.floor(excess/s) + 1);} function ensureControls(){ if(!prev){ prev=document.createElement('button'); prev.className='vcw-arrow vcw-prev'; prev.textContent='\u2039'; viewport.appendChild(prev);} if(!next){ next=document.createElement('button'); next.className='vcw-arrow vcw-next'; next.textContent='\u203A'; viewport.appendChild(next);} if(!dotsWrap){ dotsWrap=document.createElement('div'); dotsWrap.className='vcw-dots'; root.appendChild(dotsWrap);} var tp=totalPages(); dotsWrap.innerHTML=''; for(var i=0;i<tp;i++){ var b=document.createElement('button'); b.type='button'; b.className='vcw-dot'+(i===page?' active':''); (function(idx){ b.addEventListener('click', function(){ page=idx; update();});})(i); dotsWrap.appendChild(b);} } function update(){ var s=step(); viewport.scrollTo({left: page*s, behavior:'smooth'}); if(dotsWrap){ var ds=dotsWrap.querySelectorAll('.vcw-dot'); [].forEach.call(ds, function(d,i){ if(d.classList){ if(i===page) d.classList.add('active'); else d.classList.remove('active'); }});} } ensureControls(); if(prev) prev.addEventListener('click', function(){ page=Math.max(0,page-1); update();}); if(next) next.addEventListener('click', function(){ page=Math.min(totalPages()-1,page+1); update();}); if(toggleBtn){ var shown=true; var ctrls=[prev,next,dotsWrap]; toggleBtn.textContent='Ẩn điều khiển'; toggleBtn.addEventListener('click', function(){ shown=!shown; ctrls.forEach(function(el){ if(el) el.style.display= shown? '' : 'none';}); toggleBtn.textContent= shown? 'Ẩn điều khiển' : 'Hiện điều khiển';}); } window.addEventListener('resize', function(){ ensureControls(); update();}); update(); } if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', initAll);} else { initAll(); }\n})();\n`;
      doc = doc.replace('</body>', `<script>${runtimeScriptCdn}<\/script></body>`);
      const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  private async getTailwindCssFromPage(): Promise<string> {
    let css = '';
    const collectedUrls = new Set<string>();

    try {
      // Lấy CSS từ styleSheets
      const styleSheets = Array.from(document.styleSheets);
      for (const sheet of styleSheets) {
        try {
          const sheetUrl = sheet.href || '';

          if (!sheetUrl) {
            // Inline stylesheet
            try {
              const rules = Array.from(sheet.cssRules || []);
              rules.forEach((rule) => {
                if (rule.cssText) {
                  css += rule.cssText + '\n';
                }
              });
            } catch (ruleError) {
              // CORS error - ignore
            }
          } else if (!collectedUrls.has(sheetUrl)) {
            // External stylesheet
            try {
              const fullUrl = sheetUrl.startsWith('http')
                ? sheetUrl
                : new URL(sheetUrl, window.location.origin).href;
              const response = await fetch(fullUrl);
              const text = await response.text();
              css += text + '\n';
              collectedUrls.add(sheetUrl);
            } catch (fetchError) {
              // Fetch failed - ignore
            }
          }
        } catch (e) {
          // Ignore errors
        }
      }

      // Lấy CSS từ <style> tags
      const styleTags = document.querySelectorAll('style');
      styleTags.forEach((tag) => {
        const styleText = tag.textContent || tag.innerHTML;
        if (styleText) {
          css += styleText + '\n';
        }
      });

      // Lấy CSS từ <link> tags
      const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
      for (const link of Array.from(linkTags)) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('data:') && !collectedUrls.has(href)) {
          try {
            const fullUrl = href.startsWith('http')
              ? href
              : new URL(href, window.location.origin).href;
            const response = await fetch(fullUrl);
            const text = await response.text();
            css += text + '\n';
            collectedUrls.add(href);
          } catch (fetchError) {
            // Fetch failed - ignore
          }
        }
      }
    } catch (e) {
      console.warn('Failed to get CSS from page', e);
    }

    return css;
  }

  protected exportPurged(): void {
    if (!this.dz) return;
    const inner = this.dz.exportHtml();
    const editorCss = this.editorService.getCss();
    const domStyles = this.dz.exportStyles();

    // Dùng collectUsedClasses từ @css để thu thập class đang dùng
    const usedClasses = collectUsedClasses(inner);

    // Lấy Tailwind CSS từ CDN (hoặc có thể truyền vào từ bên ngoài)
    // TODO: Có thể fetch từ CDN hoặc yêu cầu user cung cấp
    const tailwindCss = ''; // User cần cung cấp Tailwind CSS ở đây

    if (tailwindCss) {
      // Dùng purgeTailwindCss từ @css để purge CSS
      const purgedCss = purgeTailwindCss({
        tailwindCss,
        usedClasses,
      });

      const combinedCss = `${purgedCss}\n${editorCss}\n${domStyles}`;

      this.codeManager.downloadPurgedTailwindHtml({
        html: inner,
        editorCss: combinedCss,
        tailwindCss: '', // Không cần vì đã purge rồi
        filenameHtml: 'index.html',
        filenameCss: 'styles.css',
        title: 'Export Purged',
      });
    } else {
      // Nếu không có Tailwind CSS, chỉ export CSS thường
      const combinedCss = `${editorCss}\n${domStyles}`;
      this.codeManager.downloadHtml({
        html: inner,
        css: combinedCss,
        title: 'Export',
        filename: 'index.html',
      });
    }
  }

  protected async preview(): Promise<void> {
    if (!this.dz) return;
    const inner = this.dz.exportHtml();
    const editorCss = this.editorService.getCss();
    const domStyles = this.dz.exportStyles();
    // 收集页面中当前的 <style> 与 <link rel="stylesheet">（包含组件样式）
    const pageCss = await this.getTailwindCssFromPage();
    const combinedCss = `${pageCss}\n${editorCss}\n${domStyles}`;
    let htmlDoc = this.codeManager.buildHtmlDocument({
      html: inner,
      css: combinedCss,
      title: 'Preview',
    });
    const previewScript = `
(function(){
  function initAll(){ var roots=document.querySelectorAll('.vcw-root'); [].forEach.call(roots, initCarousel); }
  function initCarousel(root){ var viewport=root.querySelector('.vcw-viewport'); var track=root.querySelector('.vcw-track'); if(!viewport||!track) return; var prev=root.querySelector('.vcw-prev'); var next=root.querySelector('.vcw-next'); var dotsWrap=root.querySelector('.vcw-dots'); var toggleBtn=root.querySelector('.vcw-toggle'); var page=0; function itemWidth(){ var it=track.querySelector('.vcw-item'); return it?it.getBoundingClientRect().width:320;} function gap(){ var cs=getComputedStyle(track); var g=cs.columnGap||cs.gap||'0'; return parseFloat(g)||0;} function step(){ return itemWidth()+gap(); } function totalPages(){ var s=step(); var excess=Math.max(0, track.scrollWidth - viewport.clientWidth); return Math.max(1, Math.floor(excess/s) + 1);} function ensureControls(){ if(!prev){ prev=document.createElement('button'); prev.className='vcw-arrow vcw-prev'; prev.textContent='\u2039'; viewport.appendChild(prev);} if(!next){ next=document.createElement('button'); next.className='vcw-arrow vcw-next'; next.textContent='\u203A'; viewport.appendChild(next);} if(!dotsWrap){ dotsWrap=document.createElement('div'); dotsWrap.className='vcw-dots'; root.appendChild(dotsWrap);} var tp=totalPages(); dotsWrap.innerHTML=''; for(var i=0;i<tp;i++){ var b=document.createElement('button'); b.type='button'; b.className='vcw-dot'+(i===page?' active':''); (function(idx){ b.addEventListener('click', function(){ page=idx; update();});})(i); dotsWrap.appendChild(b);} } function update(){ var s=step(); viewport.scrollTo({ left: page*s, behavior: 'smooth' }); if(dotsWrap){ var ds=dotsWrap.querySelectorAll('.vcw-dot'); [].forEach.call(ds,function(d,i){ if(d.classList){ if(i===page) d.classList.add('active'); else d.classList.remove('active'); }});} } ensureControls(); if(prev) prev.addEventListener('click', function(){ page=Math.max(0, page-1); update(); }); if(next) next.addEventListener('click', function(){ page=Math.min(totalPages()-1, page+1); update(); }); if(toggleBtn){ var shown=true; var ctrls=[prev,next,dotsWrap]; toggleBtn.textContent='Ẩn điều khiển'; toggleBtn.addEventListener('click', function(){ shown=!shown; ctrls.forEach(function(el){ if(el){ el.style.display = shown ? '' : 'none'; }}); toggleBtn.textContent = shown ? 'Ẩn điều khiển' : 'Hiện điều khiển'; }); } window.addEventListener('resize', function(){ ensureControls(); update(); }); update(); } if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', initAll);} else { initAll(); }
})();
`;
    htmlDoc = htmlDoc.replace('</body>', `<script>${previewScript}<\/script></body>`);
    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } else {
      window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  }

  protected async saveProject(): Promise<void> {
    const root = this.componentModelService.getRootComponent();
    if (!root) {
      alert('No project to save');
      return;
    }

    const data = {
      ['components']: root.toJSON(),
      styles: this.styleManager.getSectors().map((s) => s.toJSON()),
    };

    try {
      await this.storageManager.store(data);
      alert('Project saved!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Save failed!');
    }
  }

  protected async loadProject(): Promise<void> {
    try {
      const data = await this.storageManager.load();
      if (!data) {
        alert('No saved project found');
        return;
      }

      if (data['components']) {
        this.componentModelService.setRootComponent(data['components']);
      }

      alert('Project loaded!');
    } catch (error) {
      console.error('Load failed:', error);
      alert('Load failed!');
    }
  }

  protected undo(): void {
    if (this.undoManager.canUndo()) {
      this.undoManager.undo();
    }
  }

  protected redo(): void {
    if (this.undoManager.canRedo()) {
      this.undoManager.redo();
    }
  }

  protected getRootComponent() {
    return this.componentModelService.getRootComponent() || undefined;
  }

  protected onNavigatorSelect(component: ComponentModel): void {
    // Try to find the real DOM element by component id
    const id = component.getId();
    const el = document.getElementById(id);
    if (el) {
      this.traitManager.select(el);
    }
  }

  protected setActivePanel(panel: 'blocks' | 'navigator' | 'assets' | 'properties'): void {
    this.activePanel = panel;
  }

  protected closeNavigatorFloating(): void {
    this.showNavigatorFloating.set(false);
  }

  private registerCommands(): void {
    this.commandManager.register({
      id: 'open-assets',
      name: 'Open Assets',
      handler: () => this.setActivePanel('assets'),
      category: 'App',
    });
    this.commandManager.register({
      id: 'save',
      name: 'Save Project',
      handler: () => this.saveProject(),
      category: 'App',
    });
    this.commandManager.register({
      id: 'export-html',
      name: 'Export HTML',
      handler: () => this.exportZone(),
      category: 'App',
    });
  }

  private bindKeymaps(): void {
    this.keymaps.bind('ctrl+s', () => this.saveProject());
    this.keymaps.bind('ctrl+z', () => this.undo());
    this.keymaps.bind('ctrl+shift+z', () => this.redo());
    this.keymaps.bind('ctrl+plus', () => this.zoomIn());
    this.keymaps.bind('ctrl+minus', () => this.zoomOut());
  }

  protected onToggleLeftSidebar(): void {
    this.isLeftSidebarHidden.update((v) => !v);
    this.leftSidebarVisible.update((v) => !v);
    this.leftWidth.set(this.leftSidebarVisible() ? 25 : 0);
  }

  protected onToggleRightSidebar(): void {
    this.rightSidebarVisible.update((v) => !v);
    this.rightWidth.set(this.rightSidebarVisible() ? 25 : 0);
  }

  protected onToggleDragMode(): void {
    this.isDragDisabled.update((v) => !v);
    this.isHandToolActive.update((v) => !v);

    // Update cursor when hand tool is active
    const canvasContent = document.querySelector('.canvas-content') as HTMLElement;
    if (canvasContent) {
      if (this.isHandToolActive()) {
        canvasContent.style.cursor = 'grab';
      } else {
        canvasContent.style.cursor = '';
      }
    }

    // Notify dynamic zone to disable/enable dragging
    if (this.dz) {
      // We'll need to add a method to DynamicZone to disable dragging
      console.log(
        'Hand tool toggled:',
        this.isHandToolActive() ? 'active (pan mode)' : 'inactive (edit mode)'
      );
    }
  }

  protected onDeviceChange(device: 'mobile' | 'tablet' | 'desktop'): void {
    this.activeDevice.set(device);
    console.log('Device view changed to:', device);
  }

  // Get viewport dimensions based on active device
  protected getViewportWidth(): number | null {
    const device = this.activeDevice();
    const size = this.deviceSizes[device];
    return size.width;
  }

  protected getViewportHeight(): number | null {
    const device = this.activeDevice();
    const size = this.deviceSizes[device];
    return size.height;
  }

  protected async onToggleFullscreen(): Promise<void> {
    try {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
        // Enter fullscreen
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        } else if ((document.documentElement as any).msRequestFullscreen) {
          await (document.documentElement as any).msRequestFullscreen();
        }
        // State will be updated by the event listener
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        // State will be updated by the event listener
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      // Revert state if fullscreen failed
      this.isFullscreen.set(
        !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).msFullscreenElement
        )
      );
    }
  }

  protected onToggleNavigator(): void {
    this.showNavigatorFloating.update((v) => !v);
  }

  protected onDownload(): void {
    this.showDownloadModal.set(true);
  }

  // Zoom Methods
  protected toggleZoomMenu(): void {
    this.showZoomMenu.update((v) => !v);
  }

  protected onContainerClick(event: Event): void {
    // Close zoom menu when clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.zoom-dropdown')) {
      this.showZoomMenu.set(false);
    }
  }

  protected setZoom(level: number, zoomPoint?: { x: number; y: number }): void {
    const oldZoom = this.zoomLevel();
    const oldScale = oldZoom / 100;
    const newScale = level / 100;
    const zoomFactor = newScale / oldScale;

    this.zoomLevel.set(level);
    this.showZoomMenu.set(false);

    // If zoom point is provided, adjust pan to zoom into that point (like Figma)
    if (zoomPoint) {
      // Calculate the world position of the zoom point before zoom
      const worldX = (zoomPoint.x - this.panX()) / oldScale;
      const worldY = (zoomPoint.y - this.panY()) / oldScale;

      // Calculate new pan to keep the same world point under the cursor
      const newPanX = zoomPoint.x - worldX * newScale;
      const newPanY = zoomPoint.y - worldY * newScale;

      this.panX.set(newPanX);
      this.panY.set(newPanY);
    }
  }

  protected zoomIn(zoomPoint?: { x: number; y: number }): void {
    const current = this.zoomLevel();
    const index = this.zoomLevels.indexOf(current);
    if (index < this.zoomLevels.length - 1) {
      this.setZoom(this.zoomLevels[index + 1], zoomPoint);
    } else {
      // Increment by 25% if beyond max
      this.setZoom(current + 25, zoomPoint);
    }
  }

  protected zoomOut(zoomPoint?: { x: number; y: number }): void {
    const current = this.zoomLevel();
    const index = this.zoomLevels.indexOf(current);
    if (index > 0) {
      this.setZoom(this.zoomLevels[index - 1], zoomPoint);
    } else {
      // Decrement by 25% if below min
      this.setZoom(Math.max(25, current - 25), zoomPoint);
    }
  }

  protected zoomToFit(): void {
    // TODO: Calculate zoom to fit content
    this.setZoom(100);
    this.panX.set(0);
    this.panY.set(0);
    this.showZoomMenu.set(false);
  }

  protected onCanvasWheel(event: WheelEvent): void {
    // macOS: Command + wheel, Windows: Ctrl + wheel
    const isModifierPressed = event.metaKey || event.ctrlKey;

    if (!isModifierPressed) {
      return; // 修飾キーが押されていない場合は通常のスクロール
    }

    event.preventDefault();
    event.stopPropagation();

    // Get mouse position relative to canvas-content (viewport coordinates)
    const canvasContent = event.currentTarget as HTMLElement;
    const rect = canvasContent.getBoundingClientRect();
    const zoomPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    const delta = event.deltaY;
    const zoomStep = Math.abs(delta) > 50 ? 10 : 5; // Larger steps for faster scrolling

    if (delta < 0) {
      // 上方向にスクロール = ズームイン
      const newZoom = Math.min(400, this.zoomLevel() + zoomStep);
      this.setZoom(newZoom, zoomPoint);
    } else {
      // 下方向にスクロール = ズームアウト
      const newZoom = Math.max(25, this.zoomLevel() - zoomStep);
      this.setZoom(newZoom, zoomPoint);
    }
  }

  // Pan handlers (for dragging canvas)
  protected onCanvasMouseDown(event: MouseEvent): void {
    // Start panning if:
    // 1. Hand tool is active (click and drag to pan)
    // 2. Space is pressed
    // 3. Middle mouse button (button 1)
    // 4. Right-click + Shift (for better UX)
    const shouldPan =
      this.isHandToolActive() ||
      event.button === 1 ||
      this.isSpacePressed ||
      (event.button === 2 && event.shiftKey);

    if (shouldPan) {
      // Don't pan if clicking on interactive elements (buttons, inputs, etc.)
      const target = event.target as HTMLElement;
      if (target.closest('button, input, textarea, select, a, [contenteditable="true"]')) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      this.isPanning.set(true);
      this.panStartX = event.clientX;
      this.panStartY = event.clientY;
      this.panStartPanX = this.panX();
      this.panStartPanY = this.panY();
      (event.currentTarget as HTMLElement).style.cursor = 'grabbing';
      document.addEventListener('mousemove', this.onCanvasMouseMove);
      document.addEventListener('mouseup', this.onCanvasMouseUp);
    }
  }

  private onCanvasMouseMove = (event: MouseEvent): void => {
    if (!this.isPanning()) return;

    const deltaX = event.clientX - this.panStartX;
    const deltaY = event.clientY - this.panStartY;

    this.panX.set(this.panStartPanX + deltaX);
    this.panY.set(this.panStartPanY + deltaY);
  };

  private onCanvasMouseUp = (event: MouseEvent): void => {
    if (!this.isPanning()) return;

    this.isPanning.set(false);
    const canvasContent = document.querySelector('.canvas-content') as HTMLElement;
    if (canvasContent) {
      canvasContent.style.cursor = '';
    }
    document.removeEventListener('mousemove', this.onCanvasMouseMove);
    document.removeEventListener('mouseup', this.onCanvasMouseUp);
  };

  // Handle space key for panning
  @HostListener('keydown', ['$event'])
  protected onKeyDown(event: KeyboardEvent): void {
    if (
      (event.code === 'Space' && event.target === document.body) ||
      (event.target as HTMLElement)?.tagName === 'BODY' ||
      (event.target as HTMLElement)?.closest('.canvas-content')
    ) {
      // Prevent default space behavior (scrolling)
      if (
        !(event.target as HTMLElement)?.isContentEditable &&
        (event.target as HTMLElement)?.tagName !== 'INPUT' &&
        (event.target as HTMLElement)?.tagName !== 'TEXTAREA'
      ) {
        event.preventDefault();
      }
      this.isSpacePressed = true;
      const canvasContent = document.querySelector('.canvas-content') as HTMLElement;
      if (canvasContent && !this.isPanning()) {
        canvasContent.style.cursor = 'grab';
      }
    }
  }

  @HostListener('keyup', ['$event'])
  protected onKeyUp(event: KeyboardEvent): void {
    if (event.code === 'Space') {
      this.isSpacePressed = false;
      const canvasContent = document.querySelector('.canvas-content') as HTMLElement;
      if (canvasContent && !this.isPanning()) {
        canvasContent.style.cursor = '';
      }
    }
  }
}
