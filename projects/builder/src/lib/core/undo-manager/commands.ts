import { Command } from './command.interface';
import { ComponentModelService } from '../dom-components/component-model.service';
import { ComponentDefinition } from '../dom-components/model/component.model';
import { UndoManagerService } from './undo-manager.service';

/**
 * Command for moving a component up/down in the list
 */
export class MoveCommand implements Command {
  label = 'Move Component';

  constructor(
    private componentModelService: ComponentModelService,
    private parentId: string,
    private fromIndex: number,
    private toIndex: number
  ) {}

  execute(): void {
    this.componentModelService.reorderChild(this.parentId, this.fromIndex, this.toIndex);
  }

  undo(): void {
    this.componentModelService.reorderChild(this.parentId, this.toIndex, this.fromIndex);
  }
}

/**
 * Command for duplicating a component
 */
export class DuplicateCommand implements Command {
  label = 'Duplicate Component';
  private createdComponentId?: string;

  constructor(
    private componentModelService: ComponentModelService,
    private sourceComponentId: string,
    private parentId: string,
    private insertIndex: number
  ) {}

  execute(): void {
    const sourceModel = this.componentModelService.getComponent(this.sourceComponentId);
    if (!sourceModel) return;

    const definition = sourceModel.toJSON();
    // Remove id to generate new one
    if (definition.attributes && definition.attributes['id']) {
      const attrs = { ...definition.attributes };
      delete attrs['id'];
      definition.attributes = attrs;
    }

    const cloned = this.componentModelService.createComponent(
      definition,
      this.parentId,
      this.insertIndex
    );
    this.createdComponentId = cloned.getId();
  }

  undo(): void {
    if (this.createdComponentId) {
      this.componentModelService.removeComponent(this.createdComponentId);
      this.createdComponentId = undefined;
    }
  }
}

/**
 * Command for deleting a component
 */
export class DeleteCommand implements Command {
  label = 'Delete Component';
  private deletedDefinition?: ComponentDefinition;
  private deletedIndex?: number;

  constructor(
    private componentModelService: ComponentModelService,
    private componentId: string,
    private parentId?: string
  ) {}

  execute(): void {
    const component = this.componentModelService.getComponent(this.componentId);
    if (!component) return;

    // Save state for undo
    this.deletedDefinition = component.toJSON();
    const parent = component.getParent();
    if (parent) {
      const siblings = parent.getComponents();
      this.deletedIndex = siblings.findIndex((c) => c.getId() === this.componentId);
    }

    this.componentModelService.removeComponent(this.componentId);
  }

  undo(): void {
    if (!this.deletedDefinition) return;

    const parentId = this.parentId || this.componentModelService.getRootComponent()?.getId();
    if (!parentId) return;

    const restored = this.componentModelService.createComponent(
      this.deletedDefinition,
      parentId,
      this.deletedIndex
    );

    // Restore the original ID
    const originalId = this.deletedDefinition.attributes?.['id'];
    if (originalId) {
      this.componentModelService.updateComponentId(restored.getId(), originalId);
    }
  }
}

/**
 * Command for editing text content
 */
export class EditTextCommand implements Command {
  label = 'Edit Text';

  constructor(
    private componentModelService: ComponentModelService,
    private componentId: string,
    private oldContent: string,
    private newContent: string,
    private element?: HTMLElement
  ) {}

  execute(): void {
    const component = this.componentModelService.getComponent(this.componentId);
    if (component) {
      component.setContent(this.newContent);
    }
    if (this.element) {
      this.element.textContent = this.newContent;
    }
  }

  undo(): void {
    const component = this.componentModelService.getComponent(this.componentId);
    if (component) {
      component.setContent(this.oldContent);
    }
    if (this.element) {
      this.element.textContent = this.oldContent;
    }
  }
}

/**
 * Command for adding a new component
 */
export class AddComponentCommand implements Command {
  label = 'Add Component';
  private createdComponentId?: string;

