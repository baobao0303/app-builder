import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AssetType = 'image' | 'video' | 'audio' | 'file';

export interface AssetItem {
  id: string;
  type: AssetType;
  src: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  name?: string;
  meta?: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class AssetManagerService {
  private assetsSubject = new BehaviorSubject<AssetItem[]>([]);
  readonly assets$ = this.assetsSubject.asObservable();

  getAssets(): AssetItem[] {
    return this.assetsSubject.getValue();
  }

  add(asset: AssetItem): void {
    const list = this.getAssets();
    const existingIndex = list.findIndex(a => a.id === asset.id);
    if (existingIndex >= 0) {
      const updated = [...list];
      updated[existingIndex] = { ...updated[existingIndex], ...asset };
      this.assetsSubject.next(updated);
      return;
    }
    this.assetsSubject.next([...list, asset]);
  }

  addMany(assets: AssetItem[]): void {
    const byId = new Map(this.getAssets().map(a => [a.id, a] as const));
    for (const a of assets) byId.set(a.id, a);
    this.assetsSubject.next(Array.from(byId.values()));
  }

  update(id: string, partial: Partial<AssetItem>): void {
    const list = this.getAssets().map(a => (a.id === id ? { ...a, ...partial } : a));
    this.assetsSubject.next(list);
  }

  remove(id: string): void {
    this.assetsSubject.next(this.getAssets().filter(a => a.id !== id));
  }

  clear(): void {
    this.assetsSubject.next([]);
  }
}


