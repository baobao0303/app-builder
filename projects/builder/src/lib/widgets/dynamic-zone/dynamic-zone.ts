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
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreBase } from '../../core/core.base';
import { ComponentModelService } from '../../core/dom-components/component-model.service';
import {
  ComponentDefinition,
  ComponentModel,
} from '../../core/dom-components/model/component.model';
import { HtmlBlock } from '../html-block/html-block';
import { ParserService } from '../../core/parser/parser.service';
import { SelectionService } from '../../core/editor/selection.service';
import { TraitManagerService } from '../../core/trait-manager/trait-manager.service';
import { DropIndicatorService } from '../../core/utils/drop-indicator.service';
import { InlineEditService } from '../../core/editor/inline-edit.service';
import { FloatingToolbarComponent } from '../components/floating-toolbar/floating-toolbar.component';
import { FloatingToolbarHeadingComponent } from '../components/floating-toolbar/floating-toobar-heading.component';
import { ComponentRef as AngularComponentRef } from '@angular/core';
import {
  UndoManagerService,
  MoveCommand,
  DuplicateCommand,
  DeleteCommand,
} from '../../core/undo-manager/undo-manager.service';

interface ComponentMeta {
  container: ViewContainerRef;
  containerId: string;
  parentId?: string;
}

@Component({
  selector: 'app-dynamic-zone',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dynamic-zone.html',
  styleUrl: './dynamic-zone.scss',
})
export class DynamicZone extends CoreBase implements AfterViewInit, OnDestroy {
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
  private componentMeta = new Map<ComponentRef<any>, ComponentMeta>();
  private containerRefs = new Map<ViewContainerRef, ComponentRef<any>[]>();
  private containerIds = new Map<ViewContainerRef, string>();
  private containersById = new Map<string, ViewContainerRef>();
  private selected?: ComponentRef<any>;
  private toolbarRef?: AngularComponentRef<FloatingToolbarComponent>;
  private headingToolbarRef?: AngularComponentRef<FloatingToolbarHeadingComponent>;
  private selectedElement?: HTMLElement;
  private clickOutsideHandler?: (e: MouseEvent) => void;
  private canvasClickHandler?: (e: MouseEvent) => void;
  private draggingRef?: ComponentRef<any>;

  // Services quản lý model và parse HTML
  private componentModelService = inject(ComponentModelService);
  private parser = inject(ParserService);
  private selection = inject(SelectionService);
  private traitManager = inject(TraitManagerService);
  private dropIndicator = inject(DropIndicatorService);
  private inlineEditService = inject(InlineEditService);
  private appRef = inject(ApplicationRef);
  private injector = inject(Injector);
  private undoManager = inject(UndoManagerService);

  // Trạng thái để hiển thị highlight khi kéo vào vùng thả
  protected isDragOver = false;

  private ensureContainerRegistered(container: ViewContainerRef): string {
    let id = this.containerIds.get(container);
    if (!id) {
      if (container === this.container) {
        id = 'root';
      } else {
        id = `container-${this.containerIds.size + 1}`;
      }
      this.containerIds.set(container, id);
      this.containersById.set(id, container);
    }
    return id;
  }

  private getContainerById(id?: string | null): ViewContainerRef | null {
    if (!id) return null;
    return this.containersById.get(id) ?? null;
  }

  private getContainerRefs(container: ViewContainerRef, create = true): ComponentRef<any>[] {
    let list = this.containerRefs.get(container);
    if (!list && create) {
      list = [];
      this.containerRefs.set(container, list);
    }
    return list ?? [];
  }

  private trackComponentRef(
    ref: ComponentRef<any>,
    container: ViewContainerRef,
    options: { parentId?: string; componentId?: string; insertIndex?: number } = {}
  ): void {
    const containerId = this.ensureContainerRegistered(container);
    const existingMeta = this.componentMeta.get(ref);

    if (existingMeta) {
      if (existingMeta.container !== container) {
        const oldList = this.getContainerRefs(existingMeta.container, false);
        const oldIdx = oldList.indexOf(ref);
        if (oldIdx >= 0) {
          oldList.splice(oldIdx, 1);
        }
      }

      const list = this.getContainerRefs(container);
      if (!list.includes(ref)) {
        if (
          options.insertIndex !== undefined &&
          options.insertIndex >= 0 &&
          options.insertIndex <= list.length
        ) {
          list.splice(options.insertIndex, 0, ref);
        } else {
          list.push(ref);
        }
      }

      existingMeta.container = container;
      existingMeta.containerId = containerId;
      existingMeta.parentId = options.parentId;
      this.componentMeta.set(ref, existingMeta);
    } else {
      const list = this.getContainerRefs(container);
      if (!list.includes(ref)) {
        if (
          options.insertIndex !== undefined &&
          options.insertIndex >= 0 &&
          options.insertIndex <= list.length
        ) {
          list.splice(options.insertIndex, 0, ref);
        } else {
          list.push(ref);
        }
      }

      this.componentMeta.set(ref, {
        container,
        containerId,
        parentId: options.parentId,
      });

      ref.onDestroy(() => this.untrackComponentRef(ref));
    }

    if (options.componentId) {
      this.componentRefs.set(ref, options.componentId);
    }
  }

  private untrackComponentRef(ref: ComponentRef<any>): void {
    const meta = this.componentMeta.get(ref);
    if (meta) {
      const list = this.getContainerRefs(meta.container, false);
      const idx = list.indexOf(ref);
      if (idx >= 0) {
        list.splice(idx, 1);
      }
      this.componentMeta.delete(ref);
    }
    this.componentRefs.delete(ref);
  }

  ngAfterViewInit(): void {
    // Add click handler for canvas to deselect when clicking on empty area
    if (this.hostEl?.nativeElement) {
      this.canvasClickHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Only deselect if clicking directly on canvas (host element), not on child elements
        if (target === this.hostEl.nativeElement) {
          // Click is directly on canvas empty area
          console.log('[DZ] Click on canvas empty area, deselecting...');
          this.deselect();
        } else {
          // Check if click is on empty area (not on any dz-item or interactive element)
          const clickedItem = target.closest('.dz-item');
          const isInteractive = target.closest(
            'input, button, select, textarea, .floating-toolbar'
          );
          // If click is on host element but not on any item or interactive element, deselect
          if (
            this.hostEl.nativeElement.contains(target) &&
            !clickedItem &&
            !isInteractive &&
            target !== this.hostEl.nativeElement
          ) {
            // Check if target is a direct child of host (empty area)
            const isDirectChild = Array.from(this.hostEl.nativeElement.children).includes(target);
            if (isDirectChild && !target.classList.contains('dz-item')) {
              console.log('[DZ] Click on canvas empty area (direct child), deselecting...');
              this.deselect();
            }
          }
        }
      };
      this.hostEl.nativeElement.addEventListener('click', this.canvasClickHandler, true);
      console.log('[DZ] Canvas click handler added');
    }

