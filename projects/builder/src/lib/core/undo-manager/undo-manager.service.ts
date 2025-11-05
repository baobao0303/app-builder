import { Injectable } from '@angular/core';
import { Command, UndoStackEntry } from './command.interface';

/**
 * Undo Manager Service - Angular version
 */
@Injectable({
  providedIn: 'root',
})
export class UndoManagerService {
  private undoStack: UndoStackEntry[] = [];
  private redoStack: UndoStackEntry[] = [];
  private maxStackLength: number = 50;
  private isExecuting: boolean = false;

  /**
   * Set max stack length
   */
  setMaxStackLength(length: number): void {
    this.maxStackLength = length;
  }

  /**
   * Add command to undo stack
   */
  add(command: Command | Command[]): void {
    if (this.isExecuting) return;

    const commands = Array.isArray(command) ? command : [command];
    const entry: UndoStackEntry = {
      commands,
      label: commands[0]?.label,
    };

    this.undoStack.push(entry);
    
    // Giới hạn stack size
    if (this.undoStack.length > this.maxStackLength) {
      this.undoStack.shift();
    }

    // Clear redo stack khi có action mới
    this.redoStack = [];
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    if (this.undoStack.length === 0) return false;

    this.isExecuting = true;
    const entry = this.undoStack.pop()!;
    
    // Execute undo cho tất cả commands
    entry.commands.forEach(cmd => {
      try {
        cmd.undo();
      } catch (error) {
        console.error('Undo failed:', error);
      }
    });

    // Move to redo stack
    this.redoStack.push(entry);
    this.isExecuting = false;

    return true;
  }

  /**
   * Redo last undone action
   */
  redo(): boolean {
    if (this.redoStack.length === 0) return false;

    this.isExecuting = true;
    const entry = this.redoStack.pop()!;

    // Execute commands again
    entry.commands.forEach(cmd => {
      try {
        cmd.execute();
      } catch (error) {
        console.error('Redo failed:', error);
      }
    });

    // Move back to undo stack
    this.undoStack.push(entry);
    this.isExecuting = false;

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
  }

  /**
   * Clear redo stack only
   */
  clearRedo(): void {
    this.redoStack = [];
  }
}

