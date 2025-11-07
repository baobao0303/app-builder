import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Command, UndoAddOptions, UndoStackEntry, UndoStackState } from './command.interface';

// Re-export command utilities for convenience
export * from './commands';

/**
 * Undo Manager Service - Angular version
 */
@Injectable({
  providedIn: 'root',
})
export class UndoManagerService {
  private undoStack: UndoStackEntry[] = [];
  private redoStack: UndoStackEntry[] = [];
  private maxStackLength = 50;
  private isExecuting = false;
  private currentGroup: { commands: Command[]; options?: UndoAddOptions } | null = null;
  private entryCounter = 0;

  private stateSubject = new BehaviorSubject<UndoStackState>(this.buildState());
  private canUndoSubject = new BehaviorSubject<boolean>(false);
  private canRedoSubject = new BehaviorSubject<boolean>(false);
  private eventSubject = new Subject<UndoManagerEvent>();
  private undoSubject = new Subject<UndoStackEntry>();
  private redoSubject = new Subject<UndoStackEntry>();

  /**
   * Set max stack length
   */
  setMaxStackLength(length: number): void {
    if (!Number.isFinite(length) || length <= 0) {
      console.warn('UndoManager: maxStackLength must be a positive number');
      return;
    }
    this.maxStackLength = Math.floor(length);
    this.trimStacks();
  }

  /**
   * Add command to undo stack
   */
  add(command: Command | Command[], options: UndoAddOptions = {}): void {
    if (this.isExecuting) return;

    const commands = Array.isArray(command) ? command : [command];
    if (commands.length === 0) return;

    if (this.currentGroup) {
      this.currentGroup.commands.push(...commands);
      const currentOptions = this.currentGroup.options || {};
      this.currentGroup.options = {
        label: options.label ?? currentOptions.label,
        meta: {
          ...(currentOptions.meta || {}),
          ...(options.meta || {}),
        },
      };
      return;
    }

    this.pushEntry(commands, options);
  }

  execute(command: Command | Command[], options: UndoAddOptions = {}): void {
    const commands = Array.isArray(command) ? command : [command];
    if (commands.length === 0) return;

    commands.forEach((cmd) => {
      try {
        cmd.execute();
      } catch (error) {
        console.error('UndoManager execute failed:', error);
      }
    });

    this.add(commands, options);
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    if (this.undoStack.length === 0) return false;

    const entry = this.undoStack.pop()!;

    this.isExecuting = true;
    try {
      for (let i = entry.commands.length - 1; i >= 0; i--) {
        const cmd = entry.commands[i];
        try {
          cmd.undo();
        } catch (error) {
          console.error('Undo failed:', error);
        }
      }
    } finally {
      this.isExecuting = false;
    }

    this.redoStack.push(entry);
    this.trimRedoStack();
    this.notifyState('undo', entry);
    this.undoSubject.next(entry);

    return true;
  }

  /**
   * Redo last undone action
   */
  redo(): boolean {
    if (this.redoStack.length === 0) return false;

    const entry = this.redoStack.pop()!;

    this.isExecuting = true;
    try {
      entry.commands.forEach((cmd) => {
        try {
          cmd.execute();
        } catch (error) {
          console.error('Redo failed:', error);
        }
      });
    } finally {
      this.isExecuting = false;
    }

    this.undoStack.push(entry);
    this.trimUndoStack();
    this.notifyState('redo', entry);
    this.redoSubject.next(entry);

    return true;
  }

  /**
   * Check if can undo
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Check if can redo
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Get undo stack
   */
  getUndoStack(): UndoStackEntry[] {
    return [...this.undoStack];
  }

  /**
   * Get redo stack
   */
  getRedoStack(): UndoStackEntry[] {
    return [...this.redoStack];
  }

  /**
   * Clear all stacks
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.currentGroup = null;
    this.notifyState('clear');
  }

  /**
   * Clear redo stack only
   */
  clearRedo(): void {
    this.redoStack = [];
    this.notifyState();
  }

  /**
   * Observable stream for canUndo state
   */
  get canUndo$(): Observable<boolean> {
    return this.canUndoSubject.asObservable();
  }

  /**
   * Observable stream for canRedo state
   */
  get canRedo$(): Observable<boolean> {
    return this.canRedoSubject.asObservable();
  }

