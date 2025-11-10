import { ApplicationRef, ComponentRef, Injector, ViewContainerRef } from '@angular/core';

import { SelectionService } from '../../../core/editor/selection.service';
import { SelectorManagerService } from '../../../core/new/selector-manager/selector-manager.service';
import { ComponentModelService } from '../../../core/dom-components/component-model.service';
import { TraitManagerService } from '../../../core/trait-manager/trait-manager.service';
import { DuplicateCommand, MoveCommand } from '../../../core/undo-manager/undo-manager.service';
import { FloatingToolbarComponent } from '../../components/floating-toolbar/floating-toolbar.component';
import { FloatingToolbarHeadingComponent } from '../../components/floating-toolbar/floating-toobar-heading.component';
import { isTextOrHeadingElement } from './editor-utils';
import { DynamicCategoryTabsComponent } from '../../components/dynamic-category-tabs/dynamic-category-tabs.component';

export interface SelectionContext {
  selected?: ComponentRef<any>;
  setSelected(ref: ComponentRef<any> | undefined): void;
  getContainerOfSelected(): ViewContainerRef | null;
  indexOfSelected(): number;
  componentRefs: Map<ComponentRef<any>, string>;
  componentModelService: ComponentModelService;
  undoManager: { execute: (cmd: any, opts?: any) => void };
  trackComponentRef(
    ref: ComponentRef<any>,
    container: ViewContainerRef,
    options: { parentId?: string; componentId?: string; insertIndex?: number }
  ): void;
  getContainerRefs(container: ViewContainerRef, create?: boolean): ComponentRef<any>[];
  setContainerRef(container: ViewContainerRef): void;
  insertWidget(component: any, index: number): ComponentRef<any> | null | undefined;
  createWidget(
    component: any,
    options?: { append?: boolean }
  ): ComponentRef<any> | null | undefined;
  registerDraggable(ref: ComponentRef<any>): void;
  reorderWithinContainer(container: ViewContainerRef, from: number, to: number): void;
  registry: Record<string, any>;
  nextComponent?: any;
  setNextComponent(component: any): void;
  hideToolbar(): void;
}

export function moveUp(ctx: SelectionContext): void {
  if (!ctx.selected) return;
  const index = ctx.indexOfSelected();
  if (index <= 0) return;

  const id = ctx.componentRefs.get(ctx.selected);
  if (!id) return;
  const model = ctx.componentModelService.getComponent(id);
  const parent = model?.getParent();
  const parentId = parent?.getId();
  if (!parentId) return;

  const cmd = new MoveCommand(ctx.componentModelService, parentId, index, index - 1);
  ctx.undoManager.execute(cmd, { label: 'Move Up' });

  const container = ctx.getContainerOfSelected();
  if (container) ctx.reorderWithinContainer(container, index, index - 1);
}

export function duplicate(ctx: SelectionContext): ComponentRef<any> | null {
  if (!ctx.selected) return null;
  const index = ctx.indexOfSelected();
  const container = ctx.getContainerOfSelected() || null;
  if (!container) return null;

  const id = ctx.componentRefs.get(ctx.selected);
  if (!id) return null;
  const model = ctx.componentModelService.getComponent(id);
  const parent = model?.getParent();
  const parentId = parent?.getId() || '';

  const cmd = new DuplicateCommand(ctx.componentModelService, id, parentId, index + 1);
  ctx.undoManager.execute(cmd, { label: 'Duplicate Component' });

  const parentModel = ctx.componentModelService.getComponent(parentId);
  const cloned = parentModel?.getComponents()[index + 1];
  const componentType = (model && ctx.registry[model.getTagName()]) || ctx.nextComponent;
  if (!componentType || !cloned) return null;

  ctx.setContainerRef(container);
  const clonedRef = ctx.insertWidget(componentType, index + 1) as ComponentRef<any> | undefined;
  if (!clonedRef) return null;
  const position = Math.min(index + 1, ctx.getContainerRefs(container).length);
  ctx.trackComponentRef(clonedRef, container, {
    parentId: parentId || undefined,
    componentId: cloned.getId(),
    insertIndex: position,
  });
  ctx.registerDraggable(clonedRef);
  return clonedRef;
}

