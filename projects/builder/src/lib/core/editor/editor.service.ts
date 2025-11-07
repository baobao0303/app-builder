import { Injectable } from '@angular/core';
import { ComponentModelService } from '../dom-components/component-model.service';
import { HtmlGeneratorService } from '../code-generator/html-generator.service';
import { CssGeneratorService } from '../code-generator/css-generator.service';
import { JsGeneratorService } from '../code-generator/js-generator.service';
import { ComponentDefinition } from '../dom-components/model/component.model';
import { CommandManagerService } from '../new/command-manager/command-manager.service';
import { UndoManagerService } from '../undo-manager/undo-manager.service';
import { registerCoreCommands } from '../new/command-manager/register/register.command';

export interface EditorConfig {
  [key: string]: any;
}

/**
 * Editor Service - Core orchestrator
 */
@Injectable({
  providedIn: 'root',
})
export class EditorService {
  private initialized = false;

  constructor(
    private componentModelService: ComponentModelService,
    private htmlGenerator: HtmlGeneratorService,
    private cssGenerator: CssGeneratorService,
    private jsGenerator: JsGeneratorService,
    private commandManager: CommandManagerService,
    private undoManager: UndoManagerService
  ) {}

  /**
   * Khởi tạo editor
   */
  init(config: EditorConfig = {}): void {
    if (this.initialized) {
      console.warn('Editor already initialized');
      return;
    }

    // Register core commands once
    registerCoreCommands(this.commandManager, { undoManager: this.undoManager });

    // TODO: Khởi tạo các modules khác ở đây
    this.initialized = true;
  }

  /**
   * Get HTML
   */
  getHtml(opts: any = {}): string {
    return this.htmlGenerator.generateFromRoot(opts);
  }

  /**
   * Get CSS
   */
  getCss(opts: any = {}): string {
    const root = this.componentModelService.getRootComponent();
    if (!root) return '';
    return this.cssGenerator.build(root, opts);
  }

  /**
   * Get JS
   */
  getJs(opts: any = {}): string {
    const root = this.componentModelService.getRootComponent();
    if (!root) return '';
    return this.jsGenerator.build(root, opts);
  }

  /**
   * Get Component Model Service
   */
  getComponents(): ComponentModelService {
    return this.componentModelService;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
