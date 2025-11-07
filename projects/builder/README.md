## 📋 Tổng quan

Thư viện này cung cấp khả năng xây dựng trang web bằng cách kéo và thả, và xuất HTML/CSS. Hỗ trợ Tailwind CSS, chỉ giữ lại các class đang được sử dụng và tạo CSS đã được tối ưu hóa.

## 🛠️ Tech Stack

- Angular
- PrimeNG
- Tailwind CSS

## Tính năng chính

- **Trình xây dựng trang web trực quan**: Kéo và thả để đặt các component
- **Component có thể tái sử dụng**: Card, List, Image, Navbar, v.v.
- **Hỗ trợ Tailwind CSS**: Chỉ giữ lại các class đang được sử dụng và tối ưu hóa
- **Xuất HTML/CSS**: Tạo tài liệu HTML hoàn chỉnh
- **Lưu trữ dữ liệu**: Lưu và tải dự án
- ↩**Undo/Redo**: Chức năng hoàn tác/làm lại
- **Quản lý tài sản**: Quản lý hình ảnh và các tài sản khác
- **Hệ thống plugin**: Kiến trúc có thể mở rộng

## Life-cycle Hoạt Động của Ứng Dụng

### 1. Khởi Tạo (Initialization)

Khi người dùng mở ứng dụng lần đầu:

```
1. Ứng dụng load và khởi tạo các services
   ↓
2. Angular bootstrap và render App component
   ↓
3. Các services được inject:
   - ComponentModelService: Quản lý component tree
   - EditorService: Quản lý trạng thái editor
   - CodeManagerService: Sẵn sàng cho export
   - AssetManagerService: Quản lý tài sản
   ↓
4. DynamicZone component được render (canvas trống)
   ↓
5. ToolBox component được render (sidebar với các component có sẵn)
   ↓
6. Ứng dụng sẵn sàng để người dùng bắt đầu xây dựng
```

### 2. Xây Dựng Trang (Building)

Người dùng bắt đầu xây dựng trang bằng cách kéo và thả:

```
2.1. Kéo Component từ ToolBox
   ↓
2.2. ToolBox phát event `addWidget` với key của component
   ↓
2.3. DynamicZone nhận event và:
   - Tìm component trong registry
   - Tạo ComponentModel từ componentDefinitions
   - Render component vào ViewContainerRef
   - Lưu ComponentModel vào ComponentModelService
   ↓
2.4. Component hiển thị trên DynamicZone (canvas area)
   ↓
2.5. Người dùng có thể:
   - Kéo thêm component khác
   - Kéo component vào Section để tạo nested structure
   - Chọn component để chỉnh sửa (nếu có)
   - Xóa component (nếu có)
```

### 3. Quản Lý Tài Sản (Asset Management)

Người dùng quản lý hình ảnh và tài sản:

```
4.1. Mở Assets Panel (từ menu hoặc command)
   ↓
4.2. AssetManagerService hiển thị danh sách tài sản hiện có
   ↓
4.3. Người dùng có thể:
   - Upload hình ảnh mới (file input)
   - Xem preview tài sản
   - Xóa tài sản không dùng
   ↓
4.4. Khi upload:
   - File được đọc và convert thành base64 hoặc URL
   - AssetManagerService thêm vào danh sách
   - Asset được lưu vào state
   ↓
4.5. Component có thể sử dụng tài sản từ AssetManagerService
```

### 4. Xuất HTML/CSS (Export)

Người dùng xuất trang web đã xây dựng:

```
6.1. Người dùng click "Export HTML"
   ↓
6.2. DynamicZone.exportHtml() được gọi:
   - Duyệt qua ComponentModel tree
   - Tạo HTML string từ componentDefinitions
   - Giữ nguyên Tailwind classes
   ↓
6.3. DynamicZone.exportStyles() được gọi:
   - Thu thập inline styles từ các component
   ↓
6.4. Nếu export với Tailwind:
   a. collectUsedClasses(html) → Set<string>
   ↓
   b. Lấy Tailwind CSS từ page (getTailwindCssFromPage)
   ↓
   c. purgeTailwindCss() → CSS đã được tối ưu
   ↓
   d. Kết hợp với editor CSS và DOM styles
   ↓
6.5. CodeManagerService.buildHtmlDocument():
   - Tạo HTML document hoàn chỉnh
   - Embed CSS vào <style> tag
   - Thêm CSS reset (background trắng, text đen)
   ↓
6.6. Download file HTML:
   - Tạo Blob từ HTML string
   - Tạo download link
   - Trigger download
   - Revoke object URL
```

### 5. Undo/Redo (History)

Người dùng thực hiện undo/redo:

```
7.1. Mỗi action (thêm/xóa/sửa component) tạo command
   ↓
7.2. Command được lưu vào history stack
   ↓
7.3. Khi user nhấn Ctrl+Z:
   - KeymapService trigger command "undo"
   - CommandService chạy undo handler
   - UndoManagerService lùi lại state trước đó
   - ComponentModelService restore previous state
   - Component được re-render
   ↓
7.4. Khi user nhấn Ctrl+Shift+Z:
   - Tương tự nhưng redo (tiến lên state sau)
```

### Tổng Quan Life-cycle Flow

```
┌─────────────────────────────────────────────────────────┐
│                    KHỞI TẠO                             │
│  Load → Bootstrap → Services Init → Render UI           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    XÂY DỰNG                              │
│  Kéo Thả → Tạo Component → Render → Update Model       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    CHỈNH SỬA                           │
│  Chọn Component → Edit Properties → Update Model        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    QUẢN LÝ TÀI SẢN                      │
│  Upload → View → Use in Components                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    LƯU TRỮ                              │
│  Save → Get Model → Store to Storage                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    XUẤT                                  │
│  Export → Generate HTML → Purge CSS → Download          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    TẮT                                  │
│  Cleanup → Destroy → Close                              │
└─────────────────────────────────────────────────────────┘
```

## 📚 Các module chính

### Core Modules

#### **CSS Module** (`core/css`)

Cung cấp chức năng purge Tailwind CSS và thu thập class.

- `collectUsedClasses(html: string)`: Thu thập các class CSS đang được sử dụng từ HTML
- `purgeTailwindCss(params)`: Purge Tailwind CSS, chỉ giữ lại các class đang được sử dụng
- `CssTreeWalker`: Duyệt và xử lý cây CSS
- `SelectorFilter`: Chức năng lọc selector
- `rework`: Parser và processor CSS

**Ví dụ sử dụng:**

```typescript
import { collectUsedClasses, purgeTailwindCss } from 'builder';

const html = '<div class="p-4 bg-blue-500 text-white rounded">Hello</div>';
const usedClasses = collectUsedClasses(html);
// Set { "p-4", "bg-blue-500", "text-white", "rounded" }

const tailwindCss = '...'; // Tailwind CSS đầy đủ
const purgedCss = purgeTailwindCss({
  tailwindCss,
  usedClasses,
});
```

**Kết quả:**

- **Input HTML**: `<div class="p-4 bg-blue-500 text-white rounded">Hello</div>`
- **Used Classes**: `["p-4", "bg-blue-500", "text-white", "rounded"]`
- **Tailwind CSS gốc**: ~3MB (đầy đủ)
- **CSS sau khi purge**: ~2-5KB (chỉ giữ các class đang sử dụng)
- **Giảm kích thước**: ~99.8% (từ 3MB xuống còn vài KB)

