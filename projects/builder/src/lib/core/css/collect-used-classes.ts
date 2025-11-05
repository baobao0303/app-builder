export function collectUsedClasses(html: string): Set<string> {
  const used = new Set<string>();
  // match class="..." or class='...'
  const classAttr = /class\s*=\s*(["'])(.*?)\1/gi;
  let m: RegExpExecArray | null;
  while ((m = classAttr.exec(html)) !== null) {
    const value = m[2] || '';
    value
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((c) => used.add(c));
  }
  return used;
}


