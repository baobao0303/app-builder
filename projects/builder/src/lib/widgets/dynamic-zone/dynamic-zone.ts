import {
  Component,
  Input,
  Type,
  ViewChild,
  ViewContainerRef,
  ElementRef,
  ComponentRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreBase } from '../../core/core.base';
import { ComponentModelService } from '../../core/dom-components/component-model.service';
import { ComponentDefinition } from '../../core/dom-components/model/component.model';
import { HtmlBlock } from '../html-block/html-block';
import { ParserService } from '../../core/parser/parser.service';
import { SelectionService } from '../../core/editor/selection.service';
import { DropIndicatorService } from '../../core/utils/drop-indicator.service';

@Component({
  selector: 'app-dynamic-zone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dynamic-zone.html',
  styleUrl: './dynamic-zone.scss',
})
export class DynamicZone extends CoreBase {
  // Registry: key -> component type (được truyền từ ngoài, ví dụ toolbox quản lý map này)
  @Input() registry: Record<string, Type<unknown>> = {};

  // Registry cho component definitions (tùy chọn, để generate HTML từ model)
  @Input() componentDefinitions?: Record<string, ComponentDefinition>;

  @ViewChild('container', { read: ViewContainerRef, static: true })
  private container!: ViewContainerRef;

  @ViewChild('host', { static: true })
  private hostEl!: ElementRef<HTMLElement>;

  // Component hiện tại sẽ được tạo bởi CoreBase
  private nextComponent?: Type<any>;

  // Map ComponentRef -> ComponentModel để track
  private componentRefs = new Map<ComponentRef<any>, string>(); // ComponentRef -> componentId
  private refs: ComponentRef<any>[] = [];
  private selected?: ComponentRef<any>;

  // Services quản lý model và parse HTML
  private componentModelService = inject(ComponentModelService);
  private parser = inject(ParserService);
  private selection = inject(SelectionService);
  private dropIndicator = inject(DropIndicatorService);

  // Trạng thái để hiển thị highlight khi kéo vào vùng thả
  protected isDragOver = false;

  // Gọi từ toolbox khi click một item -> dùng helper của CoreBase
  add(key: string, options?: { append?: boolean; index?: number }): void {
    console.log('[DynamicZone.add] key=', key, 'options=', options);
    const cmp = this.registry[key];
    if (!cmp) return;
    this.nextComponent = cmp as Type<any>;
    this.setContainerRef(this.container);

    // Tạo ComponentModel nếu có definition
    let componentId: string | undefined;
    if (this.componentDefinitions && this.componentDefinitions[key]) {
      // Đảm bảo có root component cho DynamicZone
      let root = this.componentModelService.getRootComponent();
      if (!root) {
        root = this.componentModelService.setRootComponent({
          tagName: 'div',
          attributes: { 'data-zone': 'dynamic-zone' },
        });
      }

      // Tạo component model và add vào root với index
      const insertIndex = options?.index;
      const componentModel =
        insertIndex !== undefined
          ? this.componentModelService.createComponent(
              this.componentDefinitions[key],
              root.getId(),
              insertIndex
            )
          : this.componentModelService.createComponent(
              this.componentDefinitions[key],
              root.getId()
            );
      console.log('[DynamicZone.add] model created id=', componentModel.getId());
      componentId = componentModel.getId();
    }

    // Render Angular component với index nếu có
    let componentRef: ComponentRef<any> | undefined;
    if (options?.index !== undefined) {
      componentRef = this.insertWidget(this.nextComponent, options.index) as ComponentRef<any>;
    } else {
      componentRef = this.createWidget(this.nextComponent, { append: options?.append });
    }
    console.log('[DynamicZone.add] created componentRef? ', !!componentRef);

    // Track mapping nếu có
    if (componentRef && componentId) {
      this.componentRefs.set(componentRef, componentId);
    }

    // Enable internal drag to reorder
    if (componentRef) {
      this.registerDraggable(componentRef);
    }

    // Handle nested components from componentDefinitions
    if (componentRef && this.componentDefinitions && this.componentDefinitions[key]) {
      const definition = this.componentDefinitions[key];
      console.log(
        '[DynamicZone.add] definition has',
        definition.components?.length || 0,
        'children'
      );
      if (definition.components && definition.components.length > 0) {
        this.createNestedComponents(componentRef, definition.components);
      }
    }
  }