**Ví dụ CSS đã purge:**

```css
/* Chỉ giữ lại các class đang sử dụng */
.p-4 {
  padding: 1rem;
}
.bg-blue-500 {
  background-color: #3b82f6;
}
.text-white {
  color: #ffffff;
}
.rounded {
  border-radius: 0.25rem;
}
```

#### **Code Manager** (`core/code-manager`)

Quản lý việc tạo và xuất HTML/CSS/JS.

- `CodeManagerService`: Quản lý tạo và xuất code
- `buildHtmlDocument(params)`: Tạo tài liệu HTML hoàn chỉnh
- `downloadHtml(params)`: Tải xuống file HTML
- `downloadCss(params)`: Tải xuống file CSS
- `downloadPurgedTailwindHtml(params)`: Tải xuống HTML kèm Tailwind CSS đã purge

**Ví dụ sử dụng:**
t

```typescript
import { CodeManagerService } from 'builder';

const codeManager = inject(CodeManagerService);

// Tạo tài liệu HTML
const doc = codeManager.buildHtmlDocument({
  html: '<div>Hello</div>',
  css: 'body { margin: 0; }',
  title: 'My Page',
});

// Tải xuống file HTML
codeManager.downloadHtml({
  html: '<div>Hello</div>',
  css: 'body { margin: 0; }',
  title: 'My Page',
  filename: 'index.html',
});

// Tải xuống HTML kèm Tailwind CSS đã purge
codeManager.downloadPurgedTailwindHtml({
  html: '<div class="p-4">Hello</div>',
  editorCss: 'body { margin: 0; }',
  tailwindCss: '...', // Tailwind CSS đầy đủ
  filenameHtml: 'index.html',
  filenameCss: 'styles.css',
  title: 'My Page',
});
```

**Tích hợp với EditorService:**

`CodeManagerService` phụ thuộc vào `EditorService` để lấy HTML/CSS/JS:

```typescript
// CodeManagerService internally calls:
codeManager.getHtml()      → editorService.getHtml()
codeManager.getCss()       → editorService.getCss()
codeManager.getJs()        → editorService.getJs()
```

**Tích hợp với Generator Services:**

`EditorService` sử dụng Generator Services để tạo code:

```typescript
// EditorService internally calls:
editorService.getHtml()    → htmlGenerator.generateFromRoot()
editorService.getCss()     → cssGenerator.build(rootComponent)
editorService.getJs()      → jsGenerator.build(rootComponent)
```

**Kiến trúc tích hợp:**

```
ComponentModel
    ↓
Generator Services (HtmlGeneratorService, CssGeneratorService, JsGeneratorService)
    ↓
EditorService (getHtml, getCss, getJs)
    ↓
CodeManagerService (buildHtmlDocument, downloadHtml)
    ↓
Export (HTML/CSS/JS files)
```

**Các method chi tiết:**

- **`getHtml(opts?)`**: Lấy HTML từ EditorService (sử dụng HtmlGeneratorService)
- **`getCss(opts?)`**: Lấy CSS từ EditorService (sử dụng CssGeneratorService)
- **`getJs(opts?)`**: Lấy JS từ EditorService (sử dụng JsGeneratorService)
- **`getBundle(opts?)`**: Lấy bundle gồm HTML, CSS, JS
- **`buildHtmlDocument(params)`**: Tạo HTML document hoàn chỉnh với `<style>` tag và CSS reset
- **`downloadHtml(params)`**: Tạo Blob và trigger download
- **`downloadCss(params)`**: Tạo Blob CSS và trigger download
- **`downloadPurgedTailwindHtml(params)`**: Purge Tailwind CSS và download HTML + CSS files

#### **Code Generator** (`core/code-generator`)

Module xử lý việc tạo HTML/CSS/JS từ ComponentModel.

- `HtmlGeneratorService`: Tạo HTML từ ComponentModel
- `CssGeneratorService`: Tạo CSS từ ComponentModel
- `JsGeneratorService`: Tạo JavaScript từ ComponentModel (placeholder)

**Ví dụ sử dụng:**

```typescript
import { HtmlGeneratorService, CssGeneratorService, JsGeneratorService } from 'builder';

const htmlGenerator = inject(HtmlGeneratorService);
const cssGenerator = inject(CssGeneratorService);
const jsGenerator = inject(JsGeneratorService);

// Generate HTML từ root component
const html = htmlGenerator.generateFromRoot({ cleanId: true });

// Generate CSS từ component
const component = componentModelService.getRootComponent();
const css = cssGenerator.build(component, { keepUnusedStyles: false });

// Generate JS từ component (hiện tại là placeholder)
const js = jsGenerator.build(component);
```

**Tích hợp:**

- Phụ thuộc vào `ComponentModelService` để lấy component tree
- Sử dụng `ComponentModel.toHTML()` method để generate HTML
- Tích hợp với `CodeManagerService` để build HTML document

#### **Editor** (`core/editor`)

Quản lý các chức năng editor.

- `EditorService`: Quản lý trạng thái editor
- `SelectionService`: Quản lý component được chọn
- Lấy và cập nhật HTML/CSS/JS

#### **Style Manager** (`core/style-manager`)

Cung cấp chức năng quản lý style.

- Thiết lập style cho component
- Quản lý inline style
- Áp dụng CSS class

#### **Trait Manager** (`core/trait-manager`)

Quản lý các thuộc tính (trait) của component.

- Thêm/xóa/cập nhật thuộc tính
- Xác thực thuộc tính
- Thiết lập giá trị mặc định cho thuộc tính

#### **Asset Manager** (`core/asset-manager`)

Quản lý tài sản (hình ảnh, v.v.).

- `AssetManagerService`: Upload/xóa/lấy tài sản
- Quản lý URL tài sản
- Quản lý metadata tài sản

**Ví dụ sử dụng:**

```typescript
import { AssetManagerService } from 'builder';

const assetManager = inject(AssetManagerService);

// Upload hình ảnh
assetManager.uploadImage(file).subscribe((url) => {
  console.log('Uploaded:', url);
});

// Lấy tài sản
assetManager.getAssets().subscribe((assets) => {
  console.log('Assets:', assets);
});
```

#### **Storage Manager** (`core/storage-manager`)

Thực hiện lưu trữ dữ liệu.

- Lưu vào local storage
- Lưu vào session storage
- Đọc dữ liệu

#### **Undo Manager** (`core/undo-manager`)

Cung cấp chức năng hoàn tác/làm lại.

- Quản lý lịch sử lệnh
- Thao tác Undo/Redo
- Xóa lịch sử

#### **Modal Dialog** (`core/modal-dialog`)

Cung cấp dịch vụ modal dialog.

- `ModalService`: Quản lý mở/đóng modal
- Tải component động
- Quản lý trạng thái modal

**Ví dụ sử dụng:**

```typescript
import { ModalService } from 'builder';

const modalService = inject(ModalService);

// Mở modal
modalService.open(ImageSelectModalComponent, {
  data: { currentImage: '...' },
});

// Đóng modal
modalService.close();
```

#### **Parser** (`core/parser`)

Cung cấp parser HTML/CSS.

- `ParserService`: Parse HTML
- Xây dựng cây DOM
- Phân tích component

