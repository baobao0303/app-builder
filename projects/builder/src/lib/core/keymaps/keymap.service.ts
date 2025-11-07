import { Injectable, OnDestroy } from '@angular/core';
import { CommandManagerService } from '../new/command-manager/command-manager.service';

type KeyHandler = (e: KeyboardEvent) => void;

@Injectable({ providedIn: 'root' })
export class KeymapService implements OnDestroy {
  private bindings = new Map<string, string>(); // combo -> commandId

  constructor(private commandManager: CommandManagerService) {}

  ngOnDestroy(): void {}

  bind(combo: string, handler: KeyHandler): void {
    const normalized = this.normalize(combo);
    const commandId = `legacy.keymap.${normalized}`;
    this.bindings.set(normalized, commandId);
    this.commandManager.register({
      id: commandId,
      name: `Key Binding ${normalized}`,
      shortcuts: { key: normalized },
      handler: () => handler(new KeyboardEvent('keydown')),
      category: 'LegacyKeymap',
    });
  }

  unbind(combo: string): void {
    const normalized = this.normalize(combo);
    const commandId = this.bindings.get(normalized);
    if (commandId) {
      this.commandManager.unregister(commandId);
      this.bindings.delete(normalized);
    }
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
