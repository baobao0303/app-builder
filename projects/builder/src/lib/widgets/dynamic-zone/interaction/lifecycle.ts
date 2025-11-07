export interface LifecycleInitCtx {
  hostEl: HTMLElement | null;
  deselect: () => void;
  undo: () => void;
  redo: () => void;
}

export interface LifecycleHandlers {
  canvasClickHandler?: (e: MouseEvent) => void;
  keydownHandler?: (e: KeyboardEvent) => void;
}

export function initLifecycle(ctx: LifecycleInitCtx): LifecycleHandlers {
  const handlers: LifecycleHandlers = {};

  if (ctx.hostEl) {
    handlers.canvasClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target === ctx.hostEl) {
        ctx.deselect();
      } else {
        const clickedItem = target.closest('.dz-item');
        const isInteractive = target.closest('input, button, select, textarea, .floating-toolbar');
        if (ctx.hostEl && ctx.hostEl.contains(target) && !clickedItem && !isInteractive && target !== ctx.hostEl) {
          const isDirectChild = Array.from(ctx.hostEl.children).includes(target);
          if (isDirectChild && !target.classList.contains('dz-item')) ctx.deselect();
        }
      }
    };

    ctx.hostEl.addEventListener('click', handlers.canvasClickHandler, true);
  }

  handlers.keydownHandler = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !isEditing) {
      e.preventDefault();
      ctx.undo();
      return;
    }

    if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
      if (!isEditing) {
        e.preventDefault();
        ctx.redo();
      }
      return;
    }
  };
  document.addEventListener('keydown', handlers.keydownHandler);

  return handlers;
}

export function destroyLifecycle(ctx: { hostEl: HTMLElement | null }, handlers: LifecycleHandlers): void {
  if (handlers.canvasClickHandler && ctx.hostEl) {
    ctx.hostEl.removeEventListener('click', handlers.canvasClickHandler, true);
  }
  if (handlers.keydownHandler) {
    document.removeEventListener('keydown', handlers.keydownHandler);
  }
}