  private createNestedComponents(
    parentRef: ComponentRef<any>,
    children: ComponentDefinition[]
  ): void {
    console.log('[DynamicZone.createNestedComponents] Creating', children.length, 'children');
    // Get child container from parent component
    const parentContainer =
      typeof (parentRef.instance as any)?.getChildContainer === 'function'
        ? (parentRef.instance as any).getChildContainer()
        : null;

    if (!parentContainer) {
      console.warn('[DynamicZone] Parent component does not have getChildContainer()');
      return;
    }
    console.log('[DynamicZone.createNestedComponents] Parent container found');

    // Create child components
    children.forEach((childDef, index) => {
      // Find component type from registry based on data-widget attribute or tagName
      const widgetKey = childDef.attributes?.['data-widget'];
      const componentType = widgetKey ? this.registry[widgetKey] : null;

      console.log(
        '[DynamicZone.createNestedComponents] Child',
        index,
        'widgetKey:',
        widgetKey,
        'found:',
        !!componentType
      );

      if (!componentType) {
        console.warn('[DynamicZone] No component found for', widgetKey || childDef.tagName);
        return;
      }

      // Create child component
      this.nextComponent = componentType as Type<any>;
      this.setContainerRef(parentContainer);
      const childRef = this.createWidget(this.nextComponent, { append: true });
      console.log('[DynamicZone.createNestedComponents] Child', index, 'created:', !!childRef);

      if (childRef) {
        // Apply styles from componentDefinition if available
        if (childDef.style) {
          const hostEl = (childRef.location?.nativeElement || null) as HTMLElement | null;
          if (hostEl) {
            Object.entries(childDef.style).forEach(([prop, value]) => {
              (hostEl.style as any)[prop] = value;
            });
          }
        }

        // Recursively create nested components
        if (childDef.components && childDef.components.length > 0) {
          this.createNestedComponents(childRef, childDef.components);
        }

        // Register draggable for child
        this.registerDraggable(childRef);

        // Track component model mapping if componentId exists
        // Note: ComponentModel is already created by ComponentModelService in add() method
      }
    });
  }

  // Cho phép thả: chặn hành vi mặc định để drop hoạt động
  onDragOver(ev: DragEvent) {
    ev.preventDefault();
    this.isDragOver = true;
    if (ev.dataTransfer) {
      ev.dataTransfer.dropEffect = 'copy';
    }

    // Calculate drop position and show green line indicator
    const rect = this.hostEl.nativeElement.getBoundingClientRect();
    const relativeY = ev.clientY - rect.top;
    const width = rect.width;
    const insertIndex = this.calculateInsertIndex(relativeY);
    const indicatorY = this.getIndicatorY(relativeY, insertIndex);

    this.dropIndicator.show(
      rect.left,
      rect.top + indicatorY,
      width,
      this.hostEl.nativeElement,
      insertIndex
    );
  }

  private getIndicatorY(relativeY: number, insertIndex: number): number {
    const container = this.hostEl.nativeElement;
    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return 0;
    if (insertIndex >= children.length) {
      const last = children[children.length - 1];
      const lastRect = last.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      // 最後の要素の下に少し余白を追加
      return lastRect.bottom - containerRect.top + 8;
    }
    const target = children[insertIndex];
    const targetRect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return targetRect.top - containerRect.top;
  }

  // Bắt dragenter để một số trình duyệt kích hoạt drop ổn định
  onDragEnter(ev: DragEvent) {
    ev.preventDefault();
    this.isDragOver = true;
    if (ev.dataTransfer) {
      ev.dataTransfer.dropEffect = 'copy';
    }
    // Add body outline highlight
    this.hostEl.nativeElement.classList.add('dz-body-drag');
  }