#### **Commands** (`core/commands`)

Cung cấp triển khai command pattern.

- Thực thi lệnh
- Undo/Redo lệnh
- Quản lý lịch sử lệnh

#### **Plugin Manager** (`core/plugin-manager`)

Cung cấp hệ thống plugin.

- `PluginService`: Đăng ký và quản lý plugin
- Tải plugin
- Giao tiếp giữa các plugin

#### **Selector Manager** (`core/selector-manager`)

Quản lý selector.

- Chọn component
- Quản lý trạng thái chọn
- Thao tác phạm vi chọn

#### **Keymaps** (`core/keymaps`)

Cung cấp quản lý phím tắt.

- `KeymapService`: Đăng ký phím tắt
- Thực thi phím tắt
- Giải quyết xung đột phím tắt

### Widgets

#### **Dynamic Zone** (`widgets/dynamic-zone`)

Vùng để thêm và quản lý component bằng cách kéo và thả.

**Chức năng:**

- Kéo và thả component
- Thêm/xóa/di chuyển component
- Chọn component
- Hiển thị chỉ báo vị trí thả
- Xuất HTML/CSS

**Ví dụ sử dụng:**

```typescript
import { DynamicZone } from 'builder';

@Component({
  template: `
    <app-dynamic-zone
      [registry]="registry"
      [componentDefinitions]="componentDefinitions"
      #dz
    ></app-dynamic-zone>
  `,
})
export class MyComponent {
  registry = {
    card: CardComponent,
    list: ListComponent,
    image: ImageComponent,
  };

  componentDefinitions = {
    card: {
      tag: 'div',
      classes: ['p-4', 'bg-white', 'rounded', 'shadow'],
      children: [],
    },
  };
}
```

**Phương thức:**

- `add(key: string, options?)`: Thêm component
- `exportHtml()`: Xuất HTML
- `exportStyles()`: Xuất inline style

#### **Tool Box** (`widgets/ToolBoxs`)

Hộp công cụ chứa các component có thể kéo.

**Chức năng:**

- Chuyển đổi tab (Regular/Symbols)
- Dropdown theo danh mục (Basic, Forms, Extra, Layout)
- Hiển thị các item có thể kéo
- Phát sự kiện thêm item

**Ví dụ sử dụng:**

```typescript
import { ToolBox } from 'builder';

@Component({
  template: ` <app-tool-box (addWidget)="onAddWidget($event)"></app-tool-box> `,
})
export class MyComponent {
  onAddWidget(key: string) {
    this.dynamicZone.add(key);
  }
}
```

**Danh mục:**

- **Basic**: 1-columns, Image, List, Card
- **Forms**: Component form
- **Extra**: Navbar, v.v.
- **Layout**: Component layout

#### **Components** (`widgets/components`)

Các component có thể tái sử dụng.

##### **Card Component** (`components/card`)

Component card.

**Ví dụ sử dụng:**

```html
<app-card>
  <h2>Card Title</h2>
  <p>Card content</p>
  <button>Action</button>
</app-card>
```

**Style:**

- Sử dụng Tailwind CSS
- Style có thể tùy chỉnh

##### **List Component** (`components/list`)

Component danh sách.

**Ví dụ sử dụng:**

```html
<app-list>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</app-list>
```

##### **Image Component** (`components/image`)

Component hình ảnh.

**Chức năng:**

- Modal chọn hình ảnh
- Upload hình ảnh
- Nhập URL hình ảnh
- Xóa hình ảnh

**Ví dụ sử dụng:**

```html
<app-image [src]="imageSrc" [alt]="imageAlt"></app-image>
```

##### **Navbar Component** (`components/navbar`)

Component thanh điều hướng.

**Ví dụ sử dụng:**

```html
<app-navbar>
  <a href="/">Home</a>
  <a href="/about">About</a>
  <a href="/contact">Contact</a>
</app-navbar>
```

##### **Section Component** (`components/section`)

Component section.

##### **A Component** (`components/a`)

Component link.

##### **Banner Component** (`components/banner`)

Component banner.

##### **Canvas Widget** (`components/canvas-widget`)

Widget canvas.

#### **Block Manager** (`widgets/block-manager`)

Panel quản lý block.

**Chức năng:**

- Hiển thị danh sách block
- Thêm/xóa block
- Chỉnh sửa block

#### **Navigator** (`widgets/navigator`)

Panel điều hướng cấu trúc phân cấp component.

**Chức năng:**

- Hiển thị cây component
- Chọn component
- Hiển thị cấu trúc phân cấp component

#### **Canvas** (`widgets/canvas`)

Component canvas.

#### **Assets** (`widgets/assets`)

Panel quản lý tài sản.

**Chức năng:**

- Hiển thị danh sách tài sản
- Upload tài sản
- Xóa tài sản
- Tìm kiếm tài sản

#### **Modal** (`widgets/modal`)

Component modal.

**Chức năng:**

- Hiển thị modal
- Tải component động
- Xử lý đóng modal

#### **HTML Block** (`widgets/html-block`)

Component block HTML.

**Chức năng:**

- Nhập HTML tùy chỉnh
- Hiển thị HTML
- Chỉnh sửa HTML

#### **Drop Indicator** (`widgets/drop-indicator`)

Chỉ báo vị trí thả.

**Chức năng:**

- Hiển thị vị trí thả
- Animation vị trí thả
- Cập nhật vị trí thả

## 💡 Ví dụ sử dụng đầy đủ

### Thiết lập cơ bản

```typescript
import { Component, inject } from '@angular/core';
import {
  DynamicZone,
  ToolBox,
  CodeManagerService,
  collectUsedClasses,
  purgeTailwindCss,
  ModalService,
  AssetManagerService,
} from 'builder';

@Component({
  selector: 'app-page-builder',
  template: `
    <div class="builder-container">
      <!-- Toolbox -->
      <div class="sidebar">
        <app-tool-box (addWidget)="onAddWidget($event)"></app-tool-box>
      </div>

      <!-- Canvas -->
      <div class="canvas">
        <app-dynamic-zone
          #dz
          [registry]="registry"
          [componentDefinitions]="componentDefinitions"
        ></app-dynamic-zone>
      </div>

      <!-- Actions -->
      <div class="toolbar">
        <button (click)="exportHtml()">Export HTML</button>
        <button (click)="exportWithTailwind()">Export with Tailwind</button>
      </div>
    </div>
  `,
})
export class PageBuilderComponent {
  // Services
  private codeManager = inject(CodeManagerService);
  private modalService = inject(ModalService);
  private assetManager = inject(AssetManagerService);

  // Component registry
  registry = {
    card: CardComponent,
    list: ListComponent,
    image: ImageComponent,
    navbar: NavbarComponent,
    '1-columns': RowComponent,
  };

  // Component definitions
  componentDefinitions = {
    card: {
      tag: 'div',
      classes: ['p-4', 'bg-white', 'rounded', 'shadow'],
      children: [
        {
          tag: 'h2',
          classes: ['text-xl', 'font-bold'],
          content: 'Card Title',
        },
        {
          tag: 'p',
          classes: ['mt-2', 'text-gray-600'],
          content: 'Card content',
        },
      ],
    },
    '1-columns': {
      tag: 'div',
      classes: ['row'],
      children: [
        {
          tag: 'div',
          classes: ['column'],
          children: [],
        },
      ],
    },
  };

  @ViewChild('dz') dynamicZone!: DynamicZone;

  onAddWidget(key: string) {
    this.dynamicZone.add(key, { append: true });
  }

  async exportWithTailwind() {
    if (!this.dynamicZone) return;

    const inner = this.dynamicZone.exportHtml();
    const domStyles = this.dynamicZone.exportStyles();

    // Thu thập các class đang được sử dụng
    const usedClasses = collectUsedClasses(inner);

    // Lấy Tailwind CSS từ trang
    const tailwindCss = await this.getTailwindCssFromPage();

    if (tailwindCss) {
      // Purge Tailwind CSS
      const purgedCss = purgeTailwindCss({
        tailwindCss,
        usedClasses,
      });

      const combinedCss = `${purgedCss}\n${domStyles}`;

      // Tạo tài liệu HTML
      this.codeManager.downloadHtml({
        html: inner,
        css: combinedCss,
        title: 'Export Tailwind',
        filename: 'index.html',
      });
    }
  }

  exportHtml() {
    if (!this.dynamicZone) return;

    const inner = this.dynamicZone.exportHtml();
    const styles = this.dynamicZone.exportStyles();

    this.codeManager.downloadHtml({
      html: inner,
      css: styles,
      title: 'Export',
      filename: 'index.html',
    });
  }

  private async getTailwindCssFromPage(): Promise<string> {
    // Logic để lấy Tailwind CSS từ trang
    // ...
    return '';
  }
}
```

