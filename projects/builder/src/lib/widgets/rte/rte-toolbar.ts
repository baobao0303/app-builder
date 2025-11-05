import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'builder-rte-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rte-toolbar.html',
  styleUrl: './rte-toolbar.scss',
})
export class RteToolbarComponent {
  protected exec(cmd: string) {
    document.execCommand(cmd, false);
  }
}


