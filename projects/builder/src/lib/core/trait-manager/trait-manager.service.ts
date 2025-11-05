import { Injectable } from '@angular/core';
import { TraitModel, TraitDefinition } from './model/trait.model';

/**
 * Trait Manager Service - Angular version
 */
@Injectable({
  providedIn: 'root',
})
export class TraitManagerService {
  private traits: TraitModel[] = [];
  private selectedTarget: any = null;

  /**
   * Add trait
   */
  addTrait(trait: TraitDefinition): TraitModel {
    const traitModel = new TraitModel(trait);
    this.traits.push(traitModel);
    return traitModel;
  }

  /**
   * Get trait by id
   */
  getTrait(id: string): TraitModel | null {
    return this.traits.find(t => t.getId() === id) || null;
  }

  /**
   * Get all traits
   */
  getTraits(): TraitModel[] {
    return [...this.traits];
  }

  /**
   * Update trait
   */
  updateTrait(id: string, props: Partial<TraitDefinition>): boolean {
    const trait = this.getTrait(id);
    if (!trait) return false;

    if (props.value !== undefined) trait.setValue(props.value);
    // TODO: Update other properties

    return true;
  }

  /**
   * Remove trait
   */
  removeTrait(id: string): boolean {
    const index = this.traits.findIndex(t => t.getId() === id);
    if (index >= 0) {
      this.traits.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Set selected target (component để edit traits)
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
   * Update attribute on selected target
   */
  updateAttribute(name: string, value: any): void {
    if (!this.selectedTarget) return;
    // TODO: Apply attribute to selected target
    // Có thể tích hợp với ComponentModel sau
  }

  /**
   * Clear all
   */
  clear(): void {
    this.traits = [];
    this.selectedTarget = null;
  }
}

