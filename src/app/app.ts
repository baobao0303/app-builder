import { Component, Type, ViewChild, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  DynamicZone,
  ToolBox,
  CORE_CONTEXT,
  type ContextType,
  type CoreAggregationContext,
  CanvasZone,
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
  AComponent,
  SectionComponent,
  BlockModel,
  CommandService,
  KeymapService,
  CodeManagerService,
} from 'builder';
import { Banner } from '../../projects/builder/src/lib/widgets/components/banner/banner';
import { RowComponent } from '../../projects/builder/src/lib/widgets/ToolBoxs/components/basics/row/row';
import { ColumnComponent } from '../../projects/builder/src/lib/widgets/ToolBoxs/components/basics/column/column';
import { NavbarComponent } from '../../projects/builder/src/lib/widgets/ToolBoxs/components/extras/navbar/navbar.component';
import { ImageComponent } from '../../projects/builder/src/lib/widgets/components/image/image.component';
import { ListComponent } from '../../projects/builder/src/lib/widgets/components/list/list.component';
import { CardComponent } from '../../projects/builder/src/lib/widgets/components/card/card.component';
import { collectUsedClasses } from '../../projects/builder/src/lib/core/css/collect-used-classes';
import { purgeTailwindCss } from '../../projects/builder/src/lib/core/css/purge-tailwind';

const defaultCoreContext: CoreAggregationContext = {
  getContextType(): ContextType {
    return 'page';
  },
  getAllowedChildren(): ContextType[] {
    return ['section'];
  },
  canAddItem(childType: ContextType): boolean {
    return this.getAllowedChildren().includes(childType);
  },
  canRemoveItem(_index: number): boolean {
    return true;
  },
  canMoveItem(_from: number, _to: number): boolean {
    return true;
  },
};

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    DynamicZone,
    ToolBox,
    CanvasZone,
    NavigatorPanelComponent,
    BlockManagerPanelComponent,
    AssetsPanelComponent,
    ModalHostComponent,
    DropIndicatorComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [{ provide: CORE_CONTEXT, useValue: defaultCoreContext }],
})
export class App {
  protected readonly title = signal('Page Builder');

  @ViewChild('dz', { static: false })
  private dz?: DynamicZone;

  protected registry: Record<string, Type<unknown>> = {
    banner: Banner,
    canvas: CanvasZone,
    a: AComponent,
    section: SectionComponent,
    navbar: NavbarComponent,
    row: RowComponent,
    column: ColumnComponent,
    '1-columns': RowComponent,
    '2-columns': RowComponent,
    '3-columns': RowComponent,
    '2-columns-3-7': RowComponent,
    image: ImageComponent,
    list: ListComponent,
    card: CardComponent,
  };

