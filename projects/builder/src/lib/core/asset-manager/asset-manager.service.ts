import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Asset {
  id: string;
  type: 'image' | 'video';
  src: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class AssetManagerService {
  private assets = new BehaviorSubject<Asset[]>([]);

  assets$ = this.assets.asObservable();

  addAsset(asset: Omit<Asset, 'id'>): void {
    const newAsset: Asset = {
      ...asset,
      id: `asset-${Date.now()}`,
    };
    const currentAssets = this.assets.getValue();
    this.assets.next([...currentAssets, newAsset]);
  }

  removeAsset(id: string): void {
    const currentAssets = this.assets.getValue();
    this.assets.next(currentAssets.filter(asset => asset.id !== id));
  }

  getAssets(): Asset[] {
    return this.assets.getValue();
  }
}
