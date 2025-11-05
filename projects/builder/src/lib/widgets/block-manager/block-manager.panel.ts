import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlockModel, BlockDefinition } from './model/block.model';

/**
 * Block Manager Panel Component
 * UI để hiển thị và kéo block templates vào canvas
 */
@Component({
  selector: 'app-block-manager-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="block-manager-panel">
      <h3>Blocks</h3>
      <div class="categories">
        @for (category of categories; track category) {
          <div class="category">
            <h4>{{ category }}</h4>
            <div class="blocks">
              @for (block of getBlocksByCategory(category); track block.getId()) {
                <div 
                  class="block-item"
                  draggable="true"
                  (dragstart)="onDragStart($event, block)"
                >
                  @if (block.getMedia()) {
                    <img [src]="block.getMedia()" [alt]="block.getLabel()" />
                  }
                  <span>{{ block.getLabel() }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .block-manager-panel {
      padding: 10px;
      max-height: 500px;
      overflow-y: auto;
    }
    .category {
      margin-bottom: 15px;
    }
    .category h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: bold;
    }
    .blocks {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 8px;
    }
    .block-item {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: move;
      text-align: center;
      background: white;
    }
    .block-item:hover {
      background: #f5f5f5;
    }
    .block-item img {
      width: 100%;
      height: auto;
      margin-bottom: 4px;
    }
    .block-item span {
      display: block;
      font-size: 12px;
    }
  `],
})
export class BlockManagerPanelComponent {
  @Input() blocks: BlockModel[] = [];
  @Output() blockDragStart = new EventEmitter<{ event: DragEvent; block: BlockModel }>();

  get categories(): string[] {
    const cats = this.blocks.map(b => b.getCategory()).filter(Boolean);
    return [...new Set(cats)];
  }

  getBlocksByCategory(category: string): BlockModel[] {
    return this.blocks.filter(b => b.getCategory() === category);
  }

  onDragStart(event: DragEvent, block: BlockModel): void {
    event.dataTransfer?.setData('application/json', JSON.stringify(block.toJSON()));
    event.dataTransfer?.setData('text/plain', block.getId());
    this.blockDragStart.emit({ event, block });
  }
}

