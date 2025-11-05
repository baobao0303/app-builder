import { ComponentRef, inject, Injector, Type, viewChild, ViewContainerRef } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { CORE_CONTEXT, CoreContext } from './core.context';

export abstract class CoreBase {
  protected readonly _injector = inject(Injector);
  protected readonly _context = inject(CORE_CONTEXT);
  protected vcrRef: ViewContainerRef | null = null;
  #componentRef?: ComponentRef<unknown>;

  // Gán container một cách tường minh
  public setContainerRef(vcr: ViewContainerRef | null): void {
    this.vcrRef = vcr;
  }

  // Tạo widget từ component truyền vào; có thể append thay vì replace
  public createWidget(
    cmp: Type<unknown>,
    options?: { append?: boolean }
  ): ComponentRef<unknown> | undefined {
    const vcr = this.vcr();
    if (!vcr) return undefined;
    if (!options?.append) {
      vcr.clear();
    }
    const componentRef = vcr.createComponent(cmp as Type<unknown>);
    componentRef.onDestroy(() => {
      // Cleanup khi component bị destroy
    });
    return componentRef;
  }

  // Thêm mới ở cuối (append)
  public appendWidget(cmp: Type<unknown>): void {
    const vcr = this.vcr();
    if (!vcr) return;
    vcr.createComponent(cmp as Type<unknown>);
  }

  // Chèn vào vị trí chỉ định (insert)
  public insertWidget(cmp: Type<unknown>, index: number): ComponentRef<unknown> | undefined {
    const vcr = this.vcr();
    if (!vcr) return undefined;
    const safeIndex = Math.max(0, Math.min(index, vcr.length));
    return vcr.createComponent(cmp as Type<unknown>, { index: safeIndex });
  }

  // Xoá widget theo index
  public removeWidget(index: number): void {
    const vcr = this.vcr();
    if (!vcr) return;
    if (index < 0 || index >= vcr.length) return;
    vcr.remove(index);
  }

  // Di chuyển widget từ vị trí from -> to
  public moveWidget(from: number, to: number): void {
    const vcr = this.vcr();
    if (!vcr) return;
    if (from < 0 || from >= vcr.length) return;
    const target = Math.max(0, Math.min(to, vcr.length - 1));
    const view = vcr.get(from);
    if (!view) return;
    vcr.move(view, target);
  }

  // Dọn sạch toàn bộ
  public clearWidgets(): void {
    const vcr = this.vcr();
    if (!vcr) return;
    vcr.clear();
  }

  // Đếm số widget hiện có
  public getWidgetCount(): number {
    const vcr = this.vcr();
    return vcr ? vcr.length : 0;
  }

  // Xuất HTML thô từ một phần tử container
  public exportHtmlFrom(containerEl: HTMLElement): string {
    return containerEl.innerHTML;
  }

  //create component + angular element
  createComponent() {
    const vcr = this.vcr();
    if (!vcr) return;
    vcr.clear();
    const cmp = this.getWidgetComponent();
    this.#componentRef = vcr.createComponent(cmp);
    // clean up to release from memory and avoid detached elements
    this.#componentRef.onDestroy(() => (this.#componentRef = undefined));
  }

  //destroy component
  destroyComponent() {
    const vcr = this.vcr();
    if (!vcr) return;
    vcr.clear();
  }

  // Helper để tương thích với cách gọi this.vcr()? trong code hiện có
  protected vcr(): ViewContainerRef | null {
    return this.vcrRef ?? this.getViewContainerRef() ?? null;
  }

  // Subclass phải cung cấp ViewContainerRef (ví dụ qua @ViewChild trong Component cụ thể)
  protected abstract getViewContainerRef(): ViewContainerRef | null;

  // Subclass phải cung cấp component sẽ được render động
  protected abstract getWidgetComponent(): Type<any>;
  /**
   * Gets the context as a specific type
   * @template CType - The type to cast the context to, which extends CoreContext
   * @returns The context cast to the specified type CType
   */
  public getContextAs<CType extends CoreContext>(): CType {
    const context = this._context as unknown;
    return context as CType;
  }

  /**
   * Đăng ký một Angular Component thành Custom Element với tag chỉ định
   * - Chỉ define nếu chưa tồn tại để tránh lỗi khi gọi nhiều lần
   */
  public defineCustomElement(tagName: string, component: Type<unknown>): void {
    if (!customElements.get(tagName)) {
      const element = createCustomElement(component as Type<unknown>, { injector: this._injector });
      customElements.define(tagName, element as unknown as CustomElementConstructor);
    }
  }
}
