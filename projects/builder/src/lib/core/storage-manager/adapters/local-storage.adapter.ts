import { StorageAdapter } from './storage-adapter.interface';

/**
 * Local Storage Adapter
 * Lưu/load từ localStorage
 */
export class LocalStorageAdapter implements StorageAdapter {
  private key: string;

  constructor(key: string = 'builder-project') {
    this.key = key;
  }

  store(data: any): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store to localStorage:', error);
    }
  }

  load(): any {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }

  remove(): void {
    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }
}

