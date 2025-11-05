import { Injectable } from '@angular/core';

/**
 * Sorter Service
 * Sắp xếp/reorder components
 */
@Injectable({
  providedIn: 'root',
})
export class SorterService {
  /**
   * Move item trong array
   */
  move<T>(array: T[], from: number, to: number): T[] {
    const result = [...array];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }

  /**
   * Swap two items
   */
  swap<T>(array: T[], index1: number, index2: number): T[] {
    const result = [...array];
    [result[index1], result[index2]] = [result[index2], result[index1]];
    return result;
  }

  /**
   * Sort by property
   */
  sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
    const result = [...array];
    return result.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
}