  // Component definitions để generate HTML từ model
  protected componentDefinitions: Record<string, ComponentDefinition> = {
    banner: {
      tagName: 'div',
      attributes: { 'data-widget': 'banner' },
      style: { padding: '10px', border: '1px solid #ccc', background: '#f0f0f0' },
      classes: ['banner-widget'],
      content: 'Banner Component',
    },
    canvas: {
      tagName: 'div',
      attributes: { 'data-widget': 'canvas' },
      style: { width: '100%', height: '300px', border: '1px solid #ddd', background: '#fafafa' },
      classes: ['canvas-widget'],
      content: 'Canvas Component',
    },
    section: {
      tagName: 'section',
      classes: ['p-4', 'bg-slate-50', 'border', 'border-slate-300', 'rounded'],
      components: [],
    },
    a: {
      tagName: 'div',
      classes: ['p-4', 'bg-blue-50', 'rounded', 'border', 'border-blue-200'],
      components: [
        {
          tagName: 'h1',
          classes: ['text-2xl', 'font-bold', 'text-blue-700'],
          content: 'Tailwind A Component',
        },
        {
          tagName: 'p',
          classes: ['mt-2', 'text-sm', 'text-blue-600'],
          content: 'This is rendered with Tailwind utilities.',
        },
        {
          tagName: 'button',
          classes: [
            'mt-3',
            'px-3',
            'py-1',
            'bg-blue-500',
            'text-white',
            'rounded',
            'hover:bg-blue-600',
          ],
          content: 'Action',
        },
      ],
    },
    navbar: {
      tagName: 'div',
      classes: ['bg-white', 'shadow-sm'],
      components: [
        {
          tagName: 'div',
          classes: [
            'flex',
            'items-center',
            'justify-between',
            'p-4',
            'border-b',
            'border-gray-200',
          ],
          components: [
            {
              tagName: 'div',
              classes: ['flex', 'items-center'],
              components: [
                {
                  tagName: 'button',
                  classes: [
                    'px-4',
                    'py-2',
                    'bg-gray-100',
                    'text-gray-700',
                    'rounded-md',
                    'hover:bg-gray-200',
                  ],
                  content: 'Brand link',
                },
              ],
            },
          ],
        },
        {
          tagName: 'div',
          classes: ['flex', 'justify-center', 'p-3'],
          components: [
            {
              tagName: 'nav',
              classes: ['flex', 'space-x-6'],
              components: [
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['text-gray-700', 'hover:text-blue-600'],
                  content: 'Product',
                },
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['text-gray-700', 'hover:text-blue-600'],
                  content: 'Features',
                },
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['text-gray-700', 'hover:text-blue-600'],
                  content: 'Reviews',
                },
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['text-gray-700', 'hover:text-blue-600'],
                  content: 'Pricing',
                },
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['text-gray-700', 'hover:text-blue-600'],
                  content: 'FAQ',
                },
              ],
            },
          ],
        },
      ],
    },
    '1-columns': {
      tagName: 'div',
      attributes: { 'data-widget': 'row' },
      classes: ['row'],
      components: [
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          components: [],
        },
      ],
    },
    '2-columns': {
      tagName: 'div',
      attributes: { 'data-widget': 'row' },
      classes: ['row'],
      components: [
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          components: [],
        },
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          components: [],
        },
      ],
    },
    '3-columns': {
      tagName: 'div',
      attributes: { 'data-widget': 'row' },
      classes: ['row'],
      components: [
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          components: [],
        },
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          components: [],
        },
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          components: [],
        },
      ],
    },
    '2-columns-3-7': {
      tagName: 'div',
      attributes: { 'data-widget': 'row' },
      classes: ['row'],
      components: [
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          style: { width: '30%' },
          components: [],
        },
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          style: { width: '70%' },
          components: [],
        },
      ],
    },
    image: {
      tagName: 'div',
      attributes: { 'data-widget': 'image' },
      classes: ['image-widget'],
      components: [],
    },
    list: {
      tagName: 'ul',
      attributes: { 'data-widget': 'list' },
      classes: ['list', 'space-y-2', 'list-none', 'p-0', 'm-0'],
      components: [
        {
          tagName: 'li',
          classes: [
            'p-3',
            'bg-white',
            'border',
            'border-gray-200',
            'rounded-md',
            'hover:bg-gray-50',
          ],
          content: 'List item 1',
        },
        {
          tagName: 'li',
          classes: [
            'p-3',
            'bg-white',
            'border',
            'border-gray-200',
            'rounded-md',
            'hover:bg-gray-50',
          ],
          content: 'List item 2',
        },
        {
          tagName: 'li',
          classes: [
            'p-3',
            'bg-white',
            'border',
            'border-gray-200',
            'rounded-md',
            'hover:bg-gray-50',
          ],
          content: 'List item 3',
        },
      ],
    },
    card: {
      tagName: 'div',
      attributes: { 'data-widget': 'card' },
      classes: ['card-widget'],
      components: [],
    },
  };

  // UI State
  protected activePanel: 'blocks' | 'navigator' | 'assets' = 'blocks';
  protected blocks: BlockModel[] = [];

  constructor(
    private editorService: EditorService,
    private componentModelService: ComponentModelService,
    private styleManager: StyleManagerService,
    private traitManager: TraitManagerService,
    private storageManager: StorageManagerService,
    private undoManager: UndoManagerService,
    private commands: CommandService,
    private keymaps: KeymapService,
    private codeManager: CodeManagerService
  ) {
    // Khởi tạo editor
    this.editorService.init();
    this.initDefaults();
    this.registerCommands();
    this.bindKeymaps();
  }

  private initDefaults(): void {
    // Thêm một số blocks mẫu
    this.blocks = [
      new BlockModel({
        id: 'block-1',
        label: 'Heading',
        category: 'Text',
        content: '<h1>Heading Text</h1>',
      }),
      new BlockModel({
        id: 'block-2',
        label: 'Paragraph',
        category: 'Text',
        content: '<p>Paragraph text here</p>',
      }),
      new BlockModel({
        id: 'block-3',
        label: 'Button',
        category: 'Components',
        content: '<button>Click Me</button>',
      }),
      new BlockModel({
        id: 'block-4',
        label: 'Container',
        category: 'Layout',
        content: '<div style="padding: 20px; border: 1px solid #ccc;">Container</div>',
      }),
    ];

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

  protected exportCss(): void {
    if (!this.dz) return;

    const inner = this.dz.exportHtml();
    const css = this.editorService.getCss();
    const domStyles = this.dz.exportStyles();
    const combinedCss = `${css}\n${domStyles}`;

    // 1) Download external CSS
    this.codeManager.downloadCss({ css: combinedCss, filename: 'styles.css' });

    // 2) Download HTML linking to that CSS
    const htmlDoc = this.codeManager.buildHtmlDocumentLinkingCss({
      html: inner,
      title: 'Export',
      cssHref: 'styles.css',
    });
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

    // collectUsedClassesを使って使用されているクラスを収集
    const usedClasses = collectUsedClasses(inner);

    // 現在のページでTailwind CDNがロードされている場合、そのCSSを取得
    const tailwindCss = await this.getTailwindCssFromPage();

    // 使用されているクラスだけをパージ
    const purgedCss = tailwindCss
      ? purgeTailwindCss({
          tailwindCss,
          usedClasses,
        })
      : '';

    const domStyles = this.dz.exportStyles();
    const combinedCss = `${purgedCss}\n${domStyles}`;

    // Build HTML with inline CSS (no CDN)
    const doc = this.codeManager.buildHtmlDocument({
      html: inner,
      css: combinedCss,
      title: 'Export Tailwind',
    });

    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  private async getTailwindCssFromPage(): Promise<string> {
    // 現在のページでTailwind CSSがロードされている場合、そのスタイルシートからCSSを取得
    let css = '';
    try {
      // まず、すべてのスタイルシートをチェック（より積極的に）
      const styleSheets = Array.from(document.styleSheets);
      for (const sheet of styleSheets) {
        try {
          let isTailwindSheet = false;
          let sheetContent = '';

          // Tailwind CDNのスタイルシートをチェック
          if (sheet.href && sheet.href.includes('tailwindcss.com')) {
            isTailwindSheet = true;
          }

          // スタイルシートの内容を取得
          try {
            const rules = Array.from(sheet.cssRules || []);
            rules.forEach((rule) => {
              if (rule.cssText) {
                sheetContent += rule.cssText + '\n';
              }
            });

            // インラインスタイルシートの場合、Tailwindパターンをチェック
            if (!sheet.href && sheetContent) {
              // より包括的なチェック：色関連のクラスやユーティリティクラスが含まれているか
              if (this.isTailwindRule(sheetContent) || this.containsTailwindClasses(sheetContent)) {
                isTailwindSheet = true;
              }
            }
          } catch (ruleError) {
            // ルールにアクセスできない場合は、fetchで取得を試みる
          }

          if (isTailwindSheet && sheetContent) {
            css += sheetContent;
          } else if (sheet.href && !sheet.href.startsWith('data:')) {
            // Cross-origin stylesheetのエラーを無視して、fetchで取得を試みる
            try {
              const fullUrl = sheet.href.startsWith('http')
                ? sheet.href
                : new URL(sheet.href, window.location.origin).href;
              const response = await fetch(fullUrl);
              const text = await response.text();
              if (this.isTailwindRule(text) || this.containsTailwindClasses(text)) {
                css += text + '\n';
              }
            } catch (fetchError) {
              // fetchも失敗した場合は無視
            }
          }
        } catch (e) {
          // エラーは無視して続行
        }
      }

      // スタイルシートから取得できない場合、<style>タグから直接取得
      if (!css) {
        const styleTags = document.querySelectorAll('style');
        styleTags.forEach((tag) => {
          const styleText = tag.textContent || tag.innerHTML;
          if (
            styleText &&
            (this.isTailwindRule(styleText) || this.containsTailwindClasses(styleText))
          ) {
            css += styleText + '\n';
          }
        });
      }

      // まだ取得できていない場合、<link>タグからCSSファイルを取得
      if (!css || css.length < 1000) {
        const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
        for (const link of Array.from(linkTags)) {
          const href = link.getAttribute('href');
          if (href && !href.startsWith('data:')) {
            try {
              const fullUrl = href.startsWith('http')
                ? href
                : new URL(href, window.location.origin).href;
              const response = await fetch(fullUrl);
              const text = await response.text();
              if (this.isTailwindRule(text) || this.containsTailwindClasses(text)) {
                css += text + '\n';
                break; // 最初のTailwind CSSファイルが見つかったら終了
              }
            } catch (fetchError) {
              // fetch失敗は無視
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to get Tailwind CSS from page', e);
    }

    console.log('Extracted Tailwind CSS length:', css.length);
    return css;
  }

  private containsTailwindClasses(cssText: string): boolean {
    if (!cssText || cssText.length < 50) return false;

    // Tailwindクラスのパターンをチェック（より包括的に）
    const tailwindPatterns = [
      // ユーティリティクラス
      /\.(p|m|w|h|text|bg|border|rounded|flex|grid|space|gap|mt|mb|ml|mr|mx|my|pt|pb|pl|pr|px|py|mb|mt|ml|mr|mx|my)-\d+/,
      // 色クラス
      /\.(bg|text|border)-(blue|red|green|yellow|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose)-\d+/,
      // テキストサイズ
      /\.text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)/,
      // その他のTailwindユーティリティ
      /\.(flex|grid|hidden|block|inline|relative|absolute|fixed|sticky)/,
      /\.(rounded|border|shadow|opacity|transition|transform)/,
      // Tailwind変数
      /--tw-/,
      // Tailwind特有のセレクター構造
      /\[&>.*\]/,
    ];

    // 複数のパターンに一致するかチェック
    let matchCount = 0;
    for (const pattern of tailwindPatterns) {
      if (pattern.test(cssText)) {
        matchCount++;
        if (matchCount >= 2) return true; // 2つ以上のパターンに一致すればTailwindと判定
      }
    }

    return false;
  }

  private isTailwindRule(cssText: string): boolean {
    // Tailwind CSSの特徴的なパターンをチェック
    if (!cssText || cssText.length < 10) return false;

    return (
      cssText.includes('--tw-border-spacing') ||
      cssText.includes('--tw-translate') ||
      cssText.includes('--tw-rotate') ||
      cssText.includes('--tw-scale') ||
      cssText.includes('--tw-') || // より広範囲なTailwind変数のチェック
      cssText.includes('tailwindcss') ||
      /\.(p|m|w|h|text|bg|border|rounded|flex|grid|space|gap|mt|mb|ml|mr|mx|my|pt|pb|pl|pr|px|py)-\d+/.test(
        cssText
      ) ||
      /\.(text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl))/.test(cssText) ||
      /\.(bg|text|border)-(blue|red|green|yellow|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose)-\d+/.test(
        cssText
      ) ||
      this.containsTailwindClasses(cssText)
    );
  }

  protected exportPurged(): void {
    if (!this.dz) return;
    const inner = this.dz.exportHtml();
    const editorCss = this.editorService.getCss();
    // For demo: fetch prebuilt tailwind CSS if available; otherwise prompt user to have it
    // Here we assume you have loaded/generate Tailwind CSS separately.
    // You can replace this with your own source.
    const tailwindCss = '';
    this.codeManager.downloadPurgedTailwindHtml({
      html: inner,
      editorCss,
      tailwindCss,
      filenameHtml: 'index.html',
      filenameCss: 'styles.css',
      title: 'Export',
    });
  }

  protected preview(): void {
    if (!this.dz) return;
    const inner = this.dz.exportHtml();
    const css = this.editorService.getCss();
    const domStyles = this.dz.exportStyles();
    const combinedCss = `${css}\n${domStyles}`;
    const htmlDoc = this.codeManager.buildHtmlDocument({
      html: inner,
      css: combinedCss,
      title: 'Preview',
    });
    // Open in new window
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlDoc);
      newWindow.document.close();
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

  protected setActivePanel(panel: 'blocks' | 'navigator' | 'assets'): void {
    this.activePanel = panel;
  }

  private registerCommands(): void {
    this.commands.register('open-assets', () => this.setActivePanel('assets'));
    this.commands.register('save', () => this.saveProject());
    this.commands.register('export-html', () => this.exportZone());
  }

  private bindKeymaps(): void {
    this.keymaps.bind('ctrl+s', () => this.saveProject());
    this.keymaps.bind('ctrl+z', () => this.undo());
    this.keymaps.bind('ctrl+shift+z', () => this.redo());
  }
}