    // Add keyboard shortcuts for undo/redo
    this.setupKeyboardShortcuts();
  }

  private setupKeyboardShortcuts(): void {
    const keydownHandler = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true';

      // Ctrl+Z or Cmd+Z for Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !isEditing) {
        e.preventDefault();
        if (this.undoManager.canUndo()) {
          this.undoManager.undo();
          console.log('[DZ] Undo triggered via keyboard');
        }
        return;
      }

      // Ctrl+Y or Cmd+Shift+Z for Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        if (!isEditing) {
          e.preventDefault();
          if (this.undoManager.canRedo()) {
            this.undoManager.redo();
            console.log('[DZ] Redo triggered via keyboard');
          }
        }
        return;
      }
    };

    document.addEventListener('keydown', keydownHandler);

    // Store handler for cleanup
    (this as any).__keydownHandler = keydownHandler;
  }

  ngOnDestroy(): void {
    // Cleanup event listeners
    if (this.canvasClickHandler && this.hostEl?.nativeElement) {
      this.hostEl.nativeElement.removeEventListener('click', this.canvasClickHandler, true);
      console.log('[DZ] Canvas click handler removed');
    }
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler, true);
      console.log('[DZ] Click outside handler removed');
    }

    // Remove keyboard shortcut handler
    const keydownHandler = (this as any).__keydownHandler;
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
      console.log('[DZ] Keyboard shortcut handler removed');
    }

    // Hide toolbar and deselect
    this.deselect();
  }

  // Gọi từ toolbox khi click một item -> dùng helper của CoreBase
  add(key: string, options?: { append?: boolean; index?: number }): void {
    console.log('[DynamicZone.add] key=', key, 'options=', options);
    const cmp = this.registry[key];
    if (!cmp) return;
    this.nextComponent = cmp as Type<any>;
    this.setContainerRef(this.container);

    let root = this.componentModelService.getRootComponent();

    // Tạo ComponentModel nếu có definition
    let componentId: string | undefined;
    if (this.componentDefinitions && this.componentDefinitions[key]) {
      // Đảm bảo có root component cho DynamicZone
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

    // Enable internal drag to reorder
    if (componentRef) {
      const parentId = componentId
        ? this.componentModelService.getComponent(componentId)?.getParent()?.getId()
        : root?.getId();
      const currentRefs = this.getContainerRefs(this.container);
      const insertIndex =
        options?.index !== undefined && options.index >= 0 ? options.index : currentRefs.length;

      this.trackComponentRef(componentRef, this.container, {
        parentId,
        componentId,
        insertIndex,
      });
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
        const parentComponentId = this.componentRefs.get(parentRef);
        const childRefs = this.getContainerRefs(parentContainer);
        this.trackComponentRef(childRef, parentContainer, {
          parentId: parentComponentId,
          insertIndex: childRefs.length,
        });

        this.registerDraggable(childRef);

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

    // Handle file drops (images, etc.)
    const files = ev.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        console.log('[DynamicZone.drop] Image file dropped:', file.name, file.type);
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageSrc = e.target?.result as string;
          if (imageSrc) {
            // Create ImageComponent
            const imageKey = 'image';
            if (this.registry[imageKey]) {
              this.add(
                imageKey,
                insertIndex !== undefined ? { index: insertIndex } : { append: true }
              );
              // Set image source after component is created
              // The add() method already calls registerDraggable, so we just need to set the image source
              setTimeout(() => {
                // Find the newly created component ref
                const topRefs = this.getContainerRefs(this.container, false);
                let newRef: ComponentRef<any> | undefined;
                if (insertIndex !== undefined) {
                  newRef = topRefs[insertIndex];
                } else {
                  newRef = topRefs[topRefs.length - 1];
                }
                if (newRef && (newRef.instance as any)?.imageSrc !== undefined) {
                  (newRef.instance as any).imageSrc = imageSrc;
                  (newRef.instance as any).imageAlt = file.name || 'Image';
                  (newRef.changeDetectorRef as any)?.detectChanges?.();
                  console.log('[DynamicZone.drop] Image source set:', imageSrc);
                }
              }, 50);
            }
          }
        };
        reader.readAsDataURL(file);
        return;
      }
    }

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

          // Track & enable drag for newly added block
          if (ref) {
            const parentId = created.getParent()?.getId() ?? root.getId();
            const refs = this.getContainerRefs(this.container);
            const position =
              insertIndex !== undefined && insertIndex >= 0 ? insertIndex : refs.length;
            this.trackComponentRef(ref, this.container, {
              parentId,
              componentId: created.getId(),
              insertIndex: position,
            });
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

      if (ref) {
        const parentId = created2.getParent()?.getId() ?? root.getId();
        const refs = this.getContainerRefs(this.container);
        const position = insertIndex !== undefined && insertIndex >= 0 ? insertIndex : refs.length;
        this.trackComponentRef(ref, this.container, {
          parentId,
          componentId: created2.getId(),
          insertIndex: position,
        });
        this.registerDraggable(ref);
      }
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
      'dz-row', // 保留 'row' 类，只移除 'dz-row'
      'dz-column', // 保留 'column' 类，只移除 'dz-column'
      'dz-image',
      'dz-list',
      'dz-card',
    ];

    const cleanElement = (el: HTMLElement) => {
      // 如果当前元素本身就是 column-label、image-overlay 或 image-placeholder，直接移除并返回
      if (
        el.classList.contains('column-label') ||
        el.classList.contains('image-overlay') ||
        el.classList.contains('image-placeholder')
      ) {
        el.remove();
        return; // 移除后不需要继续处理
      }

      // 移除编辑相关的元素（预览和导出时不需要）
      // 使用 querySelectorAll 递归查找所有需要移除的元素
      const imageOverlays = el.querySelectorAll('.image-overlay');
      imageOverlays.forEach((overlay) => overlay.remove());

      const columnLabels = el.querySelectorAll('.column-label');
      columnLabels.forEach((label) => label.remove());

      const imagePlaceholders = el.querySelectorAll('.image-placeholder');
      imagePlaceholders.forEach((placeholder) => placeholder.remove());

      // 移除图片包装器的边框和背景（预览时不需要）
      if (el.classList.contains('image-wrapper')) {
        el.style.border = 'none';
        el.style.background = 'transparent';
        el.style.minHeight = 'auto';
      }

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

      // 移除编辑相关的样式属性
      if (el.style) {
        // 移除 cursor: pointer（预览时不需要）
        if (el.style.cursor === 'pointer') {
          el.style.cursor = '';
        }
      }

      // 子要素も再帰的にクリーンアップ（在移除不需要的元素之后）
      // 使用 Array.from 创建副本，因为 children 可能在迭代时被修改
      const children = Array.from(el.children);
      children.forEach((child) => {
        cleanElement(child as HTMLElement);
      });
    };

    // 在开始递归清理之前，先移除所有编辑相关的元素（确保所有 column-label 都被移除）
    const allImageOverlays = clone.querySelectorAll('.image-overlay');
    allImageOverlays.forEach((overlay) => overlay.remove());

    const allColumnLabels = clone.querySelectorAll('.column-label');
    allColumnLabels.forEach((label) => label.remove());

    const allImagePlaceholders = clone.querySelectorAll('.image-placeholder');
    allImagePlaceholders.forEach((placeholder) => placeholder.remove());

    cleanElement(clone);

    return clone.innerHTML;
  }

  // Component styles mapping - 组件样式映射
  private readonly componentStyles: Record<string, string> = {
    '.column': `
      flex: 1;
      min-height: 60px;
      border: none;
      background: transparent;
      position: relative;
      width: 100%;
      box-sizing: border-box;
    `,
    '.column[style*="width"]': `
      flex: none;
    `,
    '.column-label': `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
      pointer-events: none;
      z-index: 1;
    `,
    '.column-inner': `
      width: 100%;
      box-sizing: border-box;
    `,
    '.column-inner:not(:empty) ~ .column-label': `
      display: none;
    `,
    '.row': `
      display: flex;
      gap: 0;
      padding: 0;
      min-height: 60px;
      border: none;
      background: transparent;
      width: 100%;
      box-sizing: border-box;
    `,
    '.row-inner': `
      display: flex;
      gap: 0;
      width: 100%;
      min-height: 44px;
      flex: 1;
    `,
    '.image-wrapper': `
      position: relative;
      width: 100%;
      border: none;
      background: transparent;
      overflow: hidden;
    `,
    '.image': `
      width: 100%;
      height: auto;
      display: block;
    `,
  };

  // 実際のDOM要素からスタイルを取得
  exportStyles(): string {
    const container = this.hostEl?.nativeElement;
    if (!container) return '';

    const styles: string[] = [];
    const processed = new Set<HTMLElement>();
    const addedComponentStyles = new Set<string>();

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

      // 检查并添加组件样式
      const classes = Array.from(el.classList);
      for (const className of classes) {
        const styleKey = `.${className}`;
        if (this.componentStyles[styleKey] && !addedComponentStyles.has(styleKey)) {
          styles.push(`${styleKey} { ${this.componentStyles[styleKey].trim()} }`);
          addedComponentStyles.add(styleKey);
        }
      }

      // 检查特殊选择器（如 .column[style*="width"]）
      if (el.classList.contains('column') && el.getAttribute('style')?.includes('width')) {
        const specialKey = '.column[style*="width"]';
        if (this.componentStyles[specialKey] && !addedComponentStyles.has(specialKey)) {
          styles.push(`${specialKey} { ${this.componentStyles[specialKey].trim()} }`);
          addedComponentStyles.add(specialKey);
        }
      }

      // 检查 column-inner 和 column-label 的关系
      if (el.classList.contains('column-inner')) {
        const hasContent = el.children.length > 0 || el.textContent?.trim();
        if (hasContent) {
          const specialKey = '.column-inner:not(:empty) ~ .column-label';
          if (this.componentStyles[specialKey] && !addedComponentStyles.has(specialKey)) {
            styles.push(`${specialKey} { ${this.componentStyles[specialKey].trim()} }`);
            addedComponentStyles.add(specialKey);
          }
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
    // Ensure metadata exists for this component
    if (!this.componentMeta.has(ref)) {
      console.warn('[DynamicZone] registerDraggable without metadata, attaching to root container');
      this.trackComponentRef(ref, this.container);
    }

    const meta = this.componentMeta.get(ref);
    if (!meta) return;

    const container = meta.container;
    const containerId = meta.containerId;
    const list = this.getContainerRefs(container);
    if (!list.includes(ref)) {
      list.push(ref);
    }

    const el = (ref.location?.nativeElement || null) as HTMLElement | null;
    if (!el) return;
    el.setAttribute('draggable', 'true');
    el.classList.add('dz-item');
    el.dataset['dzContainer'] = containerId;

    const click = (e: Event) => {
      const target = e.target as HTMLElement;

      // Check if clicking on image element or image overlay/placeholder
      const isImageElement =
        target.matches('img, .image-wrapper, .image-overlay, .image-placeholder, .dz-image') ||
        target.closest('.image-wrapper, .image-overlay, .image-placeholder, .dz-image');

      if (isImageElement) {
        // Don't stop propagation - let ImageComponent handle the click to open modal
        // But still select the component for toolbar
        if (target !== el && !target.closest('.image-wrapper')) {
          // Clicking on image child - let it handle modal, but select parent component
          setTimeout(() => {
            this.select(ref);
          }, 0);
        } else {
          // Clicking on image wrapper itself - let ImageComponent handle it
          // Only select if not clicking on interactive elements (overlay, placeholder)
          const isInteractive =
            target.matches('.image-overlay, .image-placeholder') ||
            target.closest('.image-overlay, .image-placeholder');
          if (!isInteractive) {
            setTimeout(() => {
              this.select(ref);
            }, 0);
          }
        }
        return;
      }

      // Check if clicking on a textual element (heading, paragraph, etc.)
      const isTextualElement =
        target.matches('h1, h2, h3, h4, h5, h6, p, span, .dz-heading, .dz-text') ||
        target.closest('h1, h2, h3, h4, h5, h6, p, span, .dz-heading, .dz-text');

      if (isTextualElement) {
        // Don't stop propagation - let inline edit service handle the click
        // But still select the component for toolbar
        if (target !== el) {
          // Clicking on textual child - let it handle editing, but select parent component
          setTimeout(() => {
            this.select(ref);
          }, 0);
        } else {
          // Clicking on host element itself
          e.stopPropagation();
          this.select(ref);
        }
        return;
      }

      // For non-textual elements, stop propagation and select
      if ((e as MouseEvent).detail > 0) {
        e.stopPropagation();
        console.log('Element clicked, calling select()', ref);
        this.select(ref);
      }
    };

    // Apply inline edit directive cho textual elements AFTER click handler
    // This ensures select() is called first
    this.applyInlineEditDirective(el);

    const dragStart = (e: DragEvent) => {
      e.stopPropagation();
      const index = this.indexOfRef(ref);
      e.dataTransfer?.setData('text/dz-index', String(index));
      e.dataTransfer?.setData('text/dz-container', containerId);
      if (meta.parentId) {
        e.dataTransfer?.setData('text/dz-parent', meta.parentId);
      }
      e.dataTransfer?.setDragImage?.(new Image(), 0, 0);
      el.classList.add('dragging');
      this.draggingRef = ref;
    };

    const dragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Determine if we're over the inner container or the outer element
      const target = e.target as HTMLElement;
      const innerEl = el.querySelector('.section-inner, .row-inner, .column-inner') as HTMLElement;

      // If dragging over inner element, use inner element for calculations
      const containerEl =
        innerEl && (innerEl.contains(target) || target === innerEl) ? innerEl : el;

      containerEl.classList.add('drag-over');

      // Show drop indicator for container components (Section, Row, Column)
      if (typeof (ref.instance as any)?.getChildContainer === 'function' && innerEl) {
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

      // Remove drag-over class from both outer and inner elements
      el.classList.remove('drag-over');
      const innerEl = el.querySelector('.section-inner, .row-inner, .column-inner') as HTMLElement;
      if (innerEl) {
        innerEl.classList.remove('drag-over');
      }

      // Hide drop indicator
      this.dropIndicator.hide();

      const targetMeta = this.componentMeta.get(ref);
      const targetContainer = targetMeta?.container ?? this.container;
      const targetContainerId = targetMeta?.containerId ?? 'root';
      const childContainer =
        typeof (ref.instance as any)?.getChildContainer === 'function'
          ? (ref.instance as any).getChildContainer()
          : null;
      const indicatorState = this.dropIndicator.getIndicator();

      const fromStr = e.dataTransfer?.getData('text/dz-index');
      // Internal reorder within DZ
      if (fromStr) {
        const from = parseInt(fromStr, 10);
        const sourceContainerId = e.dataTransfer?.getData('text/dz-container') || targetContainerId;
        const sourceContainer = this.getContainerById(sourceContainerId) ?? targetContainer;
        const dropTargetEl = e.target as HTMLElement;
        const isDroppingIntoChild =
          !!childContainer &&
          !!innerEl &&
          (dropTargetEl === innerEl || innerEl.contains(dropTargetEl));

        const destinationContainer =
          isDroppingIntoChild && childContainer ? childContainer : targetContainer;
        const destinationContainerId =
          isDroppingIntoChild && childContainer
            ? this.ensureContainerRegistered(childContainer)
            : targetContainerId;

        const destinationIndex =
          isDroppingIntoChild && childContainer
            ? Math.max(
                0,
                indicatorState.insertIndex ?? this.getContainerRefs(childContainer, false).length
              )
            : this.indexOfRef(ref);

        if (sourceContainer === destinationContainer) {
          this.reorderWithinContainer(destinationContainer, from, destinationIndex);

          const parentId =
            isDroppingIntoChild && childContainer
              ? this.componentRefs.get(ref) ??
                targetMeta?.parentId ??
                this.componentModelService.getRootComponent()?.getId()
              : targetMeta?.parentId ?? this.componentModelService.getRootComponent()?.getId();
          if (parentId) {
            this.componentModelService.reorderChild(parentId, from, destinationIndex);
          }
        } else {
          // Moving between containers -> handled in update-drop-move step
          const parentId =
            isDroppingIntoChild && childContainer
              ? this.componentRefs.get(ref) || undefined
              : e.dataTransfer?.getData('text/dz-parent') || targetMeta?.parentId;
          this.handleCrossContainerMove({
            fromIndex: from,
            toIndex: destinationIndex,
            fromContainer: sourceContainer,
            toContainer: destinationContainer,
            sourceContainerId,
            targetContainerId: destinationContainerId,
            sourceParentId: parentId || undefined,
            targetParentId:
              isDroppingIntoChild && childContainer
                ? this.componentRefs.get(ref) || undefined
                : targetMeta?.parentId,
          });
        }
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
      if (!useVcr) {
        console.warn('[DynamicZone.drop] No ViewContainerRef available for drop');
        return;
      }

      console.log(
        '[DynamicZone.drop] Dropping into container, parentId:',
        parentId,
        'useVcr:',
        useVcr
      );

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
              const created = this.componentModelService.createComponent(def, targetParent.getId());

              if (r) {
                const containerRefs = this.getContainerRefs(useVcr);
                const position =
                  insertIndex !== undefined && insertIndex >= 0
                    ? insertIndex
                    : containerRefs.length;
                this.trackComponentRef(r, useVcr, {
                  parentId: targetParent.getId(),
                  componentId: created.getId(),
                  insertIndex: position,
                });
                this.registerDraggable(r);
              }
            } else if (r) {
              const containerRefs = this.getContainerRefs(useVcr);
              const position =
                insertIndex !== undefined && insertIndex >= 0 ? insertIndex : containerRefs.length;
              this.trackComponentRef(r, useVcr, {
                parentId: undefined,
                insertIndex: position,
              });
              this.registerDraggable(r);
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
              const containerRefs = this.getContainerRefs(useVcr);
              const position =
                insertIndex !== undefined && insertIndex >= 0 ? insertIndex : containerRefs.length;
              this.trackComponentRef(childRef, useVcr, {
                parentId: targetParent.getId(),
                componentId: created.getId(),
                insertIndex: position,
              });
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
      if (this.draggingRef === ref) {
        this.draggingRef = undefined;
      }
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
      // Use setTimeout to ensure inner element is rendered
      setTimeout(() => {
        const innerEl = el.querySelector(
          '.section-inner, .row-inner, .column-inner'
        ) as HTMLElement;
        if (innerEl) {
          innerEl.addEventListener('dragover', dragOver);
          innerEl.addEventListener('dragenter', (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            innerEl.classList.add('drag-over');
          });
          innerEl.addEventListener('dragleave', dragLeave);
          innerEl.addEventListener('drop', drop);
          console.log('[DynamicZone] Registered drop events on inner element:', innerEl.className);
        } else {
          console.warn(
            '[DynamicZone] Inner element not found for component with getChildContainer'
          );
        }
      }, 0);
    }
  }

  private indexOfRef(ref: ComponentRef<any>): number {
    const meta = this.componentMeta.get(ref);
    if (!meta) return -1;
    const list = this.getContainerRefs(meta.container, false);
    return list.indexOf(ref);
  }

  private reorderWithinContainer(container: ViewContainerRef, from: number, to: number): void {
    if (from === -1 || to === -1 || from === to) return;

    const view = container.get(from);
    if (!view) return;

    container.move(view, to);

    const list = this.getContainerRefs(container);
    if (from < list.length) {
      const [moved] = list.splice(from, 1);
      list.splice(to, 0, moved);
    }
  }

  private handleCrossContainerMove(config: {
    fromIndex: number;
    toIndex: number;
    fromContainer: ViewContainerRef;
    toContainer: ViewContainerRef;
    sourceContainerId: string;
    targetContainerId: string;
    sourceParentId?: string;
    targetParentId?: string;
  }): void {
    const { fromIndex, toIndex, fromContainer, toContainer, sourceParentId, targetParentId } =
      config;

    const fromList = this.getContainerRefs(fromContainer, false);
    const draggedRef =
      this.draggingRef ??
      (fromIndex >= 0 && fromIndex < fromList.length ? fromList[fromIndex] : undefined);

    if (!draggedRef) {
      console.warn('[DynamicZone] Unable to determine dragged component for cross-container move');
      return;
    }

    const detachedView = fromContainer.detach(fromIndex);
    if (!detachedView) {
      console.warn('[DynamicZone] Failed to detach view for cross-container move');
      return;
    }

    const insertIndex =
      toIndex >= 0 && toIndex <= toContainer.length ? toIndex : toContainer.length;
    toContainer.insert(detachedView, insertIndex);

    const componentId = this.componentRefs.get(draggedRef);

    let targetParentModelId = targetParentId;
    if (!targetParentModelId) {
      const root = this.componentModelService.getRootComponent();
      targetParentModelId = root?.getId();
    }

    if (componentId) {
      const componentModel = this.componentModelService.getComponent(componentId);
      if (componentModel) {
        const definition = componentModel.toJSON();
        this.componentModelService.removeComponent(componentId);

        let parentModel = targetParentModelId
          ? this.componentModelService.getComponent(targetParentModelId)
          : null;

        if (!parentModel) {
          parentModel = this.componentModelService.getRootComponent();
          if (!parentModel) {
            parentModel = this.componentModelService.setRootComponent({
              tagName: 'div',
              attributes: { 'data-zone': 'dynamic-zone' },
            });
          }
        }

        const created = this.componentModelService.createComponent(
          definition,
          parentModel.getId(),
          insertIndex
        );

        this.componentRefs.set(draggedRef, created.getId());
        this.trackComponentRef(draggedRef, toContainer, {
          parentId: parentModel.getId(),
          componentId: created.getId(),
          insertIndex,
        });

        this.draggingRef = undefined;
        return;
      }
    }

    this.trackComponentRef(draggedRef, toContainer, {
      parentId: targetParentModelId,
      componentId,
      insertIndex,
    });

    this.draggingRef = undefined;
  }

  private select(ref: ComponentRef<any>): void {
    const prevEl = (this.selected?.location?.nativeElement || null) as HTMLElement | null;
    if (prevEl) prevEl.classList.remove('dz-selected');
    this.selected = ref;
    const el = (ref.location?.nativeElement || null) as HTMLElement | null;
    el?.classList.add('dz-selected');
    const id = this.componentRefs.get(ref);
    this.selection.select(id);

    // Log DOM position information
    if (el) {
      this.logDOMPosition(el);
    }

    // Show floating toolbar
    if (el) {
      this.selectedElement = el;
      console.log('Showing toolbar for element:', el, el.tagName);
      this.showToolbar(el, ref);
    } else {
      this.hideToolbar();
    }

    // Update Trait Manager target & traits
    if (el) {
      // For Row/Column components, always select the component itself, not inner textual elements
      const isLayoutComponent =
        el.classList.contains('dz-row') ||
        el.classList.contains('dz-column') ||
        el.getAttribute('data-widget') === 'row' ||
        el.getAttribute('data-widget') === 'column' ||
        el.tagName?.toLowerCase() === 'app-row' ||
        el.tagName?.toLowerCase() === 'app-column';

      let targetEl = el;
      if (!isLayoutComponent) {
        // For non-layout components, prefer inner textual element for text editing
        const innerTextual = el.querySelector(
          'h1, h2, h3, h4, h5, h6, p, .dz-heading, .dz-text'
        ) as HTMLElement | null;
        targetEl = innerTextual || el;
      }
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
      // Check for app-row tag or dz-row class or data-widget attribute
      const isRowComponent =
        targetEl.tagName?.toLowerCase() === 'app-row' ||
        targetEl.classList.contains('dz-row') ||
        targetEl.getAttribute('data-widget') === 'row';

      if (isRowComponent) {
        // Find container div (.row.dz-row or .column.dz-column)
        let containerDiv: HTMLElement | null = null;
        if (targetEl.tagName?.toLowerCase() === 'app-row') {
          containerDiv = targetEl.querySelector(
            '.row.dz-row, .column.dz-column, .dz-row, .dz-column'
          ) as HTMLElement | null;
        } else if (
          targetEl.classList.contains('row') ||
          targetEl.classList.contains('dz-row') ||
          targetEl.classList.contains('column') ||
          targetEl.classList.contains('dz-column')
        ) {
          containerDiv = targetEl;
        }

        // Determine current flexDirection from class instead of style
        let currentFlexDirection = 'row';
        if (containerDiv) {
          // If has column class, direction is column
          if (
            containerDiv.classList.contains('column') ||
            containerDiv.classList.contains('dz-column')
          ) {
            currentFlexDirection = 'column';
          } else {
            // Default to row
            currentFlexDirection = 'row';
          }
        } else {
          // Fallback: try to read from inner element style
          const inner = targetEl.querySelector('.row-inner, .column-inner') as HTMLElement | null;
          if (inner) {
            currentFlexDirection = inner.style.flexDirection || 'row';
          }
        }

        this.traitManager.addTrait({
          name: 'flexDirection',
          label: '方向',
          type: 'select',
          value: currentFlexDirection,
          options: [
            { value: 'row', label: '横向' },
            { value: 'column', label: '纵向' },
          ],
        });
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

  /**
   * Log DOM position information for debugging
   */
  private logDOMPosition(element: HTMLElement): void {
    try {
      // Get position in parent
      const parent = element.parentElement;
      let indexInParent = -1;
      if (parent) {
        const siblings = Array.from(parent.children);
        indexInParent = siblings.indexOf(element);
      }

      // Get path from root with better formatting
      const path: string[] = [];
      let current: HTMLElement | null = element;
      while (current) {
        const tag = current.tagName.toLowerCase();
        const id = current.id ? `#${current.id}` : '';
        const classes = current.className
          ? `.${current.className.split(/\s+/).filter(Boolean).join('.')}`
          : '';
        path.unshift(`${tag}${id}${classes}`);
        current = current.parentElement;
      }

      // Get component model info if available
      const componentRef = this.selected;
      const componentId = componentRef ? this.componentRefs.get(componentRef) : undefined;
      let modelInfo: any = null;
      if (componentId) {
        const model = this.componentModelService.getComponent(componentId);
        if (model) {
          modelInfo = {
            id: model.getId(),
            tagName: model.getTagName(),
            parent: model.getParent()?.getId() || 'root',
            children: model.getComponents().map((c: ComponentModel) => c.getId()),
          };
        }
      }

      // Get bounding rect for detailed position info
      const rect = element.getBoundingClientRect();

      // Format output as a structured object for better readability
      const positionInfo = {
        Element: element.tagName.toLowerCase(),
        ID: element.id || '(none)',
        Classes: element.className || '(none)',
        'Index in parent': indexInParent >= 0 ? indexInParent : '(none)',
        Parent: parent?.tagName.toLowerCase() || '(none)',
        'Path from root': path.join(' > '),
        Position: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        'Component Model': modelInfo || '(none)',
      };

      console.group('🔍 [DZ - DOM Position] Selected Element');
      console.table(positionInfo);
      console.log('Full Element:', element);
      console.log('Full Bounding Rect:', rect);
      if (modelInfo) {
        console.log('Component Model Details:', modelInfo);
      }
      console.groupEnd();
    } catch (error) {
      console.error('[DOM Position] Error logging position:', error);
    }
  }

  private showToolbar(element: HTMLElement, ref: ComponentRef<any>): void {
    // Remove existing toolbar FIRST to avoid conflicts
    this.hideToolbar();

    try {
      console.log('Creating toolbar component...');

      // Create toolbar component in container
      const toolbarRef = this.container.createComponent(FloatingToolbarComponent, {
        injector: this.injector,
      });

      const label = this.getElementLabel(element);
      console.log('Toolbar label:', label);

      toolbarRef.instance.label = label;
      toolbarRef.instance.targetElement = element;

      // Check if can move up (not first element)
      const elementIndex = this.indexOfRef(ref);
      toolbarRef.instance.canMoveUp = elementIndex > 0;

      toolbarRef.instance.action.subscribe((action: string) => this.handleToolbarAction(action));

      // Trigger change detection FIRST to ensure component is fully initialized
      toolbarRef.changeDetectorRef.detectChanges();
      console.log('Toolbar component initialized');

      // Get native element and hostView AFTER change detection
      const nativeElement = toolbarRef.location.nativeElement;
      const hostView = toolbarRef.hostView;

      // Detach from ViewContainerRef BEFORE attaching to appRef
      const containerIndex = this.container.indexOf(hostView);
      if (containerIndex >= 0) {
        this.container.detach(containerIndex);
        console.log('Toolbar detached from container at index:', containerIndex);
      }

      // Attach to ApplicationRef to keep it alive
      // Use try-catch to handle case where view is already attached
      try {
        this.appRef.attachView(hostView);
        console.log('Toolbar attached to appRef');
      } catch (attachError: any) {
        // If view is already attached, that's okay - just log and continue
        if (attachError?.message?.includes('already attached')) {
          console.warn('View already attached to appRef, continuing...');
        } else {
          console.error('Error attaching view to appRef:', attachError);
          throw attachError;
        }
      }

      // Append to body
      document.body.appendChild(nativeElement);
      console.log('Toolbar appended to body, native element:', nativeElement);

      // Force apply fixed positioning styles
      const hostElement = nativeElement as HTMLElement;
      hostElement.style.position = 'fixed';
      hostElement.style.zIndex = '10000';
      hostElement.style.display = 'block';
      hostElement.style.pointerEvents = 'auto';

      console.log('Toolbar element styles after force:', {
        display: window.getComputedStyle(hostElement).display,
        position: window.getComputedStyle(hostElement).position,
        visibility: window.getComputedStyle(hostElement).visibility,
        zIndex: window.getComputedStyle(hostElement).zIndex,
      });

      // Trigger change detection again after appending to body
      toolbarRef.changeDetectorRef.detectChanges();

      this.toolbarRef = toolbarRef;

      // Create heading toolbar if element is text or heading
      if (this.isTextOrHeadingElement(element)) {
        this.showHeadingToolbar(element);
      }

      // Update position immediately after appending
      if (toolbarRef.instance && toolbarRef.instance.updatePosition) {
        toolbarRef.instance.updatePosition();
        toolbarRef.changeDetectorRef.detectChanges();
        console.log(
          'Toolbar position updated immediately:',
          'right:',
          toolbarRef.instance.right,
          'top:',
          toolbarRef.instance.top
        );
      }

      // Update position again after a short delay to ensure DOM is fully ready
      setTimeout(() => {
        if (toolbarRef.instance && toolbarRef.instance.updatePosition) {
          toolbarRef.instance.updatePosition();
          toolbarRef.changeDetectorRef.detectChanges();
          console.log(
            'Toolbar position updated (delayed):',
            'right:',
            toolbarRef.instance.right,
            'top:',
            toolbarRef.instance.top
          );
        }
      }, 100);

      // Add click outside handler to hide toolbar and deselect
      this.clickOutsideHandler = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const toolbarElement = toolbarRef.location.nativeElement;
        const headingToolbarElement = this.headingToolbarRef
          ? this.headingToolbarRef.location.nativeElement
          : null;

        // Don't hide if clicking on toolbar
        if (toolbarElement && toolbarElement.contains(target)) {
          return;
        }

        // Don't hide if clicking on heading toolbar
        if (headingToolbarElement && headingToolbarElement.contains(target)) {
          return;
        }

        // Don't hide if clicking on selected element or its children
        if (this.selectedElement && this.selectedElement.contains(target)) {
          return;
        }

        // Don't hide if clicking on interactive elements (inputs, buttons, etc.)
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'BUTTON' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.closest('input, button, select, textarea')
        ) {
          return;
        }

        // Hide toolbar and deselect
        console.log('[DZ] Click outside detected, deselecting...');
        this.deselect();
      };

      // Add listener with a small delay to avoid immediate trigger
      setTimeout(() => {
        if (this.clickOutsideHandler) {
          document.addEventListener('click', this.clickOutsideHandler, true);
          console.log('[DZ] Click outside handler added');
        }
      }, 200);
    } catch (error) {
      console.error('Error showing toolbar:', error);
    }
  }

  /**
   * Deselect current element and hide toolbar
   */
  private deselect(): void {
    // Remove selection class
    if (this.selected) {
      const el = (this.selected.location?.nativeElement || null) as HTMLElement | null;
      if (el) {
        el.classList.remove('dz-selected');
        console.log('[DZ] Removed dz-selected class from element:', el);
      }
      this.selected = undefined;
    }
    this.selectedElement = undefined;

    // Hide toolbar
    this.hideToolbar();

    // Clear trait manager
    this.traitManager.clear();
  }

  private hideToolbar(): void {
    if (this.toolbarRef) {
      // Remove click outside handler
      if (this.clickOutsideHandler) {
        document.removeEventListener('click', this.clickOutsideHandler, true);
        console.log('[DZ] Click outside handler removed');
        this.clickOutsideHandler = undefined;
      }

      try {
        // Detach from ApplicationRef first
        const hostView = this.toolbarRef.hostView;
        if (hostView) {
          this.appRef.detachView(hostView);
          console.log('Toolbar detached from appRef');
        }

        // Remove from DOM
        const nativeElement = this.toolbarRef.location.nativeElement;
        if (nativeElement && nativeElement.parentNode) {
          nativeElement.parentNode.removeChild(nativeElement);
          console.log('Toolbar removed from DOM');
        }

        // Destroy component
        this.toolbarRef.destroy();
        console.log('Toolbar destroyed');
      } catch (error) {
        console.error('Error hiding toolbar:', error);
      } finally {
        this.toolbarRef = undefined;
      }
    }

    // Hide heading toolbar if exists
    if (this.headingToolbarRef) {
      try {
        // Detach from ApplicationRef first
        const headingHostView = this.headingToolbarRef.hostView;
        if (headingHostView) {
          this.appRef.detachView(headingHostView);
          console.log('Heading toolbar detached from appRef');
        }

        // Remove from DOM
        const headingNativeElement = this.headingToolbarRef.location.nativeElement;
        if (headingNativeElement && headingNativeElement.parentNode) {
          headingNativeElement.parentNode.removeChild(headingNativeElement);
          console.log('Heading toolbar removed from DOM');
        }

        // Destroy component
        this.headingToolbarRef.destroy();
        console.log('Heading toolbar destroyed');
      } catch (error) {
        console.error('Error hiding heading toolbar:', error);
      } finally {
        this.headingToolbarRef = undefined;
      }
    }
  }

  private showHeadingToolbar(element: HTMLElement): void {
    // Hide existing heading toolbar first
    if (this.headingToolbarRef) {
      try {
        const headingHostView = this.headingToolbarRef.hostView;
        if (headingHostView) {
          this.appRef.detachView(headingHostView);
        }
        const headingNativeElement = this.headingToolbarRef.location.nativeElement;
        if (headingNativeElement && headingNativeElement.parentNode) {
          headingNativeElement.parentNode.removeChild(headingNativeElement);
        }
        this.headingToolbarRef.destroy();
      } catch (error) {
        console.error('Error hiding existing heading toolbar:', error);
      } finally {
        this.headingToolbarRef = undefined;
      }
    }

    try {
      console.log('Creating heading toolbar component...');

      // Create heading toolbar component in container
      const headingToolbarRef = this.container.createComponent(FloatingToolbarHeadingComponent, {
        injector: this.injector,
      });

      headingToolbarRef.instance.targetElement = element;

      // Subscribe to action events
      headingToolbarRef.instance.action.subscribe((action: string) =>
        this.handleHeadingToolbarAction(action)
      );

      // Trigger change detection FIRST to ensure component is fully initialized
      headingToolbarRef.changeDetectorRef.detectChanges();
      console.log('Heading toolbar component initialized');

      // Get native element and hostView AFTER change detection
      const headingNativeElement = headingToolbarRef.location.nativeElement;
      const headingHostView = headingToolbarRef.hostView;

      // Detach from ViewContainerRef BEFORE attaching to appRef
      const headingContainerIndex = this.container.indexOf(headingHostView);
      if (headingContainerIndex >= 0) {
        this.container.detach(headingContainerIndex);
        console.log('Heading toolbar detached from container at index:', headingContainerIndex);
      }

      // Attach to ApplicationRef to keep it alive
      try {
        this.appRef.attachView(headingHostView);
        console.log('Heading toolbar attached to appRef');
      } catch (attachError: any) {
        if (attachError?.message?.includes('already attached')) {
          console.warn('Heading toolbar view already attached to appRef, continuing...');
        } else {
          console.error('Error attaching heading toolbar view to appRef:', attachError);
          throw attachError;
        }
      }

      // Append to body
      document.body.appendChild(headingNativeElement);
      console.log('Heading toolbar appended to body, native element:', headingNativeElement);

      // Force apply fixed positioning styles
      const headingHostElement = headingNativeElement as HTMLElement;
      headingHostElement.style.position = 'fixed';
      headingHostElement.style.zIndex = '10000';
      headingHostElement.style.display = 'block';
      headingHostElement.style.pointerEvents = 'auto';

      // Trigger change detection again after appending to body
      headingToolbarRef.changeDetectorRef.detectChanges();

      this.headingToolbarRef = headingToolbarRef;

      // Update position immediately after appending
      if (headingToolbarRef.instance && headingToolbarRef.instance.updatePosition) {
        headingToolbarRef.instance.updatePosition();
        headingToolbarRef.changeDetectorRef.detectChanges();
        console.log(
          'Heading toolbar position updated immediately:',
          'left:',
          headingToolbarRef.instance.left,
          'top:',
          headingToolbarRef.instance.top
        );
      }

      // Update position again after a short delay
      setTimeout(() => {
        if (headingToolbarRef.instance && headingToolbarRef.instance.updatePosition) {
          headingToolbarRef.instance.updatePosition();
          headingToolbarRef.changeDetectorRef.detectChanges();
          console.log(
            'Heading toolbar position updated (delayed):',
            'left:',
            headingToolbarRef.instance.left,
            'top:',
            headingToolbarRef.instance.top
          );
        }
      }, 100);
    } catch (headingError) {
      console.error('Error showing heading toolbar:', headingError);
    }
  }

  private handleHeadingToolbarAction(action: string): void {
    // Handle text formatting actions (bold, italic, underline, strikeThrough)
    // The actual formatting is already applied in FloatingToolbarHeadingComponent
    // This method can be used for additional logic if needed
    console.log('Heading toolbar action:', action);

    // Update the component model if needed
    if (this.selected && this.selectedElement) {
      const id = this.componentRefs.get(this.selected);
      if (id) {
        // The formatting is already applied to the DOM
        // We might want to update the model here if needed
        const model = this.componentModelService.getComponent(id);
        if (model) {
          // Update textContent to reflect the formatted HTML
          const htmlContent = this.selectedElement.innerHTML;
          // You can update the model here if needed
        }
      }
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

  private isTextOrHeadingElement(element: HTMLElement): boolean {
    const tag = element.tagName.toLowerCase();

    // Check if element itself is a heading or paragraph
    if (tag.startsWith('h') && tag.length === 2 && /^[1-6]$/.test(tag.charAt(1))) {
      return true; // h1-h6
    }
    if (tag === 'p') {
      return true; // paragraph
    }

    // Check for text/heading classes
    if (element.classList.contains('dz-heading') || element.classList.contains('dz-text')) {
      return true;
    }

    // Check for inner textual elements
    const innerTextual = element.querySelector('h1, h2, h3, h4, h5, h6, p, .dz-heading, .dz-text');
    if (innerTextual) {
      return true;
    }

    return false;
  }

  private handleToolbarAction(action: string): void {
    if (!this.selected || !this.selectedElement) return;

    switch (action) {
      case 'ai':
        // Show heading toolbar when AI button is clicked
        if (this.isTextOrHeadingElement(this.selectedElement)) {
          this.showHeadingToolbar(this.selectedElement);
        }
        break;
      case 'moveUp':
        this.moveUp();
        // Update canMoveUp after move
        setTimeout(() => {
          if (this.toolbarRef && this.selected) {
            const newIndex = this.indexOfRef(this.selected);
            this.toolbarRef.instance.canMoveUp = newIndex > 0;
            this.toolbarRef.changeDetectorRef.detectChanges();
          }
        }, 0);
        break;
      case 'move':
        this.enableDragMode();
        break;
      case 'duplicate':
        const duplicatedRef = this.duplicate();
        // Select the duplicated element after a short delay to ensure it's fully rendered
        if (duplicatedRef) {
          setTimeout(() => {
            console.log('[DZ] Selecting duplicated element:', duplicatedRef);
            this.select(duplicatedRef);
          }, 50);
        }
        break;
      case 'delete':
        this.delete();
        break;
    }
  }

  private moveUp(): void {
    if (!this.selected) return;
    const meta = this.componentMeta.get(this.selected);
    if (!meta) return;
    const index = this.indexOfRef(this.selected);
    if (index > 0) {
      // Get parent ID for undo command
      const id = this.componentRefs.get(this.selected);
      if (id) {
        const model = this.componentModelService.getComponent(id);
        if (model) {
          const parent = model.getParent();
          if (parent) {
            const parentId = parent.getId();

            // Create and execute move command with undo support
            const moveCommand = new MoveCommand(
              this.componentModelService,
              parentId,
              index,
              index - 1
            );

            // Execute command and add to undo stack
            this.undoManager.execute(moveCommand, { label: 'Move Up' });

            // Reorder in view
            this.reorderWithinContainer(meta.container, index, index - 1);
          }
        }
      }
    }
  }

  private duplicate(): ComponentRef<any> | null {
    if (!this.selected) return null;
    const el = (this.selected.location?.nativeElement || null) as HTMLElement | null;
    if (!el) return null;

    const id = this.componentRefs.get(this.selected);
    if (!id) return null;

    const model = this.componentModelService.getComponent(id);
    if (!model) return null;

    const parent = model.getParent();
    const parentId = parent?.getId() || '';
    const index = this.indexOfRef(this.selected);
    const meta = this.componentMeta.get(this.selected);
    const container = meta?.container ?? this.container;

    // Create and execute duplicate command with undo support
    const duplicateCommand = new DuplicateCommand(
      this.componentModelService,
      id,
      parentId,
      index + 1
    );

    this.undoManager.execute(duplicateCommand, { label: 'Duplicate Component' });

    // Get the cloned component from model
    const parentModel = this.componentModelService.getComponent(parentId);
    const cloned = parentModel?.getComponents()[index + 1];

    // Create component instance
    const componentType = this.registry[model.getTagName()] || this.nextComponent;
    if (componentType && cloned) {
      this.setContainerRef(container);
      const clonedRef = this.insertWidget(componentType, index + 1) as ComponentRef<any>;
      if (clonedRef) {
        const containerRefs = this.getContainerRefs(container);
        const position = Math.min(index + 1, containerRefs.length);
        this.trackComponentRef(clonedRef, container, {
          parentId: parentId || undefined,
          componentId: cloned.getId(),
          insertIndex: position,
        });
        this.registerDraggable(clonedRef);
        console.log('[DZ] Duplicated element, new ref:', clonedRef);
        return clonedRef;
      }
    }
    return null;
  }

  private delete(): void {
    if (!this.selected) return;
    const id = this.componentRefs.get(this.selected);
    if (!id) return;

    const model = this.componentModelService.getComponent(id);
    if (!model) return;

    const parent = model.getParent();
    const parentId = parent?.getId();

    // Create and execute delete command with undo support
    const deleteCommand = new DeleteCommand(this.componentModelService, id, parentId);

    this.undoManager.execute(deleteCommand, { label: 'Delete Component' });

    // Remove from view
    const index = this.indexOfRef(this.selected);
    const meta = this.componentMeta.get(this.selected);
    const container = meta?.container ?? this.container;
    if (container && index >= 0) {
      container.remove(index);
      this.componentRefs.delete(this.selected);
      this.selected.destroy();
      this.selected = undefined;
      this.selectedElement = undefined;
      this.hideToolbar();
    }
  }

  private enableDragMode(): void {
    if (!this.selected || !this.selectedElement) return;

    // Element đã có draggable = 'true' từ registerDraggable
    // Chỉ cần log để user biết có thể kéo thả
    console.log('Drag mode enabled - bạn có thể kéo thả element này');

    // Có thể thêm visual indicator nếu cần
    this.selectedElement.style.cursor = 'move';

    // Remove cursor after a delay
    setTimeout(() => {
      if (this.selectedElement) {
        this.selectedElement.style.cursor = '';
      }
    }, 2000);
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