  // Khi thả: lấy key từ dataTransfer và insert widget tại vị trí green line
  onDrop(ev: DragEvent) {
    ev.preventDefault();
    this.isDragOver = false;

    // Lấy insertIndex từ drop indicator trước khi hide
    const indicator = this.dropIndicator.getIndicator();
    const insertIndex = indicator.insertIndex ?? undefined;

    this.dropIndicator.hide();
    this.hostEl.nativeElement.classList.remove('dz-body-drag');
    console.log(
      '[DynamicZone.drop] types=',
      ev.dataTransfer?.types,
      'json=',
      ev.dataTransfer?.getData('application/json'),
      'insertIndex=',
      insertIndex
    );
    // Handle Blocks panel: application/json payload with HTML content
    const json = ev.dataTransfer?.getData('application/json');
    if (json) {
      try {
        const data = JSON.parse(json) as { content?: string };
        const html = data?.content || '';
        if (html) {
          console.log('[DynamicZone.drop] using JSON html length=', html.length);
          this.setContainerRef(this.container);

          // Insert tại index nếu có, otherwise append
          let ref: ComponentRef<any> | undefined;
          if (insertIndex !== undefined) {
            ref = this.insertWidget(HtmlBlock, insertIndex) as ComponentRef<any>;
          } else {
            ref = this.createWidget(HtmlBlock, { append: true });
          }

          if (ref && (ref.instance as any)) {
            (ref.instance as any).html = html;
            (ref.changeDetectorRef as any)?.detectChanges?.();
          }

          // Also reflect into ComponentModel tree for Layers
          let root = this.componentModelService.getRootComponent();
          if (!root) {
            root = this.componentModelService.setRootComponent({
              tagName: 'div',
              attributes: { 'data-zone': 'dynamic-zone' },
            });
          }
          const def =
            this.parser.parseHtml(html) ||
            ({
              tagName: 'div',
              content: html,
            } as ComponentDefinition);
          const created =
            insertIndex !== undefined
              ? this.componentModelService.createComponent(def, root.getId(), insertIndex)
              : this.componentModelService.createComponent(def, root.getId());
          console.log('[DynamicZone.drop] model created from JSON id=', created.getId());

          // Draggable for newly added block
          if (ref) {
            this.registerDraggable(ref);
          }
          return;
        }
      } catch (err) {
        console.warn('[DynamicZone.drop] JSON parse failed, fallback to text/plain', err);
      }
    }

    const key = ev.dataTransfer?.getData('text/plain');
    console.log('[DynamicZone.drop] text/plain key=', key);
    if (!key) {
      console.warn('[DynamicZone.drop] no usable payload');
      return;
    }

    // 1) If it's a registered Angular widget key -> add at insertIndex
    if (this.registry[key]) {
      console.log('[DynamicZone.drop] found registry key, add()', key, 'at index', insertIndex);
      this.add(key, insertIndex !== undefined ? { index: insertIndex } : { append: true });
      return;
    }

    // 2) Fallback: plain text label from Blocks panel -> map to simple HTML
    const html = this.resolveBlockHtml(key);
    if (html) {
      console.log('[DynamicZone.drop] fallback html for key=', key, 'len=', html.length);
      this.setContainerRef(this.container);

      // Insert tại index nếu có, otherwise append
      let ref: ComponentRef<any> | undefined;
      if (insertIndex !== undefined) {
        ref = this.insertWidget(HtmlBlock, insertIndex) as ComponentRef<any>;
      } else {
        ref = this.createWidget(HtmlBlock, { append: true });
      }

      if (ref && (ref.instance as any)) {
        (ref.instance as any).html = html;
        (ref.changeDetectorRef as any)?.detectChanges?.();
      }

      // Reflect to model
      let root = this.componentModelService.getRootComponent();
      if (!root) {
        root = this.componentModelService.setRootComponent({
          tagName: 'div',
          attributes: { 'data-zone': 'dynamic-zone' },
        });
      }
      const def =
        this.parser.parseHtml(html) || ({ tagName: 'div', content: html } as ComponentDefinition);
      const created2 =
        insertIndex !== undefined
          ? this.componentModelService.createComponent(def, root.getId(), insertIndex)
          : this.componentModelService.createComponent(def, root.getId());
      console.log('[DynamicZone.drop] model created from fallback id=', created2.getId());
      return;
    }
    console.warn('[DynamicZone.drop] unhandled key=', key);
  }

  // Khi rời vùng thả, bỏ highlight
  onDragLeave() {
    this.isDragOver = false;
    this.dropIndicator.hide();
    this.hostEl.nativeElement.classList.remove('dz-body-drag');
  }

  // Implement abstract methods của CoreBase
  protected getViewContainerRef(): ViewContainerRef | null {
    return this.container ?? null;
  }

  protected getWidgetComponent(): Type<any> {
    return this.nextComponent as Type<any>;
  }

