import { Injectable } from '@angular/core';
import { EditorService } from '../editor/editor.service';
import { collectUsedClasses } from '../css/collect-used-classes';
import { purgeTailwindCss } from '../css/purge-tailwind';

export interface ExportBundleOptions {
  htmlOptions?: any;
  cssOptions?: any;
  jsOptions?: any;
}

export interface ExportBundle {
  html: string;
  css: string;
  js: string;
}

@Injectable({ providedIn: 'root' })
export class CodeManagerService {
  constructor(private editor: EditorService) {}

  getHtml(opts?: any): string {
    return this.editor.getHtml(opts);
  }

  getCss(opts?: any): string {
    return this.editor.getCss(opts);
  }

  getJs(opts?: any): string {
    return this.editor.getJs(opts);
  }

  getBundle(opts: ExportBundleOptions = {}): ExportBundle {
    return {
      html: this.getHtml(opts.htmlOptions),
      css: this.getCss(opts.cssOptions),
      js: this.getJs(opts.jsOptions),
    };
  }

  buildHtmlDocument(params: { html?: string; css?: string; title?: string } = {}): string {
    const html = params.html ?? this.getHtml();
    const css = params.css ?? this.getCss();
    const title = params.title ?? 'Export';
    return `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${title}</title>\n${
      css ? `<style>\n${css}\n</style>` : ''
    }\n</head>\n<body>\n${html}\n</body>\n</html>`;
  }

  downloadHtml(
    params: {
      html?: string;
      css?: string;
      title?: string;
      filename?: string;
      tailwindCdnUrl?: string; // if provided, inject <script src="..."></script> before </head>
    } = {}
  ): void {
    console.log('downloadHtml', params);
    let doc = this.buildHtmlDocument(params);
    if (params.tailwindCdnUrl) {
      const tag = `<script src="${params.tailwindCdnUrl}"></script>`;
      doc = doc.replace('</head>', `${tag}</head>`);
    }
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = params.filename ?? 'export.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  buildHtmlDocumentLinkingCss(params: { html?: string; title?: string; cssHref: string }): string {
    const html = params.html ?? this.getHtml();
    const title = params.title ?? 'Export';
    return `<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<title>${title}</title>\n<link rel=\"stylesheet\" href=\"${params.cssHref}\">\n</head>\n<body>\n${html}\n</body>\n</html>`;
  }

  downloadCss(params: { css?: string; filename?: string } = {}): void {
    const css = params.css ?? this.getCss();
    const blob = new Blob([css], { type: 'text/css;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = params.filename ?? 'styles.css';
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadPurgedTailwindHtml(params: {
    html?: string; // if not provided, use editor HTML
    editorCss?: string; // optional extra css from editor; if not provided, use getCss()
    tailwindCss: string; // prebuilt tailwind CSS string
    whitelist?: string[]; // optional always-keep selectors
    filenameHtml?: string; // default index.html
    filenameCss?: string; // default styles.css
    title?: string;
  }): void {
    const html = params.html ?? this.getHtml();
    const editorCss = params.editorCss ?? this.getCss();
    const used = collectUsedClasses(html);
    const purged = purgeTailwindCss({
      tailwindCss: params.tailwindCss,
      usedClasses: used,
      whitelist: params.whitelist,
    });
    const finalCss = `${purged}\n${editorCss}`;

    // 1) download CSS
    this.downloadCss({ css: finalCss, filename: params.filenameCss ?? 'styles.css' });

    // 2) download HTML linking CSS (no CDN)
    const doc = this.buildHtmlDocumentLinkingCss({
      html,
      title: params.title ?? 'Export',
      cssHref: params.filenameCss ?? 'styles.css',
    });
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = params.filenameHtml ?? 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  }
}