### Ví dụ sử dụng Generator Services (End-to-End)

Ví dụ đầy đủ sử dụng Generator Services với CodeManagerService:

```typescript
import { Component, inject } from '@angular/core';
import {
  HtmlGeneratorService,
  CssGeneratorService,
  JsGeneratorService,
  CodeManagerService,
  ComponentModelService,
  collectUsedClasses,
  purgeTailwindCss,
} from 'builder';

@Component({
  selector: 'app-page-builder',
  template: `
    <div class="builder-container">
      <app-dynamic-zone
        #dz
        [registry]="registry"
        [componentDefinitions]="componentDefinitions"
      ></app-dynamic-zone>

      <div class="toolbar">
        <button (click)="exportUsingGenerators()">Export với Generator Services</button>
        <button (click)="exportWithTailwindPurge()">Export với Tailwind Purge</button>
      </div>
    </div>
  `,
})
export class PageBuilderComponent {
  // Inject services
  private htmlGenerator = inject(HtmlGeneratorService);
  private cssGenerator = inject(CssGeneratorService);
  private jsGenerator = inject(JsGeneratorService);
  private codeManager = inject(CodeManagerService);
  private componentModelService = inject(ComponentModelService);

  @ViewChild('dz') dynamicZone!: DynamicZone;

  /**
   * Export sử dụng Generator Services trực tiếp
   */
  exportUsingGenerators() {
    // 1. Lấy root component từ ComponentModelService
    const rootComponent = this.componentModelService.getRootComponent();
    if (!rootComponent) {
      console.warn('No root component found');
      return;
    }

    // 2. Generate HTML từ ComponentModel
    const html = this.htmlGenerator.generateFromRoot({
      cleanId: true, // Xóa ID khi export
    });

    // 3. Generate CSS từ ComponentModel
    const css = this.cssGenerator.build(rootComponent, {
      keepUnusedStyles: false,
    });

    // 4. Generate JS từ ComponentModel (hiện tại là placeholder)
    const js = this.jsGenerator.build(rootComponent);

    // 5. Build HTML document và download
    this.codeManager.downloadHtml({
      html,
      css,
      title: 'Export với Generator Services',
      filename: 'index.html',
    });
  }

  /**
   * Export với Tailwind CSS purging
   */
  async exportWithTailwindPurge() {
    const rootComponent = this.componentModelService.getRootComponent();
    if (!rootComponent) return;

    // 1. Generate HTML từ ComponentModel
    const html = this.htmlGenerator.generateFromRoot({
      cleanId: true,
    });

    // 2. Generate editor CSS từ ComponentModel
    const editorCss = this.cssGenerator.build(rootComponent, {
      keepUnusedStyles: false,
    });

    // 3. Thu thập các Tailwind classes đang được sử dụng
    const usedClasses = collectUsedClasses(html);

    // 4. Lấy Tailwind CSS từ trang (hoặc từ file)
    const tailwindCss = await this.getTailwindCssFromPage();

    if (tailwindCss) {
      // 5. Purge Tailwind CSS chỉ giữ lại classes đang sử dụng
      // 6. Download HTML và CSS files riêng biệt
      this.codeManager.downloadPurgedTailwindHtml({
        html,
        editorCss,
        tailwindCss,
        whitelist: ['.container', '.prose'], // Giữ lại các class này
        filenameHtml: 'index.html',
        filenameCss: 'styles.css',
        title: 'Export với Tailwind Purge',
      });
    }
  }

  /**
   * Export chỉ HTML (không có CSS)
   */
  exportHtmlOnly() {
    const html = this.htmlGenerator.generateFromRoot({
      cleanId: true,
    });

    // Tạo HTML document chỉ với HTML (không có CSS)
    const doc = this.codeManager.buildHtmlDocument({
      html,
      css: '',
      title: 'HTML Only',
    });

    // Download
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export bundle (HTML + CSS + JS)
   */
  exportBundle() {
    const rootComponent = this.componentModelService.getRootComponent();
    if (!rootComponent) return;

    // Generate tất cả
    const html = this.htmlGenerator.build(rootComponent);
    const css = this.cssGenerator.build(rootComponent);
    const js = this.jsGenerator.build(rootComponent);

    // Lấy bundle từ CodeManagerService
    const bundle = this.codeManager.getBundle({
      htmlOptions: {},
      cssOptions: {},
      jsOptions: {},
    });

    // Build document với bundle
    const doc = this.codeManager.buildHtmlDocument({
      html: bundle.html,
      css: bundle.css,
      title: 'Export Bundle',
    });

    // Download
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bundle.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  private async getTailwindCssFromPage(): Promise<string> {
    // Lấy Tailwind CSS từ stylesheet trên trang
    const styleSheets = Array.from(document.styleSheets);
    for (const sheet of styleSheets) {
      try {
        if (sheet.href && sheet.href.includes('tailwind')) {
          const response = await fetch(sheet.href);
          return await response.text();
        }
      } catch (e) {
        console.warn('Cannot access stylesheet:', e);
      }
    }
    return '';
  }
}
```

**Flow của ví dụ trên:**

```
1. ComponentModel được tạo từ component tree
   ↓
2. HtmlGeneratorService.generateFromRoot() → HTML string
   - ComponentModel.toHTML() được gọi recursively
   - Attributes, classes, styles được convert thành HTML
   ↓
3. CssGeneratorService.build() → CSS string
   - Duyệt component tree recursively
   - Thu thập inline styles
   - Tạo CSS rules với selector từ id/class
   ↓
4. collectUsedClasses(html) → Set<string>
   - Parse HTML và extract tất cả classes
   ↓
5. purgeTailwindCss() → Purged CSS
   - Chỉ giữ lại CSS rules cho classes đang sử dụng
   ↓
6. CodeManagerService.downloadPurgedTailwindHtml()
   - Kết hợp HTML, editor CSS, purged Tailwind CSS
   - Tạo Blob và trigger download
   ↓
7. Download files (index.html + styles.css)
```

