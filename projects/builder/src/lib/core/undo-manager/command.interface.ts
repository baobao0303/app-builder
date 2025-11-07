/**
 * Command/Action Interface cho Undo Manager
 */
export interface Command {
  execute(): void;
  undo(): void;
  label?: string;
  description?: string;
  meta?: Record<string, any>;
}

export interface UndoStackEntry {
  id: string;
  commands: Command[];
  label?: string;
  timestamp: number;
  meta?: Record<string, any>;
}

export interface UndoAddOptions {
  label?: string;
  meta?: Record<string, any>;
}

export interface UndoStackState {
  undoDepth: number;
  redoDepth: number;
  canUndo: boolean;
  canRedo: boolean;
  nextUndoLabel?: string;
  nextRedoLabel?: string;
}
