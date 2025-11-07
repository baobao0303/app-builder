/**
 * Platform type for keyboard shortcuts
 */
export type Platform = 'macos' | 'windows' | 'linux';

/**
 * Keyboard shortcut configuration
 * Supports cross-platform shortcuts with automatic mapping
 */
export interface KeyboardShortcut {
  /** Primary key combination (e.g., 'ctrl+z', 'ctrl+shift+z') */
  key: string;
  /** Optional: Override for macOS (if not provided, 'ctrl' will be auto-mapped to 'cmd') */
  macKey?: string;
  /** Optional: Override for Windows/Linux */
  winKey?: string;
}

/**
 * Command configuration
 */
export interface CommandConfig<T = any> {
  /** Unique command identifier */
  id: string;
  /** Human-readable command name */
  name: string;
  /** Command description */
  description?: string;
  /** Keyboard shortcut(s) for this command */
  shortcuts?: KeyboardShortcut | KeyboardShortcut[];
  /** Command handler function */
  handler: CommandHandler<T>;
  /** Optional: Command category for grouping */
  category?: string;
  /** Optional: Whether command is enabled */
  enabled?: boolean;
}

/**
 * Command handler function type
 * @param data - Optional data payload passed to the command
 */
export type CommandHandler<T = any> = (data?: T) => void | Promise<void>;

/**
 * Registered command with resolved shortcuts
 */
export interface RegisteredCommand<T = any> {
  id: string;
  name: string;
  description?: string;
  handler: CommandHandler<T>;
  category?: string;
  enabled: boolean;
  /** Resolved shortcuts for current platform */
  shortcuts: string[];
  /** Original shortcut configurations */
  originalShortcuts: KeyboardShortcut[];
}

/**
 * Command execution context
 */
export interface CommandExecutionContext<T = any> {
  commandId: string;
  data?: T;
  timestamp: number;
  triggeredBy?: 'keyboard' | 'api' | 'ui';
}
