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
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { getElementLabel } from './interaction/editor-utils';
import { CoreBase } from '../../core/core.base';
import { ComponentModelService } from '../../core/dom-components/component-model.service';
import { ComponentDefinition } from '../../core/dom-components/model/component.model';
import { ParserService } from '../../core/parser/parser.service';
import { SelectionService } from '../../core/editor/selection.service';
import { SelectorManagerService } from '../../core/new/selector-manager/selector-manager.service';
import { DragDropManagerService } from '../../core/new/drag-drop-manager/drag-drop-manager.service';
import { captureRootDropContext, handleInternalDrop } from './interaction/drag-drop-context';
import { handleExternalDrop } from './interaction/external-drop-handler';
import { TraitManagerService } from '../../core/trait-manager/trait-manager.service';
import { exportHtmlFrom, exportStylesFrom } from './interaction/export';
import {
  COMPONENT_STYLES,
  resolveBlockHtml as resolveBlockHtmlHelper,
  getElementSelector as getElementSelectorHelper,
} from './interaction/styles/component-styles';
import { applyTraitsForElement } from './interaction/traits';
import {
  applyInlineEditDirective as applyInlineEdit,
  logDOMPosition as logDOMPositionUtil,
} from './interaction/editor-utils';
import {
  createNestedComponents as createNestedComponentsHelper,
  NestedContext,
} from './interaction/nested';
import { SelectionController } from './interaction/selection';
import { DropIndicatorService } from '../../core/utils/drop-indicator.service';
import { InlineEditService } from '../../core/editor/inline-edit.service';
import { initLifecycle, destroyLifecycle, LifecycleHandlers } from './interaction/lifecycle';
import { UndoManagerService } from '../../core/undo-manager/undo-manager.service';

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
export class DynamicZone extends CoreBase implements AfterViewInit, OnDestroy, OnChanges {
  // Registry: key -> component type
  @Input() registry: Record<string, Type<unknown>> = {};

  // Registry cho component definitions (tùy chọn, để generate HTML từ model)
  @Input() componentDefinitions?: Record<string, ComponentDefinition>;

  // Disable dragging mode
  @Input() draggingDisabled: boolean = false;

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
  private draggingRef?: ComponentRef<any>;
  private lifecycleHandlers?: LifecycleHandlers;
  private selectionController!: SelectionController;
  private hoverCleanups = new Map<ComponentRef<any>, () => void>(); // Cleanup functions for hover
  private hoverLabelElement?: HTMLElement; // Single label element for all components

  // Services quản lý model và parse HTML
  private componentModelService = inject(ComponentModelService);
  private parser = inject(ParserService);
  private selection = inject(SelectionService);
  private selectorManager = inject(SelectorManagerService);
  private dragDropManager = inject(DragDropManagerService);
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

