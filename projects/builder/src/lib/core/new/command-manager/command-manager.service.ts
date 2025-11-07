import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import {
  CommandConfig,
  CommandExecutionContext,
  CommandHandler,
  KeyboardShortcut,
  Platform,
  RegisteredCommand,
} from './command.interface';

@Injectable({ providedIn: 'root' })
export class CommandManagerService implements OnDestroy {
  private commands = new Map<string, RegisteredCommand>();
  private shortcutMap = new Map<string, string>(); // shortcut -> commandId
  private platform: Platform;
  private executionSubject = new Subject<CommandExecutionContext>();

  /** Observable stream of command executions */
  readonly execution$ = this.executionSubject.asObservable();

  constructor() {
    this.platform = this.detectPlatform();
    this.initKeyboardListener();
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.handleKeydown);
    this.commands.clear();
    this.shortcutMap.clear();
    this.executionSubject.complete();
  }

  /**
   * Register a command
   * @param config Command configuration
   */
  register<T = any>(config: CommandConfig<T>): void {
    const shortcuts = this.resolveShortcuts(config.shortcuts);

    const registeredCommand: RegisteredCommand<T> = {
      id: config.id,
      name: config.name,
      description: config.description,
      handler: config.handler,
      category: config.category,
      enabled: config.enabled ?? true,
      shortcuts,
      originalShortcuts: this.normalizeShortcuts(config.shortcuts),
    };

    // Remove old shortcuts if command already exists
    if (this.commands.has(config.id)) {
      this.unregisterShortcuts(config.id);
    }

    this.commands.set(config.id, registeredCommand);

    // Register shortcuts
    shortcuts.forEach((shortcut) => {
      this.shortcutMap.set(shortcut, config.id);
    });
  }

  /**
   * Register multiple commands at once
   * @param configs Array of command configurations
   */
  registerMany(configs: CommandConfig[]): void {
    configs.forEach((config) => this.register(config));
  }

  /**
   * Unregister a command
   * @param commandId Command identifier
   */
  unregister(commandId: string): void {
    this.unregisterShortcuts(commandId);
    this.commands.delete(commandId);
  }

  /**
   * Execute a command by ID
   * @param commandId Command identifier
   * @param data Optional data to pass to the command handler
   * @param triggeredBy How the command was triggered
   */
  async execute<T = any>(
    commandId: string,
    data?: T,
    triggeredBy: 'keyboard' | 'api' | 'ui' = 'api'
  ): Promise<void> {
    const command = this.commands.get(commandId);

    if (!command) {
      console.warn(`[CommandManager] Command not found: ${commandId}`);
      return;
    }

    if (!command.enabled) {
      console.warn(`[CommandManager] Command is disabled: ${commandId}`);
      return;
    }

    const context: CommandExecutionContext<T> = {
      commandId,
      data,
      timestamp: Date.now(),
      triggeredBy,
    };

    this.executionSubject.next(context);

    try {
      await command.handler(data);
    } catch (error) {
      console.error(`[CommandManager] Error executing command ${commandId}:`, error);
      throw error;
    }
  }

  /**
   * Get a registered command
   * @param commandId Command identifier
   */
  getCommand(commandId: string): RegisteredCommand | undefined {
    return this.commands.get(commandId);
  }

  /**
   * Get all registered commands
   */
  getAllCommands(): RegisteredCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands by category
   * @param category Command category
   */
  getCommandsByCategory(category: string): RegisteredCommand[] {
    return this.getAllCommands().filter((cmd) => cmd.category === category);
  }

  /**
   * Enable or disable a command
   * @param commandId Command identifier
   * @param enabled Whether to enable or disable
   */
  setCommandEnabled(commandId: string, enabled: boolean): void {
    const command = this.commands.get(commandId);
    if (command) {
      command.enabled = enabled;
    }
  }

  /**
   * Get the current platform
   */
  getPlatform(): Platform {
    return this.platform;
  }

  /**
   * Detect the current platform
   */
  private detectPlatform(): Platform {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    if (platform.includes('mac') || userAgent.includes('mac')) {
      return 'macos';
    }
    if (platform.includes('linux') || userAgent.includes('linux')) {
      return 'linux';
    }
    return 'windows';
  }

  /**
   * Resolve shortcuts for the current platform
   */
  private resolveShortcuts(shortcuts?: KeyboardShortcut | KeyboardShortcut[]): string[] {
    if (!shortcuts) return [];

    const shortcutArray = Array.isArray(shortcuts) ? shortcuts : [shortcuts];
    const resolved: string[] = [];

    shortcutArray.forEach((shortcut) => {
      let key: string;

      // Use platform-specific override if available
      if (this.platform === 'macos' && shortcut.macKey) {
        key = shortcut.macKey;
      } else if ((this.platform === 'windows' || this.platform === 'linux') && shortcut.winKey) {
        key = shortcut.winKey;
      } else {
        // Auto-map ctrl to cmd on macOS
        key = this.autoMapShortcut(shortcut.key);
      }

      resolved.push(this.normalizeShortcut(key));
    });

    return resolved;
  }

  /**
   * Auto-map shortcuts for the current platform
   * Converts 'ctrl' to 'cmd' on macOS
   */
  private autoMapShortcut(key: string): string {
    if (this.platform === 'macos') {
      return key.replace(/\bctrl\b/gi, 'cmd');
    }
    return key;
  }

  /**
   * Normalize a shortcut string
   * Converts to lowercase and sorts modifiers
   */
  private normalizeShortcut(shortcut: string): string {
    const parts = shortcut
      .toLowerCase()
      .split('+')
      .map((s) => s.trim())
      .filter(Boolean);

    const modifiers = ['ctrl', 'cmd', 'meta', 'shift', 'alt', 'option'];
    const mods = parts.filter((p) => modifiers.includes(p)).sort();
    const keys = parts.filter((p) => !modifiers.includes(p));

    return [...mods, ...keys].join('+');
  }

  /**
   * Normalize shortcuts array
   */
  private normalizeShortcuts(
    shortcuts?: KeyboardShortcut | KeyboardShortcut[]
  ): KeyboardShortcut[] {
    if (!shortcuts) return [];
    return Array.isArray(shortcuts) ? shortcuts : [shortcuts];
  }

  /**
   * Unregister all shortcuts for a command
   */
  private unregisterShortcuts(commandId: string): void {
    const command = this.commands.get(commandId);
    if (command) {
      command.shortcuts.forEach((shortcut) => {
        this.shortcutMap.delete(shortcut);
      });
    }
  }

  /**
   * Initialize keyboard event listener
   */
  private initKeyboardListener(): void {
    window.addEventListener('keydown', this.handleKeydown, { passive: false });
  }

  /**
   * Handle keyboard events
   */
  private handleKeydown = (event: KeyboardEvent): void => {
    const shortcut = this.eventToShortcut(event);
    const commandId = this.shortcutMap.get(shortcut);

    if (commandId) {
      event.preventDefault();
      event.stopPropagation();
      this.execute(commandId, undefined, 'keyboard');
    }
  };

  /**
   * Convert keyboard event to shortcut string
   */
  private eventToShortcut(event: KeyboardEvent): string {
    const parts: string[] = [];

    // Handle modifiers
    if (event.ctrlKey) parts.push('ctrl');
    if (event.metaKey) parts.push('cmd');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');

    // Handle key
    const key = event.key.toLowerCase();
    if (key && !['control', 'meta', 'shift', 'alt'].includes(key)) {
      parts.push(key);
    }

    return this.normalizeShortcut(parts.join('+'));
  }
}
