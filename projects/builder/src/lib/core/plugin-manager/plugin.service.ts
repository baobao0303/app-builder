import { Injectable } from '@angular/core';

export interface PluginContext {
  [key: string]: any;
}

export interface Plugin {
  name: string;
  init(ctx: PluginContext): void | Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class PluginService {
  private plugins: Plugin[] = [];
  private initialized = false;

  register(plugin: Plugin): void {
    this.plugins.push(plugin);
    if (this.initialized) {
      // late registration
      plugin.init({});
    }
  }

  async init(ctx: PluginContext = {}): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    for (const p of this.plugins) {
      await p.init(ctx);
    }
  }
}
