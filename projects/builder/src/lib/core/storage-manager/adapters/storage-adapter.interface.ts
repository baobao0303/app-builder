/**
 * Storage Adapter Interface
 */
export interface StorageAdapter {
  store(data: any): Promise<void> | void;
  load(): Promise<any> | any;
  remove(): Promise<void> | void;
}

export interface ProjectData {
  pages?: any[];
  styles?: any[];
  [key: string]: any;
}

export interface StorageOptions {
  [key: string]: any;
}

