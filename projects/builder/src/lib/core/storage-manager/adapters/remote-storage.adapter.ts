import { StorageAdapter, ProjectData } from './storage-adapter.interface';

/**
 * Remote Storage Adapter
 * Lưu/load từ remote API
 */
export class RemoteStorageAdapter implements StorageAdapter {
  private baseUrl: string;
  private projectId?: string;

  constructor(baseUrl: string, projectId?: string) {
    this.baseUrl = baseUrl;
    this.projectId = projectId;
  }

  async store(data: ProjectData): Promise<void> {
    try {
      const url = this.projectId 
        ? `${this.baseUrl}/projects/${this.projectId}`
        : `${this.baseUrl}/projects`;
      
      const response = await fetch(url, {
        method: this.projectId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Storage failed: ${response.statusText}`);
      }

      if (!this.projectId) {
        const result = await response.json();
        this.projectId = result.id;
      }
    } catch (error) {
      console.error('Failed to store to remote:', error);
      throw error;
    }
  }

  async load(): Promise<ProjectData | null> {
    if (!this.projectId) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/projects/${this.projectId}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to load from remote:', error);
      return null;
    }
  }

  async remove(): Promise<void> {
    if (!this.projectId) {
      return;
    }

    try {
      await fetch(`${this.baseUrl}/projects/${this.projectId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to remove from remote:', error);
    }
  }
}