  /**
   * Observable stream for undo manager events
   */
  get state$(): Observable<UndoStackState> {
    return this.stateSubject.asObservable();
  }

  get events$(): Observable<UndoManagerEvent> {
    return this.eventSubject.asObservable();
  }

  get undo$(): Observable<UndoStackEntry> {
    return this.undoSubject.asObservable();
  }

  get redo$(): Observable<UndoStackEntry> {
    return this.redoSubject.asObservable();
  }

  /**
   * Execute callback within grouped undo entry
   */
  beginGroup(options: UndoAddOptions = {}): void {
    if (this.currentGroup) {
      console.warn('UndoManager: group already in progress. Nested groups are not supported.');
      return;
    }
    this.currentGroup = { commands: [], options };
  }

  commitGroup(options: UndoAddOptions = {}): void {
    if (!this.currentGroup) {
      return;
    }

    const { commands, options: groupOptions } = this.currentGroup;
    this.currentGroup = null;

    if (commands.length === 0) {
      return;
    }

    const mergedOptions: UndoAddOptions = {
      label: options.label ?? groupOptions?.label,
      meta: {
        ...(groupOptions?.meta || {}),
        ...(options.meta || {}),
      },
    };

    const entry = this.pushEntry(commands, mergedOptions);
    this.eventSubject.next({ type: 'group', entry });
  }

  discardGroup(): void {
    this.currentGroup = null;
  }

  runInGroup(handler: () => void, options: UndoAddOptions = {}): void {
    this.beginGroup(options);
    try {
      handler();
      this.commitGroup();
    } catch (error) {
      this.discardGroup();
      throw error;
    }
  }

  getState(): UndoStackState {
    return this.stateSubject.getValue();
  }

  private pushEntry(commands: Command[], options: UndoAddOptions = {}): UndoStackEntry {
    const mergedCommandMeta = commands.reduce<Record<string, any>>((acc, cmd) => {
      if (cmd.meta) {
        Object.assign(acc, cmd.meta);
      }
      return acc;
    }, {});

    const entry: UndoStackEntry = {
      id: `entry-${++this.entryCounter}`,
      commands: [...commands],
      label: options.label ?? commands.find((cmd) => cmd.label)?.label,
      meta: {
        ...mergedCommandMeta,
        ...(options.meta || {}),
      },
      timestamp: Date.now(),
    };

    this.undoStack.push(entry);
    this.trimUndoStack();
    this.redoStack = [];
    this.notifyState('add', entry);
    return entry;
  }

  private trimUndoStack(): void {
    if (this.undoStack.length > this.maxStackLength) {
      this.undoStack = this.undoStack.slice(-this.maxStackLength);
    }
  }

  private trimRedoStack(): void {
    if (this.redoStack.length > this.maxStackLength) {
      this.redoStack = this.redoStack.slice(-this.maxStackLength);
    }
  }

  private trimStacks(): void {
    this.trimUndoStack();
    this.trimRedoStack();
    this.notifyState();
  }

  private buildState(): UndoStackState {
    const nextUndo = this.undoStack[this.undoStack.length - 1]?.label;
    const nextRedo = this.redoStack[this.redoStack.length - 1]?.label;
    return {
      undoDepth: this.undoStack.length,
      redoDepth: this.redoStack.length,
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
      nextUndoLabel: nextUndo,
      nextRedoLabel: nextRedo,
    };
  }

  private notifyState(eventType?: UndoManagerEventType, entry?: UndoStackEntry): void {
    const state = this.buildState();
    this.stateSubject.next(state);

    const canUndo = state.canUndo;
    if (this.canUndoSubject.value !== canUndo) {
      this.canUndoSubject.next(canUndo);
    }

    const canRedo = state.canRedo;
    if (this.canRedoSubject.value !== canRedo) {
      this.canRedoSubject.next(canRedo);
    }

    if (eventType) {
      this.eventSubject.next({ type: eventType, entry });
    }
  }
}

export type UndoManagerEventType = 'add' | 'undo' | 'redo' | 'clear' | 'group';

export interface UndoManagerEvent {
  type: UndoManagerEventType;
  entry?: UndoStackEntry;
}
