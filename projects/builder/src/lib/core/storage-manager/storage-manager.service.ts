import { Injectable } from '@angular/core';
import { StorageAdapter, ProjectData } from './adapters/storage-adapter.interface';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';
import { RemoteStorageAdapter } from './adapters/remote-storage.adapter';

/**
 * Storage Manager Service - Angular version
 */
@Injectable({
  providedIn: 'root',
})
export class StorageManagerService {
  private storages: Map<string, StorageAdapter> = new Map();
  private currentStorage: StorageAdapter | null = null;
  private autosave: boolean = false;
  private stepsBeforeSave: number = 1;
  private stepCounter: number = 0;

  constructor() {
    // Mặc định thêm LocalStorage adapter
    this.add('local', new LocalStorageAdapter());
    this.setCurrent('local');
  }

  /**
   * Add storage adapter
   */
  add(name: string, adapter: StorageAdapter): void {
    this.storages.set(name, adapter);
  }

  /**
   * Get storage adapter
   */
  get(name: string): StorageAdapter | null {
    return this.storages.get(name) || null;
  }

  /**
   * Set current storage
   */
  setCurrent(name: string): void {
    const adapter = this.get(name);
    if (adapter) {
      this.currentStorage = adapter;
    }
  }

  /**
   * Get current storage
   */
  getCurrent(): StorageAdapter | null {
    return this.currentStorage;
  }

  /**
   * Set autosave
   */
  setAutosave(value: boolean): void {
    this.autosave = value;
  }

  /**
   * Check if autosave is enabled
   */
  isAutosave(): boolean {
    return this.autosave;
  }

  /**
   * Set steps before save
   */
  setStepsBeforeSave(steps: number): void {
    this.stepsBeforeSave = steps;
  }

  /**
   * Get steps before save
   */
  getStepsBeforeSave(): number {
    return this.stepsBeforeSave;
  }

  /**
   * Store project data
   */
  async store(data: ProjectData): Promise<void> {
    if (!this.currentStorage) {
      throw new Error('No storage adapter selected');
    }

    try {
      await this.currentStorage.store(data);
      this.stepCounter = 0;
    } catch (error) {
      console.error('Storage failed:', error);
      throw error;
    }
  }

  /**
   * Load project data
   */
  async load(): Promise<ProjectData | null> {
    if (!this.currentStorage) {
      return null;
    }

    try {
      return await this.currentStorage.load();
    } catch (error) {
      console.error('Load failed:', error);
      return null;
    }
  }

  /**
   * Remove project data
   */
  async remove(): Promise<void> {
    if (!this.currentStorage) {
      return;
    }

    try {
      await this.currentStorage.remove();
    } catch (error) {
      console.error('Remove failed:', error);
    }
  }

  /**
   * Increment step counter (for autosave)
   */
  incrementStep(): void {
    this.stepCounter++;
    if (this.autosave && this.stepCounter >= this.stepsBeforeSave) {
      // TODO: Trigger autosave
      this.stepCounter = 0;
    }
  }
}