  // Xuất HTML: 実際のDOM要素から取得（画像や動的コンテンツを含む）
  exportHtml(): string {
    // 実際のDOM要素からHTMLを取得（画像などの動的コンテンツを含む）
    const container = this.hostEl?.nativeElement;
    if (!container) return '';

    // クローンを作成して、編集可能な要素をクリーンアップ
    const clone = container.cloneNode(true) as HTMLElement;

    // Angular固有の属性やクラスを削除
    const angularAttributes = ['_ngcontent', 'ng-version', 'ng-reflect'];
    const angularClasses = [
      'dz-item',
      'dz-selected',
      'dz-row',
      'dz-column',
      'dz-image',
      'dz-list',
      'dz-card',
    ];

    const cleanElement = (el: HTMLElement) => {
      // 属性をクリーンアップ
      Array.from(el.attributes).forEach((attr) => {
        if (angularAttributes.some((a) => attr.name.startsWith(a))) {
          el.removeAttribute(attr.name);
        }
      });

      // クラスをクリーンアップ
      if (el.className) {
        const classes = el.className.split(' ').filter((c) => !angularClasses.includes(c));
        if (classes.length > 0) {
          el.className = classes.join(' ');
        } else {
          el.removeAttribute('class');
        }
      }

      // 子要素も再帰的にクリーンアップ
      Array.from(el.children).forEach((child) => {
        cleanElement(child as HTMLElement);
      });
    };

    cleanElement(clone);

    return clone.innerHTML;
  }

  // 実際のDOM要素からスタイルを取得
  exportStyles(): string {
    const container = this.hostEl?.nativeElement;
    if (!container) return '';

    const styles: string[] = [];
    const processed = new Set<HTMLElement>();

    const collectStyles = (el: HTMLElement) => {
      if (processed.has(el)) return;
      processed.add(el);

      // インラインスタイルを取得
      const inlineStyle = el.getAttribute('style');
      if (inlineStyle) {
        const selector = this.getElementSelector(el);
        if (selector) {
          styles.push(`${selector} { ${inlineStyle} }`);
        }
      }

      // 子要素も再帰的に処理
      Array.from(el.children).forEach((child) => {
        collectStyles(child as HTMLElement);
      });
    };

    collectStyles(container);
    return styles.join('\n');
  }

  private getElementSelector(el: HTMLElement): string {
    const id = el.id;
    if (id) return `#${id}`;

    const classes = Array.from(el.classList).filter((c) => !c.startsWith('dz-'));
    if (classes.length > 0) {
      return `.${classes[0]}`;
    }

    return el.tagName.toLowerCase();
  }

  // ========== Drag reorder support within zone ===========
  private registerDraggable(ref: ComponentRef<any>): void {
    const vcr = this.getViewContainerRef();
    if (!vcr) return;

    this.refs.push(ref);
    ref.onDestroy(() => {
      const idx = this.refs.indexOf(ref);
      if (idx >= 0) this.refs.splice(idx, 1);
      this.componentRefs.delete(ref);
    });

    const el = (ref.location?.nativeElement || null) as HTMLElement | null;
    if (!el) return;
    el.setAttribute('draggable', 'true');
    el.classList.add('dz-item');

    const click = (e: Event) => {
      e.stopPropagation();
      this.select(ref);
    };

    const dragStart = (e: DragEvent) => {
      e.stopPropagation();
      const index = this.indexOfRef(ref);
      e.dataTransfer?.setData('text/dz-index', String(index));
      e.dataTransfer?.setDragImage?.(new Image(), 0, 0);
      el.classList.add('dragging');
    };

    const dragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.add('drag-over');
    };

    const dragLeave = (e: DragEvent) => {
      e.stopPropagation();
      el.classList.remove('drag-over');
    };

    const drop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove('drag-over');
      const fromStr = e.dataTransfer?.getData('text/dz-index');
      // Internal reorder within DZ
      if (fromStr) {
        const from = parseInt(fromStr, 10);
        const to = this.indexOfRef(ref);
        this.reorder(from, to);
        const root = this.componentModelService.getRootComponent();
        if (root) this.componentModelService.reorderChild(root.getId(), from, to);
        el.classList.remove('dragging');
        return;
      }

      // External add (from toolbox Blocks)
      const json = e.dataTransfer?.getData('application/json');
      const key = e.dataTransfer?.getData('text/plain');
      const parentId = this.componentRefs.get(ref);
      const containerVcr =
        typeof (ref.instance as any)?.getChildContainer === 'function'
          ? (ref.instance as any).getChildContainer()
          : null;
      const useVcr = containerVcr || this.getViewContainerRef();
      if (!useVcr) return;

