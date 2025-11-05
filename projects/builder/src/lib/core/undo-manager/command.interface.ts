/**
 * Command/Action Interface cho Undo Manager
 */
export interface Command {
  execute(): void;
  undo(): void;
  label?: string;
}

export interface UndoStackEntry {
  commands: Command[];
  label?: string;
}

