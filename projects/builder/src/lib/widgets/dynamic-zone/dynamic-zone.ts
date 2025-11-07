import {
  Component,
  Input,
  Type,
  ViewChild,
  ViewContainerRef,
  ElementRef,
  ComponentRef,
  inject,
  ApplicationRef,
  Injector,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreBase } from '../../core/core.base';
import { ComponentModelService } from '../../core/dom-components/component-model.service';
import { ComponentDefinition } from '../../core/dom-components/model/component.model';
import { HtmlBlock } from '../html-block/html-block';
import { ParserService } from '../../core/parser/parser.service';
import { SelectionService } from '../../core/editor/selection.service';
import { TraitManagerService } from '../../core/trait-manager/trait-manager.service';
import { DropIndicatorService } from '../../core/utils/drop-indicator.service';
import { InlineEditService } from '../../core/editor/inline-edit.service';
import { FloatingToolbarComponent } from '../components/floating-toolbar/floating-toolbar.component';
import { ComponentRef as AngularComponentRef } from '@angular/core';

@Component({
  selector: 'app-dynamic-zone',
  standalone: true,
  imports: [CommonModule, FloatingToolbarComponent],
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

  // Separate ViewContainerRef for toolbar (not attached to template)
  private toolbarContainer?: ViewContainerRef;

  // Component hiện tại sẽ được tạo bởi CoreBase
  private nextComponent?: Type<any>;

  // Map ComponentRef -> ComponentModel để track
  private componentRefs = new Map<ComponentRef<any>, string>(); // ComponentRef -> componentId
  private refs: ComponentRef<any>[] = [];
  private selected?: ComponentRef<any>;
  private toolbarRef?: AngularComponentRef<FloatingToolbarComponent>;
  private selectedElement?: HTMLElement;
  private clickOutsideHandler?: (e: MouseEvent) => void;

  // Services quản lý model và parse HTML
  private componentModelService = inject(ComponentModelService);
  private parser = inject(ParserService);
  private selection = inject(SelectionService);
  private traitManager = inject(TraitManagerService);
  private dropIndicator = inject(DropIndicatorService);
  private inlineEditService = inject(InlineEditService);
  private appRef = inject(ApplicationRef);
  private injector = inject(Injector);

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
      console.log('Element clicked, calling select()', ref);
      // Select first, then inline edit will be handled separately
      this.select(ref);
    };

    // Apply inline edit directive cho textual elements AFTER click handler
    // This ensures select() is called first
    this.applyInlineEditDirective(el);

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

      // Show drop indicator for container components (Section, Row, Column)
      if (typeof (ref.instance as any)?.getChildContainer === 'function') {
        const innerEl = el.querySelector(
          '.section-inner, .row-inner, .column-inner'
        ) as HTMLElement;
        if (innerEl) {
          const innerRect = innerEl.getBoundingClientRect();
          const relativeY = e.clientY - innerRect.top;

          // Calculate insert index within the container
          const children = Array.from(innerEl.children) as HTMLElement[];
          let insertIndex = children.length;

          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const childRect = child.getBoundingClientRect();
            const childMid = childRect.top - innerRect.top + childRect.height / 2;
            if (relativeY < childMid) {
              insertIndex = i;
              break;
            }
          }

          // Calculate indicator Y position
          let indicatorY = 0;
          if (children.length === 0) {
            indicatorY = 0;
          } else if (insertIndex >= children.length) {
            const last = children[children.length - 1];
            const lastRect = last.getBoundingClientRect();
            indicatorY = lastRect.bottom - innerRect.top + 8;
          } else {
            const target = children[insertIndex];
            const targetRect = target.getBoundingClientRect();
            indicatorY = targetRect.top - innerRect.top;
          }

          // Show indicator at the calculated position
          this.dropIndicator.show(
            innerRect.left,
            innerRect.top + indicatorY,
            innerRect.width,
            innerEl,
            insertIndex
          );
        }
      }
    };

    const dragLeave = (e: DragEvent) => {
      e.stopPropagation();
      el.classList.remove('drag-over');

      // Hide drop indicator when leaving container component
      if (typeof (ref.instance as any)?.getChildContainer === 'function') {
        // Only hide if we're actually leaving the container (not just moving to a child)
        const relatedTarget = e.relatedTarget as HTMLElement;
        if (!relatedTarget || !el.contains(relatedTarget)) {
          this.dropIndicator.hide();
        }
      }
    };

    const drop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove('drag-over');

      // Hide drop indicator
      this.dropIndicator.hide();

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

      // Get insert index from drop indicator
      const indicator = this.dropIndicator.getIndicator();
      const insertIndex = indicator.insertIndex ?? undefined;

      // JSON payload with HTML (Blocks)
      if (json) {
        try {
          const data = JSON.parse(json) as { content?: string };
          const html = data?.content || '';
          if (html) {
            this.setContainerRef(useVcr);
            let r: ComponentRef<any> | undefined;
            if (insertIndex !== undefined) {
              r = this.insertWidget(HtmlBlock, insertIndex) as ComponentRef<any>;
            } else {
              r = this.createWidget(HtmlBlock, { append: true });
            }
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
            let childRef: ComponentRef<any> | undefined;
            if (insertIndex !== undefined) {
              childRef = this.insertWidget(this.nextComponent, insertIndex) as ComponentRef<any>;
            } else {
              childRef = this.createWidget(this.nextComponent, { append: true });
            }
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

    // Use capture phase to ensure select() runs before inline edit
    el.addEventListener('click', click, true);
    el.addEventListener('dragstart', dragStart);
    el.addEventListener('dragover', dragOver);
    el.addEventListener('dragleave', dragLeave);
    el.addEventListener('drop', drop);
    el.addEventListener('dragend', dragEnd);

    // For components with getChildContainer (like Section, Row, Column),
    // also register drop events on the inner container element
    if (typeof (ref.instance as any)?.getChildContainer === 'function') {
      const innerEl = el.querySelector('.section-inner, .row-inner, .column-inner') as HTMLElement;
      if (innerEl) {
        innerEl.addEventListener('dragover', dragOver);
        innerEl.addEventListener('dragleave', dragLeave);
        innerEl.addEventListener('drop', drop);
      }
    }
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

    // Show floating toolbar
    if (el) {
      this.selectedElement = el;
      console.log('Showing toolbar for element:', el, el.tagName);
      this.showToolbar(el);
    } else {
      this.hideToolbar();
    }

    // Update Trait Manager target & traits
    if (el) {
      // Prefer inner textual element for text editing
      const innerTextual = el.querySelector(
        'h1, h2, h3, h4, h5, h6, p, .dz-heading, .dz-text'
      ) as HTMLElement | null;
      const targetEl = innerTextual || el;
      this.traitManager.clear();
      this.traitManager.select(targetEl);

      // Common traits
      this.traitManager.addTrait({
        name: 'id',
        label: 'ID',
        type: 'text',
        value: targetEl.id || '',
      });
      this.traitManager.addTrait({
        name: 'class',
        label: 'Class',
        type: 'text',
        value: targetEl.className || '',
      });
      // Common size traits
      this.traitManager.addTrait({
        name: 'width',
        label: 'Width',
        type: 'text',
        value: (targetEl as HTMLElement).style.width || '',
      });
      this.traitManager.addTrait({
        name: 'height',
        label: 'Height',
        type: 'text',
        value: (targetEl as HTMLElement).style.height || '',
      });

      // Column-specific
      if (
        targetEl.classList.contains('dz-column') ||
        targetEl.getAttribute('data-widget') === 'column'
      ) {
        this.traitManager.addTrait({
          name: 'padding',
          label: 'Padding',
          type: 'text',
          value: (targetEl as HTMLElement).style.padding || '',
        });
      }

      // Row-specific (layout controls similar to screenshot)
      if (targetEl.classList.contains('dz-row') || targetEl.getAttribute('data-widget') === 'row') {
        this.traitManager.addTrait({
          name: 'justifyContent',
          label: 'Justify',
          type: 'select',
          value: (targetEl as HTMLElement).style.justifyContent || 'flex-start',
          options: [
            { value: 'flex-start', label: 'Start' },
            { value: 'center', label: 'Center' },
            { value: 'flex-end', label: 'End' },
            { value: 'space-between', label: 'Space Between' },
            { value: 'space-around', label: 'Space Around' },
            { value: 'space-evenly', label: 'Space Evenly' },
          ],
        });
        this.traitManager.addTrait({
          name: 'alignItems',
          label: 'Align',
          type: 'select',
          value: (targetEl as HTMLElement).style.alignItems || 'stretch',
          options: [
            { value: 'stretch', label: 'Stretch' },
            { value: 'flex-start', label: 'Start' },
            { value: 'center', label: 'Center' },
            { value: 'flex-end', label: 'End' },
          ],
        });
        this.traitManager.addTrait({
          name: 'gap',
          label: 'Gap',
          type: 'text',
          value: (targetEl as HTMLElement).style.gap || '',
        });
        this.traitManager.addTrait({
          name: 'flexWrap',
          label: 'Flex Wrap',
          type: 'select',
          value: (targetEl as HTMLElement).style.flexWrap || 'nowrap',
          options: [
            { value: 'nowrap', label: 'No Wrap' },
            { value: 'wrap', label: 'Wrap' },
            { value: 'wrap-reverse', label: 'Wrap Reverse' },
          ],
        });
      }

      // Text/Heading specific traits
      const tag = targetEl.tagName.toLowerCase();
      const isTextual = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'].includes(tag);
      if (isTextual) {
        this.traitManager.addTrait({
          name: 'textContent',
          label: 'Text',
          type: 'text',
          value: targetEl.textContent || '',
        });

        this.traitManager.addTrait({
          name: 'fontSizeClass',
          label: 'Font Size',
          type: 'select',
          value: '',
          options: [
            { value: '', label: 'Default' },
            { value: 'text-sm', label: 'text-sm' },
            { value: 'text-lg', label: 'text-lg' },
            { value: 'text-xl', label: 'text-xl' },
            { value: 'text-2xl', label: 'text-2xl' },
            { value: 'text-[20px]', label: 'text-[20px]' },
          ],
        });

        this.traitManager.addTrait({
          name: 'fontFamilyClass',
          label: 'Font Family',
          type: 'select',
          value: '',
          options: [
            { value: '', label: 'Default' },
            { value: 'font-sans', label: 'font-sans' },
            { value: 'font-serif', label: 'font-serif' },
            { value: 'font-mono', label: 'font-mono' },
          ],
        });

        this.traitManager.addTrait({
          name: 'fontWeightClass',
          label: 'Font Weight',
          type: 'select',
          value: '',
          options: [
            { value: '', label: 'Default' },
            { value: 'font-light', label: 'font-light' },
            { value: 'font-normal', label: 'font-normal' },
            { value: 'font-medium', label: 'font-medium' },
            { value: 'font-bold', label: 'font-bold' },
            { value: 'font-black', label: 'font-black' },
          ],
        });

        this.traitManager.addTrait({
          name: 'textColorClass',
          label: 'Text Color',
          type: 'text',
          value: '',
        });

        this.traitManager.addTrait({
          name: 'bgColorClass',
          label: 'Background',
          type: 'text',
          value: '',
        });

        this.traitManager.addTrait({
          name: 'lineHeightClass',
          label: 'Line Height',
          type: 'select',
          value: '',
          options: [
            { value: '', label: 'Default' },
            { value: 'leading-tight', label: 'leading-tight' },
            { value: 'leading-normal', label: 'leading-normal' },
            { value: 'leading-loose', label: 'leading-loose' },
            { value: 'leading-[1.8]', label: 'leading-[1.8]' },
          ],
        });

        this.traitManager.addTrait({
          name: 'letterSpacingClass',
          label: 'Letter Spacing',
          type: 'select',
          value: '',
          options: [
            { value: '', label: 'Default' },
            { value: 'tracking-tight', label: 'tracking-tight' },
            { value: 'tracking-wider', label: 'tracking-wider' },
            { value: 'tracking-[0.1em]', label: 'tracking-[0.1em]' },
          ],
        });

        this.traitManager.addTrait({
          name: 'textTransformClass',
          label: 'Transform',
          type: 'select',
          value: '',
          options: [
            { value: '', label: 'Default' },
            { value: 'uppercase', label: 'uppercase' },
            { value: 'lowercase', label: 'lowercase' },
            { value: 'capitalize', label: 'capitalize' },
            { value: 'normal-case', label: 'normal-case' },
          ],
        });

        this.traitManager.addTrait({
          name: 'textAlignClass',
          label: 'Text Align',
          type: 'select',
          value: '',
          options: [
            { value: '', label: 'Default' },
            { value: 'text-left', label: 'text-left' },
            { value: 'text-center', label: 'text-center' },
            { value: 'text-right', label: 'text-right' },
            { value: 'text-justify', label: 'text-justify' },
          ],
        });

        this.traitManager.addTrait({
          name: 'textShadow',
          label: 'Text Shadow (CSS)',
          type: 'text',
          value: (targetEl as HTMLElement).style.textShadow || '',
        });
      }

      // Debug log selected block info & traits
      try {
        const traitSummaries = this.traitManager
          .getTraits()
          .map((t) => ({ id: t.getId(), name: t.getName(), value: t.getValue() }));
        console.log('[DZ.select] selected element:', {
          tag: targetEl.tagName.toLowerCase(),
          id: targetEl.id,
          className: targetEl.className,
          text: targetEl.textContent,
          styles: {
            width: (targetEl as HTMLElement).style.width,
            height: (targetEl as HTMLElement).style.height,
          },
          traits: traitSummaries,
        });
      } catch {}
    }
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

  private showToolbar(element: HTMLElement): void {
    // Remove existing toolbar
    this.hideToolbar();

    try {
      console.log('Creating toolbar component...');

      // Create toolbar component in container
      const toolbarRef = this.container.createComponent(FloatingToolbarComponent);
      const label = this.getElementLabel(element);
      console.log('Toolbar label:', label);

      toolbarRef.instance.label = label;
      toolbarRef.instance.targetElement = element;
      toolbarRef.instance.action.subscribe((action: string) => this.handleToolbarAction(action));

      // Trigger change detection
      toolbarRef.changeDetectorRef.detectChanges();
      console.log('Toolbar component created, native element:', toolbarRef.location.nativeElement);

      // Get the hostView and native element BEFORE detaching
      const hostView = toolbarRef.hostView;
      const nativeElement = toolbarRef.location.nativeElement;

      // IMPORTANT: Detach from container FIRST before attaching to appRef
      // This prevents "already attached" error
      const index = this.container.indexOf(hostView);
      console.log('Container index of toolbar:', index);

      if (index >= 0) {
        // Remove from container's DOM first
        if (nativeElement.parentNode) {
          nativeElement.parentNode.removeChild(nativeElement);
        }
        // Then detach from ViewContainerRef
        this.container.detach(index);
        console.log('Toolbar detached from container at index:', index);
      } else {
        console.warn('Toolbar not found in container, may already be detached');
        // Still try to remove from DOM if it exists
        if (nativeElement.parentNode) {
          nativeElement.parentNode.removeChild(nativeElement);
        }
      }

      // Now attach to appRef and append to body
      // Check if already attached to avoid error
      try {
        this.appRef.attachView(hostView);
        console.log('Toolbar attached to appRef');
      } catch (attachError) {
        console.warn('View may already be attached, continuing...', attachError);
      }
      document.body.appendChild(nativeElement);
      console.log('Toolbar appended to body');

      this.toolbarRef = toolbarRef;

      // Add click outside handler to hide toolbar
      this.clickOutsideHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const toolbarElement = toolbarRef.location.nativeElement;

        // Don't hide if clicking on toolbar or selected element
        if (
          toolbarElement.contains(target) ||
          (this.selectedElement && this.selectedElement.contains(target))
        ) {
          return;
        }

        // Hide toolbar and deselect
        this.hideToolbar();
        if (this.selected) {
          const el = (this.selected.location?.nativeElement || null) as HTMLElement | null;
          if (el) {
            el.classList.remove('dz-selected');
          }
          this.selected = undefined;
          this.selectedElement = undefined;
        }
      };

      // Add listener with a small delay to avoid immediate trigger
      setTimeout(() => {
        if (this.clickOutsideHandler) {
          document.addEventListener('click', this.clickOutsideHandler, true);
        }
      }, 100);

      // Update position after a short delay to ensure DOM is ready
      setTimeout(() => {
        if (toolbarRef.instance && toolbarRef.instance.updatePosition) {
          toolbarRef.instance.updatePosition();
          toolbarRef.changeDetectorRef.detectChanges();
          console.log(
            'Toolbar position updated:',
            toolbarRef.instance.left,
            toolbarRef.instance.top
          );
        }
      }, 50);
    } catch (error) {
      console.error('Error showing toolbar:', error);
    }
  }

  private hideToolbar(): void {
    if (this.toolbarRef) {
      // Remove click outside handler
      if (this.clickOutsideHandler) {
        document.removeEventListener('click', this.clickOutsideHandler, true);
        this.clickOutsideHandler = undefined;
      }

      // Remove from DOM first
      if (this.toolbarRef.location.nativeElement.parentNode) {
        this.toolbarRef.location.nativeElement.parentNode.removeChild(
          this.toolbarRef.location.nativeElement
        );
      }
      // Destroy component (this will also detach from appRef automatically)
      this.toolbarRef.destroy();
      this.toolbarRef = undefined;
    }
  }

  private getElementLabel(element: HTMLElement): string {
    const tag = element.tagName.toLowerCase();

    // Check for inner textual element first
    const innerTextual = element.querySelector('h1, h2, h3, h4, h5, h6, p');
    if (innerTextual) {
      const innerTag = innerTextual.tagName.toLowerCase();
      if (innerTag.startsWith('h')) {
        const level = innerTag.charAt(1);
        return `H${level} Heading`;
      }
      if (innerTag === 'p') {
        return 'P Paragraph';
      }
    }

    // Check element itself
    if (tag.startsWith('h')) {
      const level = tag.charAt(1);
      return `H${level} Heading`;
    }

    // Check for common component classes
    if (element.classList.contains('dz-row')) {
      return 'Row';
    }
    if (element.classList.contains('dz-column')) {
      return 'Column';
    }
    if (element.classList.contains('dz-section')) {
      return 'Section';
    }

    // Default: capitalize tag name
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }

  private handleToolbarAction(action: string): void {
    if (!this.selected || !this.selectedElement) return;

    switch (action) {
      case 'magic':
        // TODO: Implement magic/AI features
        console.log('Magic action');
        break;
      case 'moveUp':
        this.moveUp();
        break;
      case 'move':
        // TODO: Implement drag to move
        console.log('Move action');
        break;
      case 'duplicate':
        this.duplicate();
        break;
      case 'delete':
        this.delete();
        break;
      case 'more':
        // TODO: Show more options menu
        console.log('More action');
        break;
    }
  }

  private moveUp(): void {
    if (!this.selected) return;
    const index = this.indexOfRef(this.selected);
    if (index > 0) {
      this.reorder(index, index - 1);
    }
  }

  private duplicate(): void {
    if (!this.selected) return;
    const el = (this.selected.location?.nativeElement || null) as HTMLElement | null;
    if (!el) return;

    const id = this.componentRefs.get(this.selected);
    if (!id) return;

    const model = this.componentModelService.getComponent(id);
    if (!model) return;

    const parent = model.getParent();
    const parentId = parent?.getId() || '';
    const index = this.indexOfRef(this.selected);

    // Clone component model using toJSON
    const definition = model.toJSON();
    // Remove id to generate new one
    if (definition.attributes) {
      delete definition.attributes['id'];
    }
    const cloned = this.componentModelService.createComponent(definition, parentId);

    // Create component instance
    const componentType = this.registry[model.getTagName()] || this.nextComponent;
    if (componentType) {
      const clonedRef = this.insertWidget(componentType, index + 1) as ComponentRef<any>;
      if (clonedRef) {
        this.componentRefs.set(clonedRef, cloned.getId());
        this.registerDraggable(clonedRef);
      }
    }
  }

  private delete(): void {
    if (!this.selected) return;
    const id = this.componentRefs.get(this.selected);
    if (!id) return;

    // Remove from model
    this.componentModelService.removeComponent(id);

    // Remove from view
    const index = this.indexOfRef(this.selected);
    const vcr = this.getViewContainerRef();
    if (vcr && index >= 0) {
      vcr.remove(index);
      this.refs.splice(index, 1);
      this.componentRefs.delete(this.selected);
      this.selected.destroy();
      this.selected = undefined;
      this.hideToolbar();
    }
  }

  private applyInlineEditDirective(element: HTMLElement): void {
    // Tìm các textual elements trong component và apply service
    const textualElements = element.querySelectorAll(
      'h1, h2, h3, h4, h5, h6, p, span, .dz-heading, .dz-text'
    ) as NodeListOf<HTMLElement>;

    textualElements.forEach((el) => {
      this.inlineEditService.applyToElement(el);
    });

    // Nếu chính element là textual, apply service vào nó
    const tag = element.tagName.toLowerCase();
    const isTextual = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'].includes(tag);
    if (isTextual) {
      this.inlineEditService.applyToElement(element);
    }
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