export function deleteSelected(ctx: SelectionContext): void {
  if (!ctx.selected) return;
  const id = ctx.componentRefs.get(ctx.selected);
  if (!id) return;
  const model = ctx.componentModelService.getComponent(id);
  if (!model) return;
  const parent = model.getParent();
  const parentId = parent?.getId();

  // Minimal inline command (avoid re-import if not present)
  const deleteCmd: any = new (class {
    private svc: ComponentModelService;
    private cid: string;
    private pid?: string;
    private snapshot: any;
    constructor(svc: ComponentModelService, cid: string, pid?: string) {
      this.svc = svc;
      this.cid = cid;
      this.pid = pid;
    }
    execute() {
      const comp = this.svc.getComponent(this.cid);
      this.snapshot = comp?.toJSON();
      this.svc.removeComponent(this.cid);
    }
    undo() {
      if (this.snapshot && this.pid) {
        this.svc.createComponent(this.snapshot, this.pid);
      }
    }
  })(ctx.componentModelService, id, parentId);

  ctx.undoManager.execute(deleteCmd, { label: 'Delete Component' });

  const container = ctx.getContainerOfSelected();
  const index = ctx.indexOfSelected();
  if (container && index >= 0) {
    container.remove(index);
    ctx.componentRefs.delete(ctx.selected!);
    ctx.selected!.destroy();
    ctx.setSelected(undefined);
    ctx.hideToolbar();
  }
}

export function enableDragMode(ctx: SelectionContext, selectedElement?: HTMLElement | null): void {
  if (!selectedElement) return;
  selectedElement.style.cursor = 'move';
  setTimeout(() => {
    selectedElement.style.cursor = '';
  }, 2000);
}

export interface SelectionControllerContext extends SelectionContext {
  container: ViewContainerRef;
  appRef: ApplicationRef;
  injector: Injector;
  selectionService: SelectionService;
  selectorManager: SelectorManagerService;
  traitManager: TraitManagerService;
  applyTraits(targetEl: HTMLElement): void;
  logDom(element: HTMLElement, selectedId?: string): void;
  getSelected(): ComponentRef<any> | undefined;
  setSelected(ref: ComponentRef<any> | undefined): void;
  getNextComponent(): any;
  indexOfRef(ref: ComponentRef<any>): number;
}

export class SelectionController {
  private resizeHandles: HTMLElement[] = [];
  private toolbarRef?: ComponentRef<FloatingToolbarComponent>;
  private headingToolbarRef?: ComponentRef<FloatingToolbarHeadingComponent>;
  private selectedElement?: HTMLElement;
  private clickOutsideHandler?: (event: MouseEvent) => void;

  private isResizing = false;
  private initialResizeInfo: {
    width: number;
    height: number;
    x: number;
    y: number;
    handle: string;
  } | null = null;

  constructor(private readonly ctx: SelectionControllerContext) {}