    // Cleanup hover highlight
    const cleanup = this.hoverCleanups.get(ref);
    if (cleanup) {
      cleanup();
      this.hoverCleanups.delete(ref);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['draggingDisabled'] && !changes['draggingDisabled'].firstChange) {
      // Update draggable attribute for all registered components
      this.componentRefs.forEach((componentId, ref) => {
        const el = (ref.location?.nativeElement || null) as HTMLElement | null;
        if (el) {
          el.setAttribute('draggable', this.draggingDisabled ? 'false' : 'true');
        }
      });
    }
  }

  ngAfterViewInit(): void {
    this.lifecycleHandlers = initLifecycle({
      hostEl: this.hostEl?.nativeElement || null,
      deselect: () => this.deselect(),
      undo: () => {
        if (this.undoManager.canUndo()) this.undoManager.undo();
      },
      redo: () => {
        if (this.undoManager.canRedo()) this.undoManager.redo();
      },
    });

    this.selectionController = new SelectionController({
      container: this.container,
      appRef: this.appRef,
      injector: this.injector,
      selectionService: this.selection,
      selectorManager: this.selectorManager,
      traitManager: this.traitManager,
      applyTraits: (targetEl) => applyTraitsForElement(this.traitManager, targetEl),
      logDom: (element, selectedId) =>
        logDOMPositionUtil(element, selectedId, (id) =>
          this.componentModelService.getComponent(id)
        ),
      selected: this.selected,
      getSelected: () => this.selected,
      setSelected: (ref) => {
        this.selected = ref;
      },
      getContainerOfSelected: () => {
        const current = this.selected;
        if (!current) return this.container;
        return this.componentMeta.get(current)?.container ?? this.container;
      },
      indexOfSelected: () => {
        const current = this.selected;
        return current ? this.indexOfRef(current) : -1;
      },
      componentRefs: this.componentRefs,
      componentModelService: this.componentModelService,
      undoManager: this.undoManager,
      trackComponentRef: (ref, container, options) =>
        this.trackComponentRef(ref, container, options),
      getContainerRefs: (container, create) => this.getContainerRefs(container, create),
      setContainerRef: (container) => this.setContainerRef(container),
      insertWidget: (component, index) => this.insertWidget(component, index),
      createWidget: (component, options) => this.createWidget(component, options),
      registerDraggable: (ref) => this.registerDraggable(ref),
      reorderWithinContainer: (container, from, to) =>
        this.reorderWithinContainer(container, from, to),
      registry: this.registry,
      nextComponent: this.nextComponent,
      setNextComponent: (component) => {
        this.nextComponent = component;
      },
      hideToolbar: () => this.selectionController.hideToolbar(),
      getNextComponent: () => this.nextComponent,
      indexOfRef: (ref) => this.indexOfRef(ref),
    });
  }

  private setupKeyboardShortcuts(): void {}

  ngOnDestroy(): void {
    if (this.lifecycleHandlers) {
      destroyLifecycle({ hostEl: this.hostEl?.nativeElement || null }, this.lifecycleHandlers);
      this.lifecycleHandlers = undefined;
    }
    this.selectionController?.destroy();
    this.deselect();

    // Cleanup hover label element
    if (this.hoverLabelElement && this.hoverLabelElement.parentNode) {
      this.hoverLabelElement.parentNode.removeChild(this.hoverLabelElement);
      this.hoverLabelElement = undefined;
    }
  }

  // Gọi từ toolbox khi click một item -> dùng helper của CoreBase
  add(
    key: string,
    options?: {
      append?: boolean;
      index?: number;
      targetContainer?: ViewContainerRef;
      parentComponentId?: string;
    }
  ): void {
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
    createNestedComponentsHelper(this.buildNestedContext(), parentRef, children);
  }

  private buildNestedContext(): NestedContext {
    const context: NestedContext = {
      registry: this.registry,
      setNextComponent: (component: Type<any>) => {
        this.nextComponent = component;
      },
      setContainerRef: (container: ViewContainerRef) => this.setContainerRef(container),
      createWidget: (component, options) => this.createWidget(component, options),
      componentRefs: this.componentRefs,
      getContainerRefs: (container, create) => this.getContainerRefs(container, create),
      trackComponentRef: (ref, container, options) =>
        this.trackComponentRef(ref, container, options),
      registerDraggable: (ref) => this.registerDraggable(ref),
      createNestedComponents: () => {
        /* placeholder, assigned below */
      },
    };

    context.createNestedComponents = (parentRef, children) =>
      createNestedComponentsHelper(context, parentRef, children);

    return context;
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

    // Publish drag-over state to manager (root container)
    this.dragDropManager.updateOver({
      overContainerId: 'root',
      insertIndex,
      rect: { left: rect.left, top: rect.top + indicatorY, width },
    });

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
    ev.stopPropagation(); // Stop event from bubbling further
    this.isDragOver = false;

    const dropContext = captureRootDropContext({
      dragDropManager: this.dragDropManager,
      dropIndicator: this.dropIndicator,
      getContainerById: (id) => this.getContainerById(id),
      fallbackContainer: this.container,
    });
    const dropState = dropContext.dropState;
    const overContainerId = dropContext.overContainerId ?? 'root';
    const insertIndex = dropState.over?.insertIndex;
    const dropTargetContainer = dropContext.targetContainer;

    this.dropIndicator.hide();
    this.hostEl.nativeElement.classList.remove('dz-body-drag');

    // Complete drop for manager
    this.dragDropManager.completeDrop({
      targetContainerId: overContainerId,
      targetIndex: insertIndex ?? 0,
    });
    console.log(
      '[DynamicZone.drop] types=',
      ev.dataTransfer?.types,
      'json=',
      ev.dataTransfer?.getData('application/json'),
      'insertIndex=',
      insertIndex
    );

    // Handle file drops (images, etc.)
    const extPayload = this.dragDropManager.parseExternalPayload(ev.dataTransfer);
    if (extPayload.type === 'file-image') {
      const file = extPayload.file;
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

    // Handle asset drop: check if JSON contains assetSrc
    const jsonData = ev.dataTransfer?.getData('application/json');
    let assetData: { assetSrc?: string; assetName?: string } | null = null;
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.assetSrc) {
          assetData = parsed;
        }
      } catch (e) {
        // Not asset data, continue with normal handling
      }
    }

    // Handle Blocks panel: application/json payload with HTML content
    const handled = handleExternalDrop(
      {
        parentId: undefined,
        useVcr: dropTargetContainer,
        componentRefs: this.componentRefs,
        getContainerRefs: (container, create) => this.getContainerRefs(container, create),
        trackComponentRef: (ref, container, options) =>
          this.trackComponentRef(ref, container, options),
        registerDraggable: (ref) => this.registerDraggable(ref),
        componentModelService: this.componentModelService,
        parser: this.parser,
        dragDropManager: this.dragDropManager,
        registry: this.registry,
        componentDefinitions: this.componentDefinitions,
        setContainerRef: (container) => this.setContainerRef(container),
        createWidget: (component, options) => this.createWidget(component, options),
        insertWidget: (component, index) => this.insertWidget(component, index),
        createNestedComponents: (parentRef, defs) => this.createNestedComponents(parentRef, defs),
        add: (key, options) => this.add(key, options),
      },
      extPayload,
      dropContext.indicatorState,
      (key) => resolveBlockHtmlHelper(key)
    );

    // If asset data exists and component was created, set imageSrc/videoSrc
    if (handled && assetData?.assetSrc && extPayload.type === 'text-key') {
      const componentKey = extPayload.key;
      if (componentKey === 'image' || componentKey === 'video') {
        setTimeout(() => {
          // Find the newly created component ref
          const topRefs = this.getContainerRefs(dropTargetContainer, false);
          let newRef: ComponentRef<any> | undefined;
          if (insertIndex !== undefined && insertIndex >= 0) {
            newRef = topRefs[insertIndex];
          } else {
            newRef = topRefs[topRefs.length - 1];
          }
          if (newRef) {
            if (componentKey === 'image' && (newRef.instance as any)?.imageSrc !== undefined) {
              (newRef.instance as any).imageSrc = assetData.assetSrc;
              (newRef.instance as any).imageAlt = assetData.assetName || 'Image';
              (newRef.changeDetectorRef as any)?.detectChanges?.();
              console.log('[DynamicZone.drop] Image source set from asset:', assetData.assetSrc);
            } else if (
              componentKey === 'video' &&
              (newRef.instance as any)?.videoSrc !== undefined
            ) {
              (newRef.instance as any).videoSrc = assetData.assetSrc;
              (newRef.instance as any).videoName = assetData.assetName || 'Video';
              (newRef.changeDetectorRef as any)?.detectChanges?.();
              console.log('[DynamicZone.drop] Video source set from asset:', assetData.assetSrc);
            }
          }
        }, 50);
      }
    }

    if (!handled) {
      console.warn('[DynamicZone.drop] unhandled payload', extPayload);
    }
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

  // Xuất HTML
  exportHtml(): string {
    const container = this.hostEl?.nativeElement;
    if (!container) return '';
    return exportHtmlFrom(container);
  }

  // Component styles are centralized in interaction/styles/component-styles.ts

  // 実際のDOM要素からスタイルを取得
  exportStyles(): string {
    const container = this.hostEl?.nativeElement;
    if (!container) return '';
    return exportStylesFrom(container, COMPONENT_STYLES);
  }

  // kept for compatibility if used elsewhere; delegate to export helper logic via exportStylesFrom
  private getElementSelector(el: HTMLElement): string {
    return getElementSelectorHelper(el);
  }

  // ========== Drag reorder support within zone ===========
  private registerDraggable(ref: ComponentRef<any>): void {
    // Ensure metadata exists for this component
    if (!this.componentMeta.has(ref)) {
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
    el.setAttribute('draggable', this.draggingDisabled ? 'false' : 'true');
    el.classList.add('dz-item');
    el.dataset['dzContainer'] = containerId;

    // Ensure hover label element exists
    if (!this.hoverLabelElement) {
      this.hoverLabelElement = document.createElement('div');
      this.hoverLabelElement.className = 'dz-hover-label';
      // Apply styles directly to ensure no dark block effect
      this.hoverLabelElement.style.cssText =
        'position: absolute; z-index: 10000; pointer-events: none; display: none; ' +
        'background-color: #3b82f6; color: #ffffff; padding: 4px 8px; border-radius: 4px; ' +
        'font-size: 12px; font-weight: 500; white-space: nowrap; ' +
        'box-shadow: none; border: none; outline: none; ' +
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; ' +
        'line-height: 1.4; user-select: none;';
      document.body.appendChild(this.hoverLabelElement);
    }

    // Hover highlight and label handlers
    const onMouseEnter = (e: MouseEvent) => {
      // Don't show hover highlight if dragging
      if (!this.draggingRef) {
        el.classList.add('dz-hover-highlight');

        // Show hover label
        if (this.hoverLabelElement) {
          const label = this.getHoverLabel(el);
          this.hoverLabelElement.textContent = label;
          this.hoverLabelElement.style.display = 'block';
          this.updateHoverLabelPosition(el);
        }
      }
    };
    const onMouseLeave = () => {
      el.classList.remove('dz-hover-highlight');

      // Hide hover label
      if (this.hoverLabelElement) {
        this.hoverLabelElement.style.display = 'none';
      }
    };
    const onMouseMove = () => {
      if (
        !this.draggingRef &&
        this.hoverLabelElement &&
        this.hoverLabelElement.style.display === 'block'
      ) {
        this.updateHoverLabelPosition(el);
      }
    };

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

      // Check if clicking on video element or video overlay/placeholder
      const isVideoElement =
        target.matches('video, .video-wrapper, .video-overlay, .video-placeholder, .dz-video') ||
        target.closest('.video-wrapper, .video-overlay, .video-placeholder, .dz-video');

      if (isVideoElement) {
        // Don't stop propagation - let VideoComponent handle the click to open modal
        // But still select the component for toolbar
        if (target !== el && !target.closest('.video-wrapper')) {
          // Clicking on video child - let it handle modal, but select parent component
          setTimeout(() => {
            this.select(ref);
          }, 0);
        } else {
          // Clicking on video wrapper itself - let VideoComponent handle it
          // Only select if not clicking on interactive elements (overlay, placeholder)
          const isInteractive =
            target.matches('.video-overlay, .video-placeholder') ||
            target.closest('.video-overlay, .video-placeholder');
          if (!isInteractive) {
            setTimeout(() => {
              this.select(ref);
            }, 0);
          }
        }
        return;
      }

      // Check if clicking on a textual element (heading, paragraph, etc.)
      // Exclude product-card content from inline editing
      const isProductCardContent = target.closest('.product-card, app-product-card');
      const isTextualElement =
        !isProductCardContent &&
        (target.matches('h1, h2, h3, h4, h5, h6, p, span, .dz-heading, .dz-text') ||
          target.closest('h1, h2, h3, h4, h5, h6, p, span, .dz-heading, .dz-text'));

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

      // For product card, prevent inline edit from being applied
      if (isProductCardContent) {
        e.stopPropagation();
        this.select(ref);
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
    // Exclude product-card from inline editing
    const isProductCard = el.closest('.product-card, app-product-card');
    if (!isProductCard) {
    applyInlineEdit(el, (n) => this.inlineEditService.applyToElement(n));
    }

    const dragStart = (e: DragEvent) => {
      if (this.draggingDisabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      e.stopPropagation();
      const index = this.indexOfRef(ref);
      e.dataTransfer?.setData('text/dz-index', String(index));
      e.dataTransfer?.setData('text/dz-container', containerId);
      if (meta.parentId) {
        e.dataTransfer?.setData('text/dz-parent', meta.parentId);
      }
      e.dataTransfer?.setDragImage?.(new Image(), 0, 0);
      el.classList.add('dragging');
      el.classList.remove('dz-hover-highlight'); // Remove hover highlight when dragging
      // Hide hover label when dragging
      if (this.hoverLabelElement) {
        this.hoverLabelElement.style.display = 'none';
      }
      this.draggingRef = ref;

      // Notify drag-drop manager
      const componentId = this.componentRefs.get(ref);
      this.dragDropManager.startDrag({
        componentId,
        sourceContainerId: containerId,
        sourceIndex: index,
      });
    };

    const dragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Determine if we're over the inner container or the outer element
      const target = e.target as HTMLElement;
      const innerEl = el.querySelector(
        '.section-inner, .row-inner, .column-inner, .vcw-carousel-inner'
      ) as HTMLElement;
      // If no inner element found, use the container element itself (for row/column with ng-container)
      const containerEl =
        innerEl && (innerEl.contains(target) || target === innerEl) ? innerEl : el;

      containerEl.classList.add('drag-over');

      // Show drop indicator for container components (Section, Row, Column)
      // Use innerEl if exists, otherwise use container element directly
      const dropTargetEl =
        innerEl || (typeof (ref.instance as any)?.getChildContainer === 'function' ? el : null);
      if (typeof (ref.instance as any)?.getChildContainer === 'function' && dropTargetEl) {
        const innerRect = dropTargetEl.getBoundingClientRect();
        const relativeY = e.clientY - innerRect.top;

        // Calculate insert index within the container
        const children = Array.from(dropTargetEl.children) as HTMLElement[];
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

        // Publish drag-over for inner container using the actual ViewContainerRef
        const childContainerVcr = (ref.instance as any)?.getChildContainer?.();
        const overId = childContainerVcr
          ? this.ensureContainerRegistered(childContainerVcr)
          : this.componentMeta.get(ref)?.containerId ?? 'root';
        this.dragDropManager.updateOver({
          overContainerId: overId,
          insertIndex,
          rect: { left: innerRect.left, top: innerRect.top + indicatorY, width: innerRect.width },
        });
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
          this.dragDropManager.clearOver();
        }
      }
    };

    const drop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Remove drag-over class from both outer and inner elements
      el.classList.remove('drag-over');
      const innerEl = el.querySelector(
        '.section-inner, .row-inner, .column-inner, .vcw-carousel-inner'
      ) as HTMLElement;
      if (innerEl) {
        innerEl.classList.remove('drag-over');
      }

      const dropContext = captureRootDropContext({
        dragDropManager: this.dragDropManager,
        dropIndicator: this.dropIndicator,
        getContainerById: (id) => this.getContainerById(id),
        fallbackContainer: this.container,
      });
      const { dropState, indicatorState, overContainerId, targetContainer } = dropContext;

      // Hide drop indicator
      this.dropIndicator.hide();
      this.dragDropManager.clearOver();

      const targetMeta = this.componentMeta.get(ref);
      const targetContainerId = targetMeta?.containerId ?? 'root';
      const childContainer =
        typeof (ref.instance as any)?.getChildContainer === 'function'
          ? (ref.instance as any).getChildContainer()
          : null;

      const handled = handleInternalDrop(
        indicatorState.insertIndex ?? null,
        {
          deps: {
            dragDropManager: this.dragDropManager,
            dropIndicator: this.dropIndicator,
            getContainerById: (id) => this.getContainerById(id),
            fallbackContainer: this.container,
          },
          componentRefs: this.componentRefs,
          getContainerRefs: (container, create) => this.getContainerRefs(container, create),
          indexOfRef: (ref) => this.indexOfRef(ref),
          componentModelService: this.componentModelService,
          ensureContainerRegistered: (container) => this.ensureContainerRegistered(container),
          handleCrossContainerMove: (args) => this.handleCrossContainerMove(args),
          reorderWithinContainer: (container, from, to) =>
            this.reorderWithinContainer(container, from, to),
        },
        ref,
        e,
        childContainer,
        innerEl,
        targetMeta,
        targetContainerId,
        targetContainer
      );
      if (handled) {
        el.classList.remove('dragging');
        this.dragDropManager.endDrag();
        return;
      }

      // External add (from toolbox Blocks)
      const parentId = this.componentRefs.get(ref);

      const containerVcr =
        typeof (ref.instance as any)?.getChildContainer === 'function'
          ? (ref.instance as any).getChildContainer()
          : null;

      // If component has getChildContainer, always use it for external drops
      // Otherwise, check if targetContainer is valid
      const finalContainer = containerVcr || targetContainer;
      if (!finalContainer) {
        this.dragDropManager.endDrag();
        return;
      }

      // For components with getChildContainer, we allow drop even if targetContainer doesn't match
      // because the component's own container is the correct target

      const extPayload = this.dragDropManager.parseExternalPayload(e.dataTransfer);
      const handledExternal = handleExternalDrop(
        {
          parentId,
          useVcr: finalContainer,
          componentRefs: this.componentRefs,
          getContainerRefs: (container, create) => this.getContainerRefs(container, create),
          trackComponentRef: (componentRef, container, options) =>
            this.trackComponentRef(componentRef, container, options),
          registerDraggable: (componentRef) => this.registerDraggable(componentRef),
          componentModelService: this.componentModelService,
          parser: this.parser,
          dragDropManager: this.dragDropManager,
          registry: this.registry,
          componentDefinitions: this.componentDefinitions,
          setContainerRef: (container) => this.setContainerRef(container),
          createWidget: (component, options) => this.createWidget(component, options),
          insertWidget: (component, index) => this.insertWidget(component, index),
          createNestedComponents: (parentRef, defs) => this.createNestedComponents(parentRef, defs),
          add: (key, options) => this.add(key, options),
        },
        extPayload,
        indicatorState,
        (key) => resolveBlockHtmlHelper(key)
      );

      if (!handledExternal) {
        this.dragDropManager.endDrag();
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
    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('dragstart', dragStart);
    el.addEventListener('dragover', dragOver);
    el.addEventListener('dragleave', dragLeave);
    el.addEventListener('drop', drop);
    el.addEventListener('dragend', dragEnd);

    // Store cleanup function for hover highlight and label
    const hoverCleanup = () => {
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mousemove', onMouseMove);
      el.classList.remove('dz-hover-highlight');
      // Hide label if this element was showing it
      if (this.hoverLabelElement) {
        this.hoverLabelElement.style.display = 'none';
      }
    };
    this.hoverCleanups.set(ref, hoverCleanup);

    // For components with getChildContainer (like Section, Row, Column),
    // also register drop events on the inner container element
    if (typeof (ref.instance as any)?.getChildContainer === 'function') {
      // Use setTimeout to ensure inner element is rendered
      setTimeout(() => {
        const innerEl = el.querySelector(
          '.section-inner, .row-inner, .column-inner, .vcw-carousel-inner'
        ) as HTMLElement;
        // If no inner element found (e.g., using ng-container), use container element directly
        const dropTargetEl = innerEl || el;
        if (dropTargetEl) {
          dropTargetEl.addEventListener('dragover', dragOver);
          dropTargetEl.addEventListener('dragenter', (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dropTargetEl.classList.add('drag-over');
          });
          dropTargetEl.addEventListener('dragleave', dragLeave);
          dropTargetEl.addEventListener('drop', drop);
          console.log(
            '[DynamicZone] Registered drop events on element:',
            dropTargetEl.className || dropTargetEl.tagName
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
    this.selectionController.select(ref);
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
  private logDOMPosition(_element: HTMLElement): void {}

  private showToolbar(element: HTMLElement, ref: ComponentRef<any>): void {
    this.selectionController.showToolbar(element, ref);
  }

  /**
   * Deselect current element and hide toolbar
   */
  private deselect(): void {
    this.selectionController.deselect();
  }

  private hideToolbar(): void {
    this.selectionController.hideToolbar();
  }

  private showHeadingToolbar(element: HTMLElement): void {
    this.selectionController.showHeadingToolbar(element);
  }

  private handleHeadingToolbarAction(action: string): void {
    this.selectionController.handleHeadingToolbarAction(action);
  }

  private handleToolbarAction(action: string): void {
    this.selectionController.handleToolbarAction(action);
  }

  private moveUp(): void {
    this.selectionController.moveUp();
  }

  private duplicate(): ComponentRef<any> | null {
    return this.selectionController.duplicate();
  }

  private delete(): void {
    this.selectionController.delete();
  }

  private enableDragMode(): void {
    this.selectionController.enableDragMode();
  }

  private getHoverLabel(element: HTMLElement): string {
    // Use the shared getElementLabel function for consistency
    let componentName = getElementLabel(element);

    // Check for Angular component selectors (app-*)
    const tag = element.tagName.toLowerCase();
    if (tag.startsWith('app-')) {
      componentName = tag
        .replace('app-', '')
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    // Add ID if present
    const id = element.id ? `#${element.id}` : '';

    // Build final label
    if (id) {
      return `${componentName} ${id}`;
    }
    return componentName;
  }

  private updateHoverLabelPosition(element: HTMLElement): void {
    if (!this.hoverLabelElement) return;

    const rect = element.getBoundingClientRect();
    const labelRect = this.hoverLabelElement.getBoundingClientRect();

    // Position label at top-left of element
    const top = rect.top + window.scrollY - labelRect.height - 4;
    const left = rect.left + window.scrollX;

    this.hoverLabelElement.style.top = `${top}px`;
    this.hoverLabelElement.style.left = `${left}px`;
  }

  // resolveBlockHtml moved to interaction/styles/component-styles.ts
}
