export function exportHtmlFrom(container: HTMLElement): string {
  const angularAttributes = ['_ngcontent', 'ng-version', 'ng-reflect'];
  const angularClasses = [
    'dz-item',
    'dz-selected',
    'dz-row',
    'dz-column',
    'dz-image',
    'dz-list',
    'dz-card',
  ];

  const clone = container.cloneNode(true) as HTMLElement;

  const cleanElement = (el: HTMLElement) => {
    if (
      el.classList.contains('column-label') ||
      el.classList.contains('image-overlay') ||
      el.classList.contains('image-placeholder')
    ) {
      el.remove();
      return;
    }

    el.querySelectorAll('.image-overlay').forEach((n) => n.remove());
    el.querySelectorAll('.column-label').forEach((n) => n.remove());
    el.querySelectorAll('.image-placeholder').forEach((n) => n.remove());

    if (el.classList.contains('image-wrapper')) {
      el.style.border = 'none';
      el.style.background = 'transparent';
      el.style.minHeight = 'auto';
    }

    Array.from(el.attributes).forEach((attr) => {
      if (angularAttributes.some((a) => attr.name.startsWith(a))) {
        el.removeAttribute(attr.name);
      }
    });

    if (el.className) {
      const classes = el.className.split(' ').filter((c) => !angularClasses.includes(c));
      if (classes.length > 0) el.className = classes.join(' ');
      else el.removeAttribute('class');
    }

    if (el.style && el.style.cursor === 'pointer') {
      el.style.cursor = '';
    }

    Array.from(el.children).forEach((child) => cleanElement(child as HTMLElement));
  };

  clone.querySelectorAll('.image-overlay').forEach((n) => n.remove());
  clone.querySelectorAll('.column-label').forEach((n) => n.remove());
  clone.querySelectorAll('.image-placeholder').forEach((n) => n.remove());

  cleanElement(clone);
  return clone.innerHTML;
}

export function exportStylesFrom(
  rootEl: HTMLElement,
  componentStyles: Record<string, string>
): string {
  const styles: string[] = [];
  const processed = new Set<HTMLElement>();
  const addedComponentStyles = new Set<string>();

  const getElementSelector = (el: HTMLElement): string => {
    const id = el.id;
    if (id) return `#${id}`;
    const classes = Array.from(el.classList).filter((c) => !c.startsWith('dz-'));
    if (classes.length > 0) return `.${classes[0]}`;
    return el.tagName.toLowerCase();
  };

  const collect = (el: HTMLElement) => {
    if (processed.has(el)) return;
    processed.add(el);

    const inlineStyle = el.getAttribute('style');
    if (inlineStyle) {
      styles.push(`${getElementSelector(el)} { ${inlineStyle} }`);
    }

    const classes = Array.from(el.classList);
    for (const className of classes) {
      const styleKey = `.${className}`;
      if (componentStyles[styleKey] && !addedComponentStyles.has(styleKey)) {
        styles.push(`${styleKey} { ${componentStyles[styleKey].trim()} }`);
        addedComponentStyles.add(styleKey);
      }
    }

    if (el.classList.contains('column') && el.getAttribute('style')?.includes('width')) {
      const specialKey = '.column[style*="width"]';
      if (componentStyles[specialKey] && !addedComponentStyles.has(specialKey)) {
        styles.push(`${specialKey} { ${componentStyles[specialKey].trim()} }`);
        addedComponentStyles.add(specialKey);
      }
    }

    if (el.classList.contains('column-inner')) {
      const hasContent = el.children.length > 0 || el.textContent?.trim();
      if (hasContent) {
        const specialKey = '.column-inner:not(:empty) ~ .column-label';
        if (componentStyles[specialKey] && !addedComponentStyles.has(specialKey)) {
          styles.push(`${specialKey} { ${componentStyles[specialKey].trim()} }`);
          addedComponentStyles.add(specialKey);
        }
      }
    }

    Array.from(el.children).forEach((child) => collect(child as HTMLElement));
  };

  collect(rootEl);
  return styles.join('\n');
}