  constructor(
    private componentModelService: ComponentModelService,
    private definition: ComponentDefinition,
    private parentId: string,
    private insertIndex?: number
  ) {}

  execute(): void {
    const created = this.componentModelService.createComponent(
      this.definition,
      this.parentId,
      this.insertIndex
    );
    this.createdComponentId = created.getId();
  }

  undo(): void {
    if (this.createdComponentId) {
      this.componentModelService.removeComponent(this.createdComponentId);
      this.createdComponentId = undefined;
    }
  }
}

/**
 * Command for updating component attributes
 */
export class UpdateAttributesCommand implements Command {
  label = 'Update Attributes';

  constructor(
    private componentModelService: ComponentModelService,
    private componentId: string,
    private oldAttributes: Record<string, any>,
    private newAttributes: Record<string, any>
  ) {}

  execute(): void {
    const component = this.componentModelService.getComponent(this.componentId);
    if (component) {
      component.setAttributes(this.newAttributes);
    }
  }

  undo(): void {
    const component = this.componentModelService.getComponent(this.componentId);
    if (component) {
      component.setAttributes(this.oldAttributes);
    }
  }
}

/**
 * Command for updating component styles
 */
export class UpdateStyleCommand implements Command {
  label = 'Update Style';

  constructor(
    private componentModelService: ComponentModelService,
    private componentId: string,
    private oldStyle: Record<string, any>,
    private newStyle: Record<string, any>,
    private element?: HTMLElement
  ) {}

  execute(): void {
    const component = this.componentModelService.getComponent(this.componentId);
    if (component) {
      component.setStyle(this.newStyle);
    }
    if (this.element) {
      Object.entries(this.newStyle).forEach(([prop, value]) => {
        (this.element!.style as any)[prop] = value;
      });
    }
  }

  undo(): void {
    const component = this.componentModelService.getComponent(this.componentId);
    if (component) {
      component.setStyle(this.oldStyle);
    }
    if (this.element) {
      Object.entries(this.oldStyle).forEach(([prop, value]) => {
        (this.element!.style as any)[prop] = value;
      });
    }
  }
}

/**
 * Command for cross-container move (moving between different containers)
 */
export class CrossContainerMoveCommand implements Command {
  label = 'Move Between Containers';
  private originalParentId: string;
  private originalIndex: number;

  constructor(
    private componentModelService: ComponentModelService,
    private componentId: string,
    private targetParentId: string,
    private targetIndex: number
  ) {
    const component = this.componentModelService.getComponent(componentId);
    const parent = component?.getParent();
    this.originalParentId = parent?.getId() || '';
    const siblings = parent?.getComponents() || [];
    this.originalIndex = siblings.findIndex((c) => c.getId() === componentId);
  }

  execute(): void {
    const component = this.componentModelService.getComponent(this.componentId);
    if (!component) return;

    const definition = component.toJSON();
    this.componentModelService.removeComponent(this.componentId);

    const restored = this.componentModelService.createComponent(
      definition,
      this.targetParentId,
      this.targetIndex
    );

    // Restore original ID
    const originalId = definition.attributes?.['id'];
    if (originalId) {
      this.componentModelService.updateComponentId(restored.getId(), originalId);
    }
  }

  undo(): void {
    const component = this.componentModelService.getComponent(this.componentId);
    if (!component) return;

    const definition = component.toJSON();
    this.componentModelService.removeComponent(this.componentId);

    const restored = this.componentModelService.createComponent(
      definition,
      this.originalParentId,
      this.originalIndex
    );

    // Restore original ID
    const originalId = definition.attributes?.['id'];
    if (originalId) {
      this.componentModelService.updateComponentId(restored.getId(), originalId);
    }
  }
}

/** Cohesive helpers for global undo/redo used by command handlers */
export function performUndo(undoManager: UndoManagerService): boolean {
  return undoManager.undo();
}

export function performRedo(undoManager: UndoManagerService): boolean {
  return undoManager.redo();
}

