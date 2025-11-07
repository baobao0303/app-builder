import { Component, Type, ViewChild, signal } from '@angular/core';
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
import { TraitManagerPanelComponent } from '../../projects/builder/src/lib/core/trait-manager/trait-manager.panel';
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
    TraitManagerPanelComponent,
    ModalHostComponent,
    DropIndicatorComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('Page Builder');

  @ViewChild('dz', { static: false })
  private dz?: DynamicZone;

  protected registry!: Record<string, Type<unknown>>;

  protected componentDefinitions!: Record<string, ComponentDefinition>;

  // UI State
  protected activePanel: 'blocks' | 'navigator' | 'assets' | 'properties' = 'blocks';
  protected blocks: BlockModel[] = [];

  // Zoom State
  protected zoomLevel = signal(100);
  protected showZoomMenu = signal(false);
  protected zoomLevels = [25, 50, 75, 100, 125, 150, 200, 300, 400];

  // Sidebar widths (percent)
  protected leftWidth = signal(15);
  protected rightWidth = signal(25);
  protected centerWidth(): number {
    const l = this.leftWidth();
    const r = this.rightWidth();
    return Math.max(0, 100 - l - r);
  }

  // Resizer drag state
  private isDraggingRight = false;
  private layoutRoot?: HTMLElement;
  private startX = 0;
  private startRightWidth = 0;

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

  protected setZoom(level: number): void {
    this.zoomLevel.set(level);
    this.showZoomMenu.set(false);
  }

  protected zoomIn(): void {
    const current = this.zoomLevel();
    const index = this.zoomLevels.indexOf(current);
    if (index < this.zoomLevels.length - 1) {
      this.setZoom(this.zoomLevels[index + 1]);
    } else {
      // Increment by 25% if beyond max
      this.setZoom(current + 25);
    }
  }

  protected zoomOut(): void {
    const current = this.zoomLevel();
    const index = this.zoomLevels.indexOf(current);
    if (index > 0) {
      this.setZoom(this.zoomLevels[index - 1]);
    } else {
      // Decrement by 25% if below min
      this.setZoom(Math.max(25, current - 25));
    }
  }

  protected zoomToFit(): void {
    // TODO: Calculate zoom to fit content
    this.setZoom(100);
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

    const delta = event.deltaY;

    if (delta < 0) {
      // 上方向にスクロール = ズームイン
      this.zoomIn();
    } else {
      // 下方向にスクロール = ズームアウト
      this.zoomOut();
    }
  }
}
