import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 bg-blue-50 rounded border border-blue-200">
      <h1 class="text-2xl font-bold text-blue-700">Tailwind A Component</h1>
      <p class="mt-2 text-sm text-blue-600">This is rendered with Tailwind utilities.</p>
      <button class="mt-3 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
        Action
      </button>
    </div>
  `,
})
export class CardComponent {}
