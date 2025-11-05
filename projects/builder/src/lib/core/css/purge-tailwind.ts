import { rework } from './rework';
import { SelectorFilter } from './SelectorFilter';
import { getAllWordsInContent } from './extractWordsUtils';
import { CssTreeWalker } from './CssTreeWalker';

export function purgeTailwindCss(params: {
  tailwindCss: string;
  usedClasses: Set<string>;
  whitelist?: string[];
}): string {
  const { tailwindCss, usedClasses, whitelist = [] } = params;

  // Build content words map from used classes (treat classes as words)
  const baseWords = getAllWordsInContent('');
  for (const cls of usedClasses) {
    const lower = cls.toLowerCase();
    // record full token
    baseWords[lower] = true;
    // split by variant (:) and register each piece
    const byVariant = lower.split(':');
    byVariant.forEach((p) => {
      if (!p) return;
      baseWords[p] = true;
      // further split by non-letters to get utility stems (bg, blue, text, xl, rounded, etc.)
      p.split(/[^a-z]+/g)
        .filter(Boolean)
        .forEach((w) => (baseWords[w] = true));
    });
  }

  // Initialize walker with selector filter
  const filter = new SelectorFilter(baseWords, whitelist);
  const walker = new CssTreeWalker(tailwindCss, [filter]);
  walker.beginReading();
  return walker.toString();
}