  select(ref: ComponentRef<any>): void {
    const prevRef = this.ctx.getSelected();
    const prevEl = (prevRef?.location?.nativeElement || null) as HTMLElement | null;
    if (prevEl) prevEl.classList.remove('dz-selected');

    this.ctx.setSelected(ref);

    const el = (ref.location?.nativeElement || null) as HTMLElement | null;
    if (el) el.classList.add('dz-selected');

    const id = this.ctx.componentRefs.get(ref);
    this.ctx.selectionService.select(id);
    if (id) this.ctx.selectorManager.select(id);

    if (el) this.ctx.logDom(el, id ?? undefined);

    if (el) {
      this.selectedElement = el;
      this.showToolbar(el, ref);
      this.showResizeHandles(el);
    } else {
      this.hideToolbar();
    }

    if (el) {
      const isLayoutComponent =
        el.classList.contains('dz-row') ||
        el.classList.contains('dz-column') ||
        el.getAttribute('data-widget') === 'row' ||
        el.getAttribute('data-widget') === 'column' ||
        el.tagName?.toLowerCase() === 'app-row' ||
        el.tagName?.toLowerCase() === 'app-column';

      let targetEl = el;
      if (!isLayoutComponent) {
        const innerTextual = el.querySelector(
          'h1, h2, h3, h4, h5, h6, p, .dz-heading, .dz-text'
        ) as HTMLElement | null;
        targetEl = innerTextual || el;
      }

      this.ctx.applyTraits(targetEl);

      try {
        const traitSummaries = this.ctx.traitManager
          .getTraits()
          .map((t: any) => ({ id: t.getId(), name: t.getName(), value: t.getValue() }));
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

  deselect(): void {
    const selected = this.ctx.getSelected();
    if (selected) {
      const el = (selected.location?.nativeElement || null) as HTMLElement | null;
      if (el) {
        el.classList.remove('dz-selected');
      }
    }

    this.ctx.setSelected(undefined);
    this.selectedElement = undefined;
    this.ctx.selectionService.select(undefined);
    this.ctx.selectorManager.select(null);
    this.hideToolbar();
    this.ctx.traitManager.clear();
  }

  showToolbar(element: HTMLElement, ref: ComponentRef<any>): void {
    this.hideToolbar();

    const toolbarRef = this.ctx.container.createComponent(FloatingToolbarComponent, {
      injector: this.ctx.injector,
    }) as ComponentRef<FloatingToolbarComponent>;

    toolbarRef.instance.label = this.getElementLabel(element);
    toolbarRef.instance.targetElement = element;

    const elementIndex = this.ctx.indexOfRef(ref);
    toolbarRef.instance.canMoveUp = elementIndex > 0;

    if (element.tagName.toLowerCase() === 'app-dynamic-category-tabs') {
      toolbarRef.instance.showAddButton = true;
    }

    toolbarRef.instance.action.subscribe((action: string) => this.handleToolbarAction(action));
    toolbarRef.changeDetectorRef.detectChanges();

    const nativeElement = toolbarRef.location.nativeElement;
    const hostView = toolbarRef.hostView;

    const containerIndex = this.ctx.container.indexOf(hostView);
    if (containerIndex >= 0) {
      this.ctx.container.detach(containerIndex);
    }

    try {
      this.ctx.appRef.attachView(hostView);
    } catch (err: any) {
      if (!err?.message?.includes('already attached')) throw err;
    }

    document.body.appendChild(nativeElement);
    const hostElement = nativeElement as HTMLElement;
    hostElement.style.position = 'fixed';
    hostElement.style.zIndex = '10000';
    hostElement.style.display = 'block';
    hostElement.style.pointerEvents = 'auto';

    toolbarRef.changeDetectorRef.detectChanges();
    this.toolbarRef = toolbarRef;

    // Don't show heading toolbar for product-card
    const isProductCard = element.closest('.product-card, app-product-card');
    if (!isProductCard && isTextOrHeadingElement(element)) {
      this.showHeadingToolbar(element);
    }

    if (toolbarRef.instance.updatePosition) {
      toolbarRef.instance.updatePosition();
      toolbarRef.changeDetectorRef.detectChanges();
      setTimeout(() => {
        toolbarRef.instance.updatePosition?.();
        toolbarRef.changeDetectorRef.detectChanges();
      }, 100);
    }

    this.clickOutsideHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const toolbarElement = toolbarRef.location.nativeElement;
      const headingElement = this.headingToolbarRef?.location.nativeElement;

      if (toolbarElement && toolbarElement.contains(target)) return;
      if (headingElement && headingElement.contains(target)) return;
      if (this.selectedElement && this.selectedElement.contains(target)) return;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('input, button, select, textarea')
      ) {
        return;
      }

      this.deselect();
    };

    setTimeout(() => {
      if (this.clickOutsideHandler) {
        document.addEventListener('click', this.clickOutsideHandler, true);
      }
    }, 200);
  }

  showHeadingToolbar(element: HTMLElement): void {
    if (this.headingToolbarRef) {
      const headingHostView = this.headingToolbarRef.hostView;
      try {
        this.ctx.appRef.detachView(headingHostView);
      } catch {}
      const headingNativeElement = this.headingToolbarRef.location.nativeElement;
      if (headingNativeElement?.parentNode) {
        headingNativeElement.parentNode.removeChild(headingNativeElement);
      }
      this.headingToolbarRef.destroy();
      this.headingToolbarRef = undefined;
    }

    const headingToolbarRef = this.ctx.container.createComponent(FloatingToolbarHeadingComponent, {
      injector: this.ctx.injector,
    }) as ComponentRef<FloatingToolbarHeadingComponent>;

    headingToolbarRef.instance.targetElement = element;
    headingToolbarRef.instance.action.subscribe((action: string) =>
      this.handleHeadingToolbarAction(action)
    );

    headingToolbarRef.changeDetectorRef.detectChanges();

    const headingHostView = headingToolbarRef.hostView;
    const headingContainerIndex = this.ctx.container.indexOf(headingHostView);
    if (headingContainerIndex >= 0) {
      this.ctx.container.detach(headingContainerIndex);
    }

    try {
      this.ctx.appRef.attachView(headingHostView);
    } catch (err: any) {
      if (!err?.message?.includes('already attached')) throw err;
    }

    const headingNativeElement = headingToolbarRef.location.nativeElement;
    document.body.appendChild(headingNativeElement);
    const headingHostElement = headingNativeElement as HTMLElement;
    headingHostElement.style.position = 'fixed';
    headingHostElement.style.zIndex = '10000';
    headingHostElement.style.display = 'block';
    headingHostElement.style.pointerEvents = 'auto';

    headingToolbarRef.changeDetectorRef.detectChanges();
    this.headingToolbarRef = headingToolbarRef;

    headingToolbarRef.instance.updatePosition?.();
    headingToolbarRef.changeDetectorRef.detectChanges();
    setTimeout(() => {
      headingToolbarRef.instance.updatePosition?.();
      headingToolbarRef.changeDetectorRef.detectChanges();
    }, 100);
  }

  handleToolbarAction(action: string): void {
    switch (action) {
      case 'add': {
        const selected = this.ctx.getSelected();
        if (selected && selected.instance instanceof DynamicCategoryTabsComponent) {
          selected.instance.addNewTab();
        }
        break;
      }
      case 'ai':
        if (this.selectedElement) {
          this.showHeadingToolbar(this.selectedElement);
        }
        break;
      case 'moveUp':
        this.moveUp();
        if (this.toolbarRef && this.ctx.getSelected()) {
          const newIndex = this.ctx.indexOfSelected();
          this.toolbarRef.instance.canMoveUp = newIndex > 0;
          this.toolbarRef.changeDetectorRef.detectChanges();
        }
        break;
      case 'move':
        this.enableDragMode();
        break;
      case 'duplicate': {
        const duplicatedRef = this.duplicate();
        if (duplicatedRef) {
          setTimeout(() => this.select(duplicatedRef), 50);
        }
        break;
      }
      case 'delete':
        this.delete();
        break;
    }
  }

  handleHeadingToolbarAction(action: string): void {
    console.log('Heading toolbar action:', action);
    // Formatting already applied by component; can hook into model updates here if needed.
  }

  moveUp(): void {
    moveUp(this.buildHelperContext());
  }

  duplicate(): ComponentRef<any> | null {
    return duplicate(this.buildHelperContext());
  }

  delete(): void {
    deleteSelected(this.buildHelperContext());
  }

  reShowResizeHandles(): void {
    if (this.selectedElement) {
      this.showResizeHandles(this.selectedElement);
    }
  }

  enableDragMode(): void {
    this.hideResizeHandles();
    enableDragMode(this.buildHelperContext(), this.selectedElement);
  }

  hideToolbar(): void {
    this.hideResizeHandles();

    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler, true);
      this.clickOutsideHandler = undefined;
    }

