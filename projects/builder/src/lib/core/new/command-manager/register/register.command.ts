import { CommandManagerService } from '../command-manager.service';
import { UndoManagerService } from '../../../undo-manager/undo-manager.service';

export interface CoreCommandServices {
  undoManager: UndoManagerService;
}

/**
 * Register core editor commands (undo/redo) with cross-platform shortcuts.
 */
export function registerCoreCommands(
  commandManager: CommandManagerService,
  services: CoreCommandServices
): void {
  const { undoManager } = services;

  commandManager.register({
    id: 'editor.undo',
    name: 'Undo',
    shortcuts: { key: 'ctrl+z' },
    handler: async () => {
      undoManager.undo();
    },
    category: 'Edit',
  });

  commandManager.register({
    id: 'editor.redo',
    name: 'Redo',
    // Support both common redo shortcuts; platform mapper will normalize
    shortcuts: [{ key: 'ctrl+shift+z' }, { key: 'ctrl+y' }],
    handler: async () => {
      undoManager.redo();
    },
    category: 'Edit',
  });
}

