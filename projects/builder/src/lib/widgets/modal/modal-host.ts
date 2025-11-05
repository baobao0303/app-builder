import { Component, computed, inject, ViewChild, ViewContainerRef, ComponentRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../core/modal-dialog/modal.service';

@Component({
  selector: 'builder-modal-host',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-host.html',
  styleUrl: './modal-host.scss',
})
export class ModalHostComponent implements OnDestroy {
  private modal = inject(ModalService);

  @ViewChild('modalBody', { read: ViewContainerRef }) modalBody!: ViewContainerRef;
  private componentRef?: ComponentRef<any>;

  protected state$ = this.modal.state$;

  constructor() {
    this.modal.state$.subscribe((state) => {
      if (state.open && state.contentComponent) {
        setTimeout(() => this.loadComponent(state.contentComponent!), 0);
      } else if (!state.open) {
        this.clearComponent();
      }
    });
  }

  private loadComponent(component: any): void {
    this.clearComponent();
    if (this.modalBody && component) {
      this.componentRef = this.modalBody.createComponent(component);
    }
  }

  private clearComponent(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = undefined;
    }
    if (this.modalBody) {
      this.modalBody.clear();
    }
  }

  protected close(): void {
    this.modal.close();
  }

  ngOnDestroy(): void {
    this.clearComponent();
  }
}