    if (this.headingToolbarRef) {
      try {
        this.ctx.appRef.detachView(this.headingToolbarRef.hostView);
      } catch {}
      const headingNativeElement = this.headingToolbarRef.location.nativeElement;
      if (headingNativeElement?.parentNode) {
        headingNativeElement.parentNode.removeChild(headingNativeElement);
      }
      this.headingToolbarRef.destroy();
      this.headingToolbarRef = undefined;
    }

    if (this.toolbarRef) {
      try {
        this.ctx.appRef.detachView(this.toolbarRef.hostView);
      } catch {}
      const nativeElement = this.toolbarRef.location.nativeElement;
      if (nativeElement?.parentNode) {
        nativeElement.parentNode.removeChild(nativeElement);
      }
      this.toolbarRef.destroy();
      this.toolbarRef = undefined;
    }
  }

  private onResizeMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const handle = e.target as HTMLElement;
    const handleType = handle.dataset['handle'];
    if (!handleType || !this.selectedElement) return;

    this.isResizing = true;
    const rect = this.selectedElement.getBoundingClientRect();

    this.initialResizeInfo = {
      width: rect.width,
      height: rect.height,
      x: e.clientX,
      y: e.clientY,
      handle: handleType,
    };

    window.addEventListener('mousemove', this.onResizeMouseMove, true);
    window.addEventListener('mouseup', this.onResizeMouseUp, true);
  };

  private onResizeMouseMove = (e: MouseEvent) => {
    if (!this.isResizing || !this.initialResizeInfo || !this.selectedElement) return;

    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - this.initialResizeInfo.x;
    const dy = e.clientY - this.initialResizeInfo.y;

    let newWidth = this.initialResizeInfo.width;
    let newHeight = this.initialResizeInfo.height;

    const handle = this.initialResizeInfo.handle;

    if (handle.includes('right')) {
      newWidth += dx;
    }
    if (handle.includes('left')) {
      newWidth -= dx;
    }
    if (handle.includes('bottom')) {
      newHeight += dy;
    }
    if (handle.includes('top')) {
      newHeight -= dy;
    }

    // Apply new dimensions, ensuring they are not negative
    this.selectedElement.style.width = `${Math.max(20, newWidth)}px`;
    this.selectedElement.style.height = `${Math.max(20, newHeight)}px`;

    this.updateResizeHandlesPosition(this.selectedElement);
  };

  private onResizeMouseUp = (e: MouseEvent) => {
    if (!this.isResizing) return;

    e.preventDefault();
    e.stopPropagation();

    this.isResizing = false;
    this.initialResizeInfo = null;

    window.removeEventListener('mousemove', this.onResizeMouseMove, true);
    window.removeEventListener('mouseup', this.onResizeMouseUp, true);

    // Here you would typically save the new size to the component model
    // For now, it's just a visual change.
    const id = this.ctx.componentRefs.get(this.ctx.getSelected()!);
    if (id) {
      const model = this.ctx.componentModelService.getComponent(id);
      if (model) {
        const newStyle = {
          ...model.getStyle(),
          width: this.selectedElement?.style.width,
          height: this.selectedElement?.style.height,
        };
        this.ctx.componentModelService.updateComponent(id, { style: newStyle });
      }
    }
  };

  private onResizeOrScroll = () => {
    if (this.selectedElement) {
      this.updateResizeHandlesPosition(this.selectedElement);
    }
  };

  showResizeHandles(element: HTMLElement): void {
    this.hideResizeHandles(); // Clear any existing handles

    const positions = [
      'top-left',
      'top-center',
      'top-right',
      'middle-left',
      'middle-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ];

    positions.forEach((pos) => {
      const handle = document.createElement('div');
      handle.className = `dz-resize-handle ${pos.replace('-', '_')}`;
      handle.dataset['handle'] = pos;
      document.body.appendChild(handle);
      this.resizeHandles.push(handle);

      handle.addEventListener('mousedown', this.onResizeMouseDown);
    });

    this.updateResizeHandlesPosition(element);
    window.addEventListener('scroll', this.onResizeOrScroll, true);
    window.addEventListener('resize', this.onResizeOrScroll, true);
  }

  updateResizeHandlesPosition(element: HTMLElement): void {
    if (this.resizeHandles.length === 0) return;

    const rect = element.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    const handleSize = 8;

    this.resizeHandles.forEach((handle) => {
      const pos = handle.dataset['handle'];
      handle.style.position = 'absolute';
      handle.style.zIndex = '10001';

      // Vertical positioning
      if (pos?.includes('top')) {
        handle.style.top = `${rect.top + scrollTop - handleSize / 2}px`;
      }
      if (pos?.includes('middle')) {
        handle.style.top = `${rect.top + scrollTop + rect.height / 2 - handleSize / 2}px`;
      }
      if (pos?.includes('bottom')) {
        handle.style.top = `${rect.bottom + scrollTop - handleSize / 2}px`;
      }

      // Horizontal positioning
      if (pos?.includes('left')) {
        handle.style.left = `${rect.left + scrollLeft - handleSize / 2}px`;
      }
      if (pos?.includes('center')) {
        handle.style.left = `${rect.left + scrollLeft + rect.width / 2 - handleSize / 2}px`;
      }
      if (pos?.includes('right')) {
        handle.style.left = `${rect.right + scrollLeft - handleSize / 2}px`;
      }
    });
  }

  hideResizeHandles(): void {
    this.resizeHandles.forEach((handle) => {
      handle.removeEventListener('mousedown', this.onResizeMouseDown);
      handle.remove();
    });
    this.resizeHandles = [];
    window.removeEventListener('scroll', this.onResizeOrScroll, true);
    window.removeEventListener('resize', this.onResizeOrScroll, true);
  }

  destroy(): void {
    this.hideToolbar();
    this.selectedElement = undefined;
    this.clickOutsideHandler = undefined;
  }

  private buildHelperContext(): SelectionContext {
    return {
      selected: this.ctx.getSelected(),
      setSelected: (ref) => this.ctx.setSelected(ref),
      getContainerOfSelected: () => this.ctx.getContainerOfSelected(),
      indexOfSelected: () => this.ctx.indexOfSelected(),
      componentRefs: this.ctx.componentRefs,
      componentModelService: this.ctx.componentModelService,
      undoManager: this.ctx.undoManager,
      trackComponentRef: (ref, container, options) =>
        this.ctx.trackComponentRef(ref, container, options),
      getContainerRefs: (container, create) => this.ctx.getContainerRefs(container, create),
      setContainerRef: (container) => this.ctx.setContainerRef(container),
      insertWidget: (component, index) => this.ctx.insertWidget(component, index),
      createWidget: (component, options) => this.ctx.createWidget(component, options),
      registerDraggable: (ref) => this.ctx.registerDraggable(ref),
      reorderWithinContainer: (container, from, to) =>
        this.ctx.reorderWithinContainer(container, from, to),
      registry: this.ctx.registry,
      nextComponent: this.ctx.getNextComponent(),
      setNextComponent: (component) => this.ctx.setNextComponent(component),
      hideToolbar: () => this.hideToolbar(),
    };
  }

  private getElementLabel(element: HTMLElement): string {
    const tag = element.tagName.toLowerCase();
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

    if (tag.startsWith('h')) {
      const level = tag.charAt(1);
      return `H${level} Heading`;
    }

    if (element.classList.contains('dz-row')) {
      return 'Row';
    }
    if (element.classList.contains('dz-column')) {
      return 'Column';
    }
    if (element.classList.contains('dz-section')) {
      return 'Section';
    }

    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }
}