### Thêm component tùy chỉnh

```typescript
import { Component, Type } from '@angular/core';
import { DynamicZone } from 'builder';

// Tạo component tùy chỉnh
@Component({
  selector: 'app-custom-widget',
  template: `
    <div class="custom-widget p-4 bg-blue-500 text-white rounded">
      <h3>Custom Widget</h3>
      <p>This is a custom widget</p>
    </div>
  `,
})
export class CustomWidgetComponent {}

// Thêm vào registry
export class MyComponent {
  registry = {
    'custom-widget': CustomWidgetComponent,
  };

  componentDefinitions = {
    'custom-widget': {
      tag: 'div',
      classes: ['custom-widget', 'p-4', 'bg-blue-500', 'text-white', 'rounded'],
      children: [
        {
          tag: 'h3',
          classes: [],
          content: 'Custom Widget',
        },
        {
          tag: 'p',
          classes: [],
          content: 'This is a custom widget',
        },
      ],
    },
  };
}
```

## 🔧 Tài liệu API đầy đủ

### CSS Module

#### `collectUsedClasses(html: string): Set<string>`

Thu thập các class CSS đang được sử dụng từ chuỗi HTML.

**Tham số:**

- `html`: Chuỗi HTML

**Giá trị trả về:**

- `Set<string>` chứa các class đang được sử dụng

**Ví dụ:**

```typescript
const html = '<div class="p-4 bg-blue-500">Hello</div>';
const classes = collectUsedClasses(html);
// Set { "p-4", "bg-blue-500" }
```

#### `purgeTailwindCss(params): string`

Purge Tailwind CSS, chỉ giữ lại các class đang được sử dụng.

**Tham số:**

```typescript
{
  tailwindCss: string;        // Chuỗi Tailwind CSS đầy đủ
  usedClasses: Set<string>;   // Set các class đang được sử dụng
  whitelist?: string[];        // Các selector luôn giữ lại (tùy chọn)
}
```

**Giá trị trả về:**

- Chuỗi CSS đã được purge

**Ví dụ:**

```typescript
const purgedCss = purgeTailwindCss({
  tailwindCss: '...', // Tailwind CSS đầy đủ
  usedClasses: new Set(['p-4', 'bg-blue-500']),
  whitelist: ['.container', '.prose'],
});
```

### Code Manager Service

#### `buildHtmlDocument(params): string`

Tạo tài liệu HTML hoàn chỉnh.

**Tham số:**

```typescript
{
  html?: string;   // Chuỗi HTML (tùy chọn)
  css?: string;    // Chuỗi CSS (tùy chọn)
  title?: string;   // Tiêu đề trang (tùy chọn, mặc định: 'Export')
}
```

**Giá trị trả về:**

- Chuỗi tài liệu HTML hoàn chỉnh

#### `downloadHtml(params): void`

Tải xuống file HTML.

**Tham số:**

```typescript
{
  html?: string;            // Chuỗi HTML (tùy chọn)
  css?: string;             // Chuỗi CSS (tùy chọn)
  title?: string;           // Tiêu đề trang (tùy chọn)
  filename?: string;        // Tên file (tùy chọn, mặc định: 'export.html')
  tailwindCdnUrl?: string;  // URL Tailwind CDN (tùy chọn)
}
```

#### `downloadCss(params): void`

Tải xuống file CSS.

**Tham số:**

```typescript
{
  css?: string;      // Chuỗi CSS (tùy chọn)
  filename?: string; // Tên file (tùy chọn, mặc định: 'styles.css')
}
```

#### `downloadPurgedTailwindHtml(params): void`

Tải xuống HTML kèm Tailwind CSS đã purge.

**Tham số:**

```typescript
{
  html?: string;         // Chuỗi HTML (tùy chọn)
  editorCss?: string;    // CSS của editor (tùy chọn)
  tailwindCss: string;   // Chuỗi Tailwind CSS đầy đủ (bắt buộc)
  whitelist?: string[];  // Whitelist (tùy chọn)
  filenameHtml?: string; // Tên file HTML (tùy chọn, mặc định: 'index.html')
  filenameCss?: string;  // Tên file CSS (tùy chọn, mặc định: 'styles.css')
  title?: string;        // Tiêu đề trang (tùy chọn)
}
```

### Dynamic Zone

#### `add(key: string, options?): void`

Thêm component.

**Tham số:**

- `key`: Khóa component (khóa trong registry)
- `options?`: Tùy chọn
  - `append?: boolean`: Thêm vào cuối hay không (mặc định: false)
  - `index?: number`: Chỉ số vị trí chèn

#### `exportHtml(): string`

Xuất HTML.

**Giá trị trả về:**

- Chuỗi HTML

#### `exportStyles(): string`

Xuất inline style.

**Giá trị trả về:**

- Chuỗi CSS

### Tool Box

#### `addWidget` Event

Phát sự kiện thêm component.

**Dữ liệu sự kiện:**

- `key: string`: Khóa component

## 💻 Source Code

### Kiến trúc Source Code

Thư viện được tổ chức theo kiến trúc modular, chia thành 2 phần chính:

#### 1. Core Modules (`core/`)

Các module cốt lõi cung cấp chức năng nền tảng:

- **CSS Processing**: Parser, tree walker, selector filter
- **Code Generation**: HTML/CSS/JS export, document builder
- **State Management**: Editor, style, trait, asset management
- **System Services**: Storage, undo/redo, modal, commands, keymaps

#### 2. Widgets (`widgets/`)

Các component UI có thể sử dụng:

- **Dynamic Zone**: Canvas kéo và thả
- **Tool Box**: Sidebar chứa các component có thể kéo
- **Components**: Card, List, Image, Navbar, Section, v.v.
- **Panels**: Block manager, Navigator, Assets panel

### Cách Source Code Hoạt Động

#### Flow Kéo và Thả

```
1. User kéo component từ ToolBox
   ↓
2. ToolBox phát event `addWidget` với key
   ↓
3. DynamicZone nhận event và tạo component từ registry
   ↓
4. Component được render vào ViewContainerRef
   ↓
5. ComponentModel được tạo và lưu vào ComponentModelService
   ↓
6. Component hiển thị trên canvas
```

#### Flow Xuất HTML

```
1. User click "Export HTML"
   ↓
2. DynamicZone.exportHtml() được gọi
   ↓
3. Duyệt qua ComponentModel tree
   ↓
4. Tạo HTML từ componentDefinitions
   ↓
5. Thu thập CSS classes bằng collectUsedClasses()
   ↓
6. Purge Tailwind CSS bằng purgeTailwindCss()
   ↓
7. Tạo HTML document với CodeManagerService
   ↓
8. Download file HTML
```

#### Flow CSS Purging

```
1. collectUsedClasses(html) → Set<string>
   ↓
2. Parse Tailwind CSS thành AST
   ↓
3. CssTreeWalker duyệt AST
   ↓
4. SelectorFilter lọc rules dựa trên used classes
   ↓
5. Stringify AST thành CSS
   ↓
6. Kết quả: CSS chỉ chứa rules đang được sử dụng
```

### Code Generator Services (`core/code-generator`)

Module xử lý việc tạo HTML/CSS/JS từ ComponentModel.

