import { Injectable, createComponent, EnvironmentInjector, ApplicationRef, ComponentRef } from '@angular/core';
import { AssetManagerModalComponent } from '../asset-manager/modal/asset-manager-modal.component';
import { Asset } from '../asset-manager/asset-manager.service';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modalRef?: ComponentRef<AssetManagerModalComponent>;

  constructor(
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef
  ) {}

  openAssetManager(): Promise<Asset> {
    return new Promise((resolve) => {
      // Prevent multiple modals
      if (this.modalRef) {
        return;
      }

      // Create component
      const modalComponent = createComponent(AssetManagerModalComponent, {
        environmentInjector: this.injector,
      });

      // Attach to application ref so it's part of the Angular component tree
      this.appRef.attachView(modalComponent.hostView);

      // Append the DOM element to the body
      const domElem = (modalComponent.hostView as any).rootNodes[0] as HTMLElement;
      document.body.appendChild(domElem);

      this.modalRef = modalComponent;

      // Handle selection and closing
      const selectionSub = this.modalRef.instance.selectAsset.subscribe((asset: Asset) => {
        resolve(asset);
        this.closeAssetManager();
      });

      const closeSub = this.modalRef.instance.closeModal.subscribe(() => {
        this.closeAssetManager();
      });

      // Cleanup subscriptions
      this.modalRef.onDestroy(() => {
        selectionSub.unsubscribe();
        closeSub.unsubscribe();
      });
    });
  }

  closeAssetManager(): void {
    if (this.modalRef) {
      this.appRef.detachView(this.modalRef.hostView);
      this.modalRef.destroy();
      this.modalRef = undefined;
    }
  }
}

