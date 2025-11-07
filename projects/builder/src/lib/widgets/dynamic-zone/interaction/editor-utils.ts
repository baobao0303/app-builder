import { TraitManagerService } from '../../../core/trait-manager/trait-manager.service';

export function applyInlineEditDirective(
  element: HTMLElement,
  applier: (el: HTMLElement) => void
): void {
  const textualElements = element.querySelectorAll(
    'h1, h2, h3, h4, h5, h6, p, span, .dz-heading, .dz-text'
  ) as NodeListOf<HTMLElement>;
  textualElements.forEach((el) => applier(el));
  const tag = element.tagName.toLowerCase();
  const isTextual = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'].includes(tag);
  if (isTextual) applier(element);
}

export function getElementLabel(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();
  const innerTextual = element.querySelector('h1, h2, h3, h4, h5, h6, p');
  if (innerTextual) {
    const innerTag = innerTextual.tagName.toLowerCase();
    if (innerTag.startsWith('h')) return `H${innerTag.charAt(1)} Heading`;
    if (innerTag === 'p') return 'P Paragraph';
  }
  if (tag.startsWith('h')) return `H${tag.charAt(1)} Heading`;
  if (element.classList.contains('dz-row')) return 'Row';
  if (element.classList.contains('dz-column')) return 'Column';
  if (element.classList.contains('dz-section')) return 'Section';
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

export function isTextOrHeadingElement(element: HTMLElement): boolean {
  const tag = element.tagName.toLowerCase();
  if (tag.startsWith('h') && tag.length === 2 && /^[1-6]$/.test(tag.charAt(1))) return true;
  if (tag === 'p') return true;
  if (element.classList.contains('dz-heading') || element.classList.contains('dz-text'))
    return true;
  const innerTextual = element.querySelector('h1, h2, h3, h4, h5, h6, p, .dz-heading, .dz-text');
  return !!innerTextual;
}

export function logDOMPosition(
  element: HTMLElement,
  selectedId: string | undefined,
  getModel: (id: string) => any
): void {
  try {
    const parent = element.parentElement;
    let indexInParent = -1;
    if (parent) indexInParent = Array.from(parent.children).indexOf(element);
    const path: string[] = [];
    let current: HTMLElement | null = element;
    while (current) {
      const tag = current.tagName.toLowerCase();
      const id = current.id ? `#${current.id}` : '';
      const classes = current.className
        ? `.${current.className.split(/\s+/).filter(Boolean).join('.')}`
        : '';
      path.unshift(`${tag}${id}${classes}`);
      current = current.parentElement;
    }
    let modelInfo: any = null;
    if (selectedId) {
      const model = getModel(selectedId);
      if (model) {
        modelInfo = {
          id: model.getId?.(),
          tagName: model.getTagName?.(),
          parent: model.getParent?.()?.getId?.() || 'root',
          children: model.getComponents?.().map((c: any) => c.getId?.()) || [],
        };
      }
    }
    const rect = element.getBoundingClientRect();
    const positionInfo = {
      Element: element.tagName.toLowerCase(),
      ID: element.id || '(none)',
      Classes: element.className || '(none)',
      'Index in parent': indexInParent >= 0 ? indexInParent : '(none)',
      Parent: parent?.tagName.toLowerCase() || '(none)',
      'Path from root': path.join(' > '),
      Position: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      'Component Model': modelInfo || '(none)',
    };
    // eslint-disable-next-line no-console
    console.table(positionInfo);
    console.log('Full Element:', element);
    console.log('Full Bounding Rect:', rect);
    if (modelInfo) console.log('Component Model Details:', modelInfo);
    console.groupEnd();
  } catch (error) {
    console.error('[DOM Position] Error logging position:', error);
  }
}