#### HtmlGeneratorService

Service tạo HTML từ ComponentModel.

**Chức năng:**

- Generate HTML từ ComponentModel bằng cách sử dụng `toHTML()` method
- Hỗ trợ generate từ root component thông qua `ComponentModelService`
- Tích hợp với `ComponentModel.toHTML()` method để tạo HTML string

**Cách hoạt động:**

- Nhận `ComponentModel` và `HTMLGeneratorBuildOptions` làm input
- Gọi `component.toHTML(opts)` để generate HTML
- Hỗ trợ `generateFromRoot()` để generate HTML từ root component

**Ví dụ sử dụng:**

```typescript
import { HtmlGeneratorService } from 'builder';

const htmlGenerator = inject(HtmlGeneratorService);
const component = componentModelService.getRootComponent();
const html = htmlGenerator.build(component, { cleanId: true });
```

**Tích hợp:**

- Phụ thuộc vào `ComponentModelService` để lấy root component
- Sử dụng `ComponentModel.toHTML()` method để generate HTML
- Tích hợp với `CodeManagerService` để build HTML document

#### CssGeneratorService

Service tạo CSS từ ComponentModel.

**Chức năng:**

- Generate CSS từ ComponentModel bằng cách thu thập inline styles
- Thu thập styles từ component tree một cách recursive
- Tạo CSS rules từ inline styles với selector dựa trên id hoặc class

**Cách hoạt động:**

- Duyệt qua ComponentModel tree một cách recursive
- Thu thập inline styles từ mỗi component
- Tạo CSS selector từ component id (ưu tiên) hoặc class đầu tiên
- Generate CSS rules từ collected styles

**Ví dụ sử dụng:**

```typescript
import { CssGeneratorService } from 'builder';

const cssGenerator = inject(CssGeneratorService);
const component = componentModelService.getRootComponent();
const css = cssGenerator.build(component, { keepUnusedStyles: false });
```

**Lưu ý:**

- Hiện tại chỉ thu thập inline styles
- TODO: Tích hợp với CSS Composer trong tương lai
- Selector được tạo từ id (ưu tiên) hoặc class đầu tiên

#### JsGeneratorService

Service tạo JavaScript từ ComponentModel.

**Chức năng:**

- Generate JavaScript từ ComponentModel (hiện tại là placeholder)
- Dự kiến sẽ thu thập scripts từ component tree trong tương lai

**Cách hoạt động:**

- Hiện tại chỉ return empty string
- TODO: Collect scripts từ component tree trong tương lai

**Ví dụ sử dụng:**

```typescript
import { JsGeneratorService } from 'builder';

const jsGenerator = inject(JsGeneratorService);
const component = componentModelService.getRootComponent();
const js = jsGenerator.build(component);
```

**Lưu ý:**

- Hiện tại là placeholder implementation
- TODO: Tích hợp với script management trong tương lai

#### Flow Code Generation

Quy trình tạo code từ ComponentModel:

```
1. ComponentModel được tạo từ component tree
   ↓
2. HtmlGeneratorService.build(component) → HTML string
   - ComponentModel.toHTML() được gọi
   - Recursive generate HTML từ component tree
   - Attributes, classes, styles được convert thành HTML attributes
   ↓
3. CssGeneratorService.build(component) → CSS string
   - Duyệt component tree một cách recursive
   - Thu thập inline styles từ mỗi component
   - Tạo CSS rules với selector từ id/class
   ↓
4. JsGeneratorService.build(component) → JS string (placeholder)
   - Hiện tại return empty string
   - TODO: Collect scripts từ component tree
   ↓
5. CodeManagerService.buildHtmlDocument() → HTML document
   - Kết hợp HTML, CSS, JS
   - Tạo HTML document hoàn chỉnh với <style> tag
   - Thêm CSS reset (background trắng, text đen)
   ↓
6. Download file HTML/CSS
   - Tạo Blob từ HTML/CSS string
   - Tạo download link và trigger download
```

#### Tích hợp với CodeManagerService

Code Generator Services được tích hợp với `CodeManagerService`:

- **CodeManagerService.getHtml()**: Sử dụng `EditorService.getHtml()` để lấy HTML
- **CodeManagerService.getCss()**: Sử dụng `EditorService.getCss()` để lấy CSS
- **CodeManagerService.getJs()**: Sử dụng `EditorService.getJs()` để lấy JS
- **CodeManagerService.buildHtmlDocument()**: Kết hợp HTML, CSS để tạo HTML document
- **CodeManagerService.downloadPurgedTailwindHtml()**: Kết hợp với CSS purging để tối ưu CSS

**Kiến trúc:**

```
ComponentModel
    ↓
Generator Services (HtmlGeneratorService, CssGeneratorService, JsGeneratorService)
    ↓
EditorService (getHtml, getCss, getJs)
    ↓
CodeManagerService (buildHtmlDocument, downloadHtml)
    ↓
Export (HTML/CSS/JS files)
```

#### Các File Source Code Chính

**Core Generator Services:**

- `core/code-generator/html-generator.service.ts`: HTML generator (34 lines)
- `core/code-generator/css-generator.service.ts`: CSS generator (49 lines)
- `core/code-generator/js-generator.service.ts`: JS generator (25 lines)
- `core/code-generator/index.ts`: Export tất cả generator services

**Tích hợp:**

- `core/code-manager/code-manager.service.ts`: Code generation manager (132 lines)
- `core/dom-components/model/component.model.ts`: ComponentModel class (266 lines)
- `core/dom-components/component-model.service.ts`: ComponentModelService

### Các File Source Code Chính

#### Core Services

- `core/css/index.ts`: CSS parser (11KB, 493 lines)
- `core/css/purge-tailwind.ts`: Purge logic (37 lines)
- `core/css/collect-used-classes.ts`: Class collector (18 lines)
- `core/css/CssTreeWalker.ts`: CSS tree traversal (107 lines)
- `core/css/SelectorFilter.ts`: Selector filtering (75 lines)
- `core/css/extractWordsUtils.ts`: Word extraction utilities (55 lines)
- `core/css/rework.ts`: CSS rework wrapper (24 lines)
- `core/code-generator/html-generator.service.ts`: HTML generator (34 lines)
- `core/code-generator/css-generator.service.ts`: CSS generator (49 lines)
- `core/code-generator/js-generator.service.ts`: JS generator (25 lines)
- `core/code-generator/index.ts`: Export all generator services
- `core/code-manager/code-manager.service.ts`: Code generation (132 lines)
- `core/asset-manager/asset-manager.service.ts`: Asset management
- `core/commands/command.service.ts`: Command system
- `core/keymaps/keymap.service.ts`: Keyboard shortcuts
- `core/modal-dialog/modal.service.ts`: Modal management

#### Widget Components

- `widgets/dynamic-zone/dynamic-zone.ts`: Main canvas (700 lines)
- `widgets/ToolBoxs/tool-box/tool-box.ts`: Sidebar (71 lines)
- `widgets/components/card/card.component.ts`: Card component
- `widgets/components/list/list.component.ts`: List component
- `widgets/components/navbar/navbar.component.ts`: Navbar component
- `widgets/components/section/section.ts`: Section container
- `widgets/components/a/a.component.ts`: A component
- `widgets/components/banner/banner.ts`: Banner component

#### Core Base Classes