      // JSON payload with HTML (Blocks)
      if (json) {
        try {
          const data = JSON.parse(json) as { content?: string };
          const html = data?.content || '';
          if (html) {
            this.setContainerRef(useVcr);
            const r = this.createWidget(HtmlBlock, { append: true });
            if (r && (r.instance as any)) {
              (r.instance as any).html = html;
              (r.changeDetectorRef as any)?.detectChanges?.();
            }
            // reflect to model under parent
            let targetParent = parentId ? this.componentModelService.getComponent(parentId) : null;
            if (!targetParent) {
              targetParent = this.componentModelService.getRootComponent();
            }
            if (targetParent) {
              const def =
                this.parser.parseHtml(html) ||
                ({ tagName: 'div', content: html } as ComponentDefinition);
              this.componentModelService.createComponent(def, targetParent.getId());
            }
            return;
          }
        } catch {}
      }

      // Text key from toolbox registry
      if (key) {
        const cmp = this.registry[key];
        if (cmp) {
          this.nextComponent = cmp as Type<any>;
          this.setContainerRef(useVcr);
          // create model under parent if definition exists
          if (this.componentDefinitions && this.componentDefinitions[key]) {
            let targetParent = parentId ? this.componentModelService.getComponent(parentId) : null;
            if (!targetParent) targetParent = this.componentModelService.getRootComponent();
            if (!targetParent) {
              targetParent = this.componentModelService.setRootComponent({
                tagName: 'div',
                attributes: { 'data-zone': 'dynamic-zone' },
              });
            }
            const created = this.componentModelService.createComponent(
              this.componentDefinitions[key],
              targetParent.getId()
            );
            const childRef = this.createWidget(this.nextComponent, { append: true });
            if (childRef) {
              this.componentRefs.set(childRef, created.getId());
              this.registerDraggable(childRef);

              // Handle nested components from componentDefinitions
              const definition = this.componentDefinitions[key];
              if (definition.components && definition.components.length > 0) {
                this.createNestedComponents(childRef, definition.components);
              }
            }
            return;
          }
        }
      }
    };

    const dragEnd = () => {
      el.classList.remove('dragging');
      el.classList.remove('drag-over');
    };

    el.addEventListener('click', click);
    el.addEventListener('dragstart', dragStart);
    el.addEventListener('dragover', dragOver);
    el.addEventListener('dragleave', dragLeave);
    el.addEventListener('drop', drop);
    el.addEventListener('dragend', dragEnd);
  }

  private indexOfRef(ref: ComponentRef<any>): number {
    return this.refs.indexOf(ref);
  }

  private reorder(from: number, to: number): void {
    const vcr = this.getViewContainerRef();
    if (!vcr) return;
    if (from === -1 || to === -1 || from === to) return;
    const view = vcr.get(from);
    if (!view) return;
    vcr.move(view, to);
    // sync refs order
    const moved = this.refs.splice(from, 1)[0];
    this.refs.splice(to, 0, moved);
  }

  private select(ref: ComponentRef<any>): void {
    const prevEl = (this.selected?.location?.nativeElement || null) as HTMLElement | null;
    if (prevEl) prevEl.classList.remove('dz-selected');
    this.selected = ref;
    const el = (ref.location?.nativeElement || null) as HTMLElement | null;
    el?.classList.add('dz-selected');
    const id = this.componentRefs.get(ref);
    this.selection.select(id);
  }

  private calculateInsertIndex(mouseY: number): number {
    const container = this.hostEl.nativeElement;
    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return 0;

    const containerRect = container.getBoundingClientRect();
    const relativeY = mouseY - containerRect.top;
    const containerHeight = containerRect.height;

    // 最後の要素の下に大きなドロップエリアを作る（最後の80px）
    const lastDropZoneThreshold = 80;
    if (relativeY > containerHeight - lastDropZoneThreshold) {
      return children.length;
    }

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const rect = child.getBoundingClientRect();
      const childTop = rect.top - containerRect.top;
      const childMid = childTop + rect.height / 2;

      if (relativeY < childMid) {
        return i;
      }
    }
    return children.length;
  }

  private resolveBlockHtml(label: string): string | null {
    const normalized = label.toLowerCase();
    switch (normalized) {
      case 'heading':
        return '<h1>Heading Text</h1>';
      case 'paragraph':
        return '<p>Paragraph text here</p>';
      case 'button':
        return '<button>Click Me</button>';
      case 'container':
        return '<div style="padding:16px;border:1px solid #ddd;">Container</div>';
      default:
        // If label contains HTML, use it directly
        if (normalized.includes('<')) return label;
        return null;
    }
  }
}
