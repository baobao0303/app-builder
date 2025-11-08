import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'builder-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent {
  @Output() toggleLeftSidebar = new EventEmitter<void>();
  @Output() toggleRightSidebar = new EventEmitter<void>();
  @Output() toggleDragMode = new EventEmitter<void>();
  @Output() toggleFullscreen = new EventEmitter<void>();
  @Output() toggleNavigator = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();
  @Output() deviceChange = new EventEmitter<'mobile' | 'tablet' | 'desktop'>();

  // View mode state
  activeViewMode = signal<'grid' | 'split-vertical' | 'split-horizontal'>('grid');
  activeTool = signal<'hand' | 'layers'>('layers');
  activeDevice = signal<'mobile' | 'tablet' | 'desktop'>('desktop');
  zoomLevel = signal(100);

  onToggleLeftSidebar(): void {
    this.toggleLeftSidebar.emit();
  }

  onToggleRightSidebar(): void {
    this.toggleRightSidebar.emit();
  }

  // View Mode Actions
  onViewMode(mode: 'grid' | 'split-vertical' | 'split-horizontal'): void {
    this.activeViewMode.set(mode);
    console.log('View mode:', mode);
  }

  // Undo/Redo Actions
  onUndo(): void {
    console.log('Undo action');
  }

  onRedo(): void {
    console.log('Redo action');
  }

  // Tool Actions
  onHandTool(): void {
    const currentTool = this.activeTool();
    if (currentTool === 'hand') {
      this.activeTool.set('layers'); // Toggle back to layers
    } else {
      this.activeTool.set('hand'); // Enable hand tool (disable dragging)
    }
    this.toggleDragMode.emit();
    console.log(
      'Hand/Pan tool toggled, dragging:',
      currentTool === 'hand' ? 'enabled' : 'disabled'
    );
  }

  onLayersTool(): void {
    this.activeTool.set('layers');
    console.log('Layers tool activated');
  }

  onToggleNavigator(): void {
    this.toggleNavigator.emit();
    console.log('Navigator toggled');
  }

  // Preview Actions
  onPreview(): void {
    console.log('Preview mode toggled');
  }

  onFullscreen(): void {
    this.toggleFullscreen.emit();
    console.log('Fullscreen toggled');
  }

  // Export Actions
  onDownload(): void {
    this.download.emit();
  }

  // Theme Actions
  onThemeToggle(): void {
    console.log('Theme toggle');
  }

  onExternalLink(): void {
    console.log('Open in new window');
  }

  // Responsive Actions
  onDeviceChange(device: 'mobile' | 'tablet' | 'desktop'): void {
    this.activeDevice.set(device);
    this.deviceChange.emit(device);
    console.log('Device view:', device);
  }

  // Device viewport sizes
  readonly deviceSizes = {
    mobile: { width: 375, height: 667, name: 'Mobile' },
    tablet: { width: 768, height: 1024, name: 'Tablet' },
    desktop: { width: 1920, height: 1080, name: 'Desktop' },
  };

  // Zoom Actions
  onZoomChange(level: number): void {
    this.zoomLevel.set(level);
    console.log('Zoom level:', level + '%');
  }

  // Save Action
  onSave(): void {
    console.log('Save page action');
  }
}