- `core/core.base.ts`: Base class cho widgets (134 lines)
- `core/core.context.ts`: Context system cho component tree
- `core/dom-components/component-model.service.ts`: Component model management

### Export System

Thư viện export tất cả public API qua `src/index.ts`:

```typescript
// Core services
export * from './lib/core/asset-manager/asset-manager.service';
export * from './lib/core/commands';
export * from './lib/core/keymaps/keymap.service';
export * from './lib/core/modal-dialog/modal.service';
export * from './lib/core/code-manager/code-manager.service';

// CSS utilities
export * from './lib/core/css/collect-used-classes';
export * from './lib/core/css/purge-tailwind';

// Widgets
export * from './lib/widgets/dynamic-zone/dynamic-zone';
export * from './lib/widgets/ToolBoxs/tool-box/tool-box';
export * from './lib/widgets/components/a/a.component';
export * from './lib/widgets/components/section/section';
export * from './lib/widgets/components/navbar/navbar.component';
```

### Cấu trúc Source Code Chi Tiết

#### CSS Module (`core/css/`)

Module xử lý CSS với các file chính:

- **`index.ts`** (493 lines): CSS parser chính, parse CSS string thành AST
- **`purge-tailwind.ts`** (37 lines): Logic purge Tailwind CSS
- **`collect-used-classes.ts`** (18 lines): Thu thập class từ HTML
- **`CssTreeWalker.ts`** (107 lines): Duyệt và xử lý cây CSS
- **`SelectorFilter.ts`** (75 lines): Lọc selector dựa trên content
- **`extractWordsUtils.ts`** (55 lines): Extract words từ content và selector
- **`rework.ts`** (24 lines): Wrapper cho CSS parser và stringifier
- **`stringify/`**: Thư mục chứa CSS stringifier (compress/identity)

#### Dynamic Zone (`widgets/dynamic-zone/`)

Component chính xử lý kéo và thả (700 lines):

- Quản lý `ViewContainerRef` để render component động
- Xử lý drag & drop events
- Quản lý ComponentModel tree
- Tính toán vị trí drop indicator
- Export HTML và CSS

#### Component Model System

- **ComponentModel**: Class đại diện cho component trong model
- **ComponentModelService**: Quản lý component tree
- **ComponentDefinition**: Interface định nghĩa component structure

## 📁 Cấu trúc dự án

```
projects/builder/
├── src/
│   ├── lib/
│   │   ├── core/                    # Core modules
│   │   │   ├── css/                 # Xử lý CSS (purge, thu thập class)
│   │   │   │   ├── index.ts         # CSS parser (493 lines)
│   │   │   │   ├── collect-used-classes.ts  # Class collector (18 lines)
│   │   │   │   ├── purge-tailwind.ts  # Purge logic (37 lines)
│   │   │   │   ├── CssTreeWalker.ts  # Tree traversal (107 lines)
│   │   │   │   ├── SelectorFilter.ts  # Selector filter (75 lines)
│   │   │   │   ├── extractWordsUtils.ts  # Word extraction (55 lines)
│   │   │   │   ├── rework.ts  # CSS rework (24 lines)
│   │   │   │   └── stringify/  # CSS stringifier
│   │   │   ├── code-manager/        # Quản lý tạo code
│   │   │   │   └── code-manager.service.ts  # (132 lines)
│   │   │   ├── editor/              # Chức năng editor
│   │   │   │   ├── editor.service.ts
│   │   │   │   └── selection.service.ts
│   │   │   ├── style-manager/       # Quản lý style
│   │   │   ├── trait-manager/       # Quản lý thuộc tính
│   │   │   ├── asset-manager/       # Quản lý tài sản
│   │   │   │   └── asset-manager.service.ts
│   │   │   ├── storage-manager/     # Lưu trữ dữ liệu
│   │   │   ├── undo-manager/        # Undo/Redo
│   │   │   ├── modal-dialog/        # Modal dialog
│   │   │   │   └── modal.service.ts
│   │   │   ├── parser/               # Parser HTML/CSS
│   │   │   │   └── parser.service.ts
│   │   │   ├── commands/             # Command pattern
│   │   │   │   └── command.service.ts
│   │   │   ├── plugin-manager/       # Hệ thống plugin
│   │   │   │   └── plugin.service.ts
│   │   │   ├── selector-manager/     # Quản lý selector
│   │   │   ├── keymaps/              # Phím tắt
│   │   │   │   └── keymap.service.ts
│   │   │   ├── core.base.ts          # Base class (134 lines)
│   │   │   ├── core.context.ts       # Context system
│   │   │   ├── dom-components/       # Component model
│   │   │   │   └── component-model.service.ts
│   │   │   └── utils/               # Utilities
│   │   └── widgets/                  # UI widgets
│   │       ├── dynamic-zone/         # Vùng kéo và thả
│   │       │   ├── dynamic-zone.ts  # (700 lines)
│   │       │   ├── dynamic-zone.html
│   │       │   └── dynamic-zone.scss
│   │       ├── ToolBoxs/             # Toolbox
│   │       │   └── tool-box/
│   │       │       ├── tool-box.ts  # (71 lines)
│   │       │       ├── tool-box.html
│   │       │       └── tool-box.scss
│   │       ├── components/           # Component có thể tái sử dụng
│   │       │   ├── card/
│   │       │   ├── list/
│   │       │   ├── image/
│   │       │   ├── navbar/
│   │       │   ├── section/
│   │       │   ├── a/
│   │       │   ├── banner/
│   │       │   └── ...
│   │       ├── block-manager/        # Quản lý block
│   │       ├── navigator/            # Navigator
│   │       ├── canvas/               # Canvas
│   │       ├── assets/               # Assets
│   │       ├── modal/                # Modal
│   │       ├── html-block/           # HTML block
│   │       └── drop-indicator/       # Drop indicator
│   ├── index.ts                      # Export chính
│   └── public-api.ts                 # Public API
├── package.json
├── ng-package.json
├── tsconfig.lib.json
├── tsconfig.lib.prod.json
└── tsconfig.spec.json
```

## 🧪 Kiểm thử

Để chạy unit test:

```bash
ng test builder
```

Để chạy file test cụ thể:

```bash
ng test builder --include='**/dynamic-zone.spec.ts'
```

## 📦 Xuất bản

Để xuất bản thư viện:

1. Build dự án:

```bash
ng build builder
```

2. Di chuyển vào thư mục `dist`:

   ```bash
   cd dist/builder
   ```

3. Xuất bản lên npm:
   ```bash
   npm publish
   ```

## 🔗 Dependencies

### Peer Dependencies

Các thư viện này cần được cài đặt trong dự án sử dụng thư viện:

- `@angular/common`: ^20.3.0
- `@angular/core`: ^20.3.0
- `@angular/elements`: ^20.3.0

### Dependencies

Các thư viện được sử dụng trực tiếp:

- `tslib`: ^2.3.0

### Optional Dependencies

Các thư viện tùy chọn có thể được sử dụng:

- `primeng`: ^20.3.0 - UI component library
- `@primeuix/themes`: ^1.2.5 - PrimeNG theme system
- `tailwindcss`: ^3.4.13 - CSS framework
- `rxjs`: ~7.8.0 - Reactive extensions

## 🎯 Best Practices

### 1. Đăng ký component

