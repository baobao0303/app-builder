import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tool-box',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tool-box.html',
  styleUrl: './tool-box.scss',
})
export class ToolBox {
  @Output() addWidget = new EventEmitter<string>();

  activeTab: 'regular' | 'symbols' = 'regular';

  // Dropdown states
  openedDropdowns: { [key: string]: boolean } = {
    basic: false,
    forms: false,
    extra: false,
    layout: false,
  };

  // Danh sách widget Regular theo categories
  readonly regularCategories: {
    basic: Array<{ key: string; label: string }>;
    forms: Array<{ key: string; label: string }>;
    extra: Array<{ key: string; label: string }>;
    layout: Array<{ key: string; label: string }>;
  } = {
    basic: [
      { key: '1-columns', label: '1 columns' },
      // { key: '2-columns', label: '2 columns' },
      // { key: '3-columns', label: '3 columns' },
      // { key: '2-columns-3-7', label: '2 columns 3/7' },
      { key: 'image', label: 'Image' },
      { key: 'list', label: 'List' },
      { key: 'card', label: 'Card' },
    ],
    forms: [
      // Thêm form items ở đây
    ],
    extra: [{ key: 'navbar', label: 'Navbar' }],
    layout: [
      // Thêm layout items ở đây
    ],
  };

  toggleDropdown(category: string): void {
    this.openedDropdowns[category] = !this.openedDropdowns[category];
  }

  // Danh sách widget Symbols
  readonly symbolItems: Array<{ key: string; label: string }> = [
    // Thêm các symbol items ở đây
  ];

  addBanner(): void {
    this.addWidget.emit('banner');
  }

  // Gắn key vào dataTransfer khi bắt đầu kéo
  onDragStart(ev: DragEvent, key: string) {
    ev.dataTransfer?.setData('text/plain', key);
    ev.dataTransfer?.setDragImage?.(new Image(), 0, 0);
    if (ev.dataTransfer) {
      ev.dataTransfer.effectAllowed = 'copy';
    }
  }
}
