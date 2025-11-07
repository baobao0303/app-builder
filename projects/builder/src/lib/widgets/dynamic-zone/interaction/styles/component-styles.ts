export const COMPONENT_STYLES: Record<string, string> = {
  '.column': `
      flex: 1;
      min-height: 60px;
      border: none;
      background: transparent;
      position: relative;
      width: 100%;
      box-sizing: border-box;
    `,
  '.column[style*="width"]': `
      flex: none;
    `,
  '.column-label': `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #64748b;
      font-size: 14px;
      font-weight: 500;
      pointer-events: none;
      z-index: 1;
    `,
  '.column-inner': `
      width: 100%;
      box-sizing: border-box;
    `,
  '.column-inner:not(:empty) ~ .column-label': `
      display: none;
    `,
  '.row': `
      display: flex;
      gap: 0;
      padding: 0;
      min-height: 60px;
      border: none;
      background: transparent;
      width: 100%;
      box-sizing: border-box;
    `,
  '.row-inner': `
      display: flex;
      gap: 0;
      width: 100%;
      min-height: 44px;
      flex: 1;
    `,
  '.image-wrapper': `
      position: relative;
      width: 100%;
      border: none;
      background: transparent;
      overflow: hidden;
    `,
  '.image': `
      width: 100%;
      height: auto;
      display: block;
    `,
};

export function getElementSelector(el: HTMLElement): string {
  const id = el.id;
  if (id) return `#${id}`;
  const classes = Array.from(el.classList).filter((c) => !c.startsWith('dz-'));
  if (classes.length > 0) return `.${classes[0]}`;
  return el.tagName.toLowerCase();
}

export function resolveBlockHtml(label: string): string | null {
  const normalized = label.toLowerCase();
  switch (normalized) {
    case 'heading':
      return '<h1>Heading Text</h1>';
    case 'paragraph':
      return '<p>Paragraph text here</p>';
    case 'button':
      return '<button>Click Me</button>';
    case 'container':
      return '<div style="padding:16px;border:1px solid #ddd;">Container</div>';
    default:
      if (normalized.includes('<')) return label;
      return null;
  }
}