Khuyến nghị đăng ký tất cả component vào registry và định nghĩa `componentDefinitions`.

```typescript
registry = {
  'my-component': MyComponent,
};

componentDefinitions = {
  'my-component': {
    tag: 'div',
    classes: ['my-component'],
    children: [],
  },
};
```

### 2. Purge Tailwind CSS

Khi xuất, luôn sử dụng `purgeTailwindCss` để xóa các class không được sử dụng.

```typescript
const usedClasses = collectUsedClasses(html);
const purgedCss = purgeTailwindCss({
  tailwindCss,
  usedClasses,
});
```

### 3. Xử lý lỗi

Xử lý lỗi đúng cách khi xuất.

```typescript
try {
  const html = this.dynamicZone.exportHtml();
  // ...
} catch (error) {
  console.error('Export failed:', error);
}
```

### 4. Hiệu suất

Khi xử lý nhiều component, nên xem xét tối ưu hóa như virtual scroll.

### 5. Sử dụng Generator Services cho custom component

Khi tạo custom component, đảm bảo ComponentModel được định nghĩa đúng để Generator Services có thể generate HTML/CSS:

```typescript
import { Component } from '@angular/core';
import { ComponentModel } from 'builder';

@Component({
  selector: 'app-custom-widget',
  template: `
    <div class="custom-widget" [style]="customStyles">
      <h3>{{ title }}</h3>
      <p>{{ content }}</p>
    </div>
  `,
})
export class CustomWidgetComponent {
  title = 'Custom Widget';
  content = 'Custom content';
  customStyles = { color: 'blue', padding: '10px' };
}

// ComponentDefinition phải match với component structure
export const customWidgetDefinition: ComponentDefinition = {
  tagName: 'div',
  classes: ['custom-widget'],
  style: {
    color: 'blue',
    padding: '10px',
  },
  components: [
    {
      tagName: 'h3',
      content: 'Custom Widget',
    },
    {
      tagName: 'p',
      content: 'Custom content',
    },
  ],
};
```

**Lưu ý:**

- ComponentDefinition phải match với component template structure
- Inline styles phải được định nghĩa trong `style` property
- Classes phải được định nghĩa trong `classes` array
- Nested components phải được định nghĩa trong `components` array

### 6. Tối ưu hóa Code Generation

**a. Lazy loading cho Generator Services:**

```typescript
import { inject } from '@angular/core';
import { HtmlGeneratorService } from 'builder';

export class PageBuilderComponent {
  // Lazy inject để tránh circular dependency
  private get htmlGenerator() {
    return inject(HtmlGeneratorService);
  }

  exportHtml() {
    const html = this.htmlGenerator.generateFromRoot({ cleanId: true });
    // ...
  }
}
```

**b. Cache generated code:**

```typescript
export class PageBuilderComponent {
  private htmlCache: string | null = null;
  private cssCache: string | null = null;

  exportHtml() {
    if (!this.htmlCache) {
      this.htmlCache = this.htmlGenerator.generateFromRoot({ cleanId: true });
    }
    return this.htmlCache;
  }

  invalidateCache() {
    this.htmlCache = null;
    this.cssCache = null;
  }
}
```

**c. Batch operations:**

```typescript
export class PageBuilderComponent {
  exportAll() {
    // Generate tất cả cùng lúc thay vì từng cái một
    const bundle = this.codeManager.getBundle({
      htmlOptions: { cleanId: true },
      cssOptions: { keepUnusedStyles: false },
      jsOptions: {},
    });

    // Sử dụng bundle
    this.codeManager.downloadHtml({
      html: bundle.html,
      css: bundle.css,
      title: 'Export',
    });
  }
}
```

**d. Async operations cho large components:**

```typescript
export class PageBuilderComponent {
  async exportLargeComponent() {
    // Sử dụng Web Worker hoặc async để tránh block UI
    const html = await this.generateHtmlAsync();
    const css = await this.generateCssAsync();

    this.codeManager.downloadHtml({ html, css });
  }

  private generateHtmlAsync(): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const html = this.htmlGenerator.generateFromRoot();
        resolve(html);
      }, 0);
    });
  }
}
```

### 7. Custom Generator Options

Sử dụng options để customize generation:

```typescript
// HTML generation options
const html = this.htmlGenerator.generateFromRoot({
  cleanId: true, // Xóa ID khi export
  keepInlineStyle: false, // Không giữ inline style trong HTML
  withProps: true, // Giữ props trong HTML
});

// CSS generation options
const css = this.cssGenerator.build(component, {
  keepUnusedStyles: false, // Xóa unused styles
  avoidProtected: true, // Tránh protected styles
});

// ComponentModel toHTML options
const html = component.toHTML({
  tag: 'custom-tag', // Custom tag
  attributes: {
    // Custom attributes
    'data-export': 'true',
    'data-version': '1.0',
  },
  keepInlineStyle: false, // Không giữ inline style
});
```

### 8. Error Handling cho Generation

Luôn xử lý lỗi khi generate code:

```typescript
export class PageBuilderComponent {
  async exportWithErrorHandling() {
    try {
      const rootComponent = this.componentModelService.getRootComponent();
      if (!rootComponent) {
        throw new Error('No root component found');
      }

      const html = this.htmlGenerator.generateFromRoot();
      if (!html) {
        throw new Error('HTML generation failed');
      }

      const css = this.cssGenerator.build(rootComponent);
      if (!css) {
        console.warn('CSS generation returned empty string');
      }

      this.codeManager.downloadHtml({ html, css });
    } catch (error) {
      console.error('Export failed:', error);
      // Show error message to user
      this.showError('Export failed. Please try again.');
    }
  }
}
```

### 9. Performance Optimization Tips

**a. Minimize component tree depth:**

- Giảm độ sâu của component tree để tăng tốc độ generation
- Sử dụng flat structure khi có thể

**b. Use selective generation:**

```typescript
// Chỉ generate phần cần thiết
const specificComponent = this.componentModelService.getComponent('component-id');
const html = this.htmlGenerator.build(specificComponent);
```

**c. Optimize CSS generation:**

```typescript
// Chỉ generate CSS cho components có inline styles
const css = this.cssGenerator.build(component, {
  keepUnusedStyles: false, // Xóa unused styles
});
```

**d. Use Web Workers cho large exports:**

```typescript
// Move heavy operations to Web Worker
const worker = new Worker('code-generation.worker.ts');
worker.postMessage({ component: componentData });
worker.onmessage = (event) => {
  const { html, css } = event.data;
  this.codeManager.downloadHtml({ html, css });
};
```

## 🐛 Khắc phục sự cố

### Không thể lấy Tailwind CSS

Nếu không thể lấy Tailwind CSS từ trang, hãy kiểm tra:

1. Tailwind CSS đã được tải đúng chưa
2. Có lỗi CORS không
3. URL stylesheet có đúng không

### Component không hiển thị

Nếu component không hiển thị, hãy kiểm tra:

1. Component đã được đăng ký đúng trong registry chưa
2. `componentDefinitions` đã được định nghĩa chưa
3. Component đã được import đúng chưa

### Style không áp dụng cho HTML đã xuất

Nếu style không áp dụng cho HTML đã xuất, hãy kiểm tra:

1. CSS đã được xuất đúng chưa
2. Tailwind CSS đã được purge đúng chưa
3. Inline style đã được xuất đúng chưa
