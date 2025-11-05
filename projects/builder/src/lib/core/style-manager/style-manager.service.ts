import { Injectable } from '@angular/core';
import { SectorModel, SectorProperties, PropertyModel, PropertyDefinition } from './model/sector.model';

/**
 * Style Manager Service - Angular version
 */
@Injectable({
  providedIn: 'root',
})
export class StyleManagerService {
  private sectors: SectorModel[] = [];
  private selectedTarget: any = null;

  /**
   * Add sector
   */
  addSector(id: string, sector: SectorProperties): SectorModel {
    const existing = this.getSector(id);
    if (existing) {
      return existing;
    }

    const sectorModel = new SectorModel({ ...sector, id });
    this.sectors.push(sectorModel);
    return sectorModel;
  }

  /**
   * Get sector by id
   */
  getSector(id: string): SectorModel | null {
    return this.sectors.find(s => s.getId() === id) || null;
  }

  /**
   * Get all sectors
   */
  getSectors(): SectorModel[] {
    return [...this.sectors];
  }

  /**
   * Remove sector
   */
  removeSector(id: string): boolean {
    const index = this.sectors.findIndex(s => s.getId() === id);
    if (index >= 0) {
      this.sectors.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Add property to sector
   */
  addProperty(sectorId: string, property: PropertyDefinition): PropertyModel | null {
    const sector = this.getSector(sectorId);
    if (!sector) return null;
    return sector.addProperty(property);
  }

  /**
   * Get property from sector
   */
  getProperty(sectorId: string, propertyId: string): PropertyModel | null {
    const sector = this.getSector(sectorId);
    if (!sector) return null;
    return sector.getProperties().find(p => p.getId() === propertyId) || null;
  }

  /**
   * Set selected target (component để edit style)
   */
  select(target: any): void {
    this.selectedTarget = target;
  }

  /**
   * Get selected target
   */
  getSelected(): any {
    return this.selectedTarget;
  }

  /**
   * Update style property
   */
  updateStyle(property: string, value: any): void {
    if (!this.selectedTarget) return;
    // TODO: Apply style to selected target
    // Có thể tích hợp với ComponentModel sau
  }

  /**
   * Clear all
   */
  clear(): void {
    this.sectors = [];
    this.selectedTarget = null;
  }
}

