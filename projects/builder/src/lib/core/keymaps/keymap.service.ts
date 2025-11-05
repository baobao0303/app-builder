import { Injectable, OnDestroy } from '@angular/core';

type KeyHandler = (e: KeyboardEvent) => void;

@Injectable({ providedIn: 'root' })
export class KeymapService implements OnDestroy {
  private bindings = new Map<string, KeyHandler>();
  private onKeydown = (e: KeyboardEvent) => {
    const combo = this.toCombo(e);
    const handler = this.bindings.get(combo);
    if (handler) {
      e.preventDefault();
      handler(e);
    }
  };

  constructor() {
    window.addEventListener('keydown', this.onKeydown, { passive: false });
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.onKeydown as any);
  }

  bind(combo: string, handler: KeyHandler): void {
    this.bindings.set(this.normalize(combo), handler);
  }

  unbind(combo: string): void {
    this.bindings.delete(this.normalize(combo));
  }

  private toCombo(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }

  private normalize(combo: string): string {
    return combo
      .toLowerCase()
      .split('+')
      .map(s => s.trim())
      .filter(Boolean)
      .join('+');
    }
  }
