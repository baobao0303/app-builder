import { TraitManagerService } from '../../../core/trait-manager/trait-manager.service';

export function applyTraitsForElement(traitManager: TraitManagerService, targetEl: HTMLElement): void {
  traitManager.clear();
  traitManager.select(targetEl);

  traitManager.addTrait({
    name: 'id',
    label: 'ID',
    type: 'text',
    value: targetEl.id || '',
  });

  traitManager.addTrait({
    name: 'class',
    label: 'Class',
    type: 'text',
    value: targetEl.className || '',
  });

  traitManager.addTrait({
    name: 'width',
    label: 'Width',
    type: 'text',
    value: (targetEl as HTMLElement).style.width || '',
  });

  traitManager.addTrait({
    name: 'height',
    label: 'Height',
    type: 'text',
    value: (targetEl as HTMLElement).style.height || '',
  });

  if (
    targetEl.classList.contains('dz-column') ||
    targetEl.getAttribute('data-widget') === 'column'
  ) {
    traitManager.addTrait({
      name: 'padding',
      label: 'Padding',
      type: 'text',
      value: (targetEl as HTMLElement).style.padding || '',
    });
  }

  const isRowComponent =
    targetEl.tagName?.toLowerCase() === 'app-row' ||
    targetEl.classList.contains('dz-row') ||
    targetEl.getAttribute('data-widget') === 'row';

  if (isRowComponent) {
    let containerDiv: HTMLElement | null = null;
    if (targetEl.tagName?.toLowerCase() === 'app-row') {
      containerDiv = targetEl.querySelector(
        '.row.dz-row, .column.dz-column, .dz-row, .dz-column'
      ) as HTMLElement | null;
    } else if (
      targetEl.classList.contains('row') ||
      targetEl.classList.contains('dz-row') ||
      targetEl.classList.contains('column') ||
      targetEl.classList.contains('dz-column')
    ) {
      containerDiv = targetEl;
    }

    let currentFlexDirection = 'row';
    if (containerDiv) {
      if (
        containerDiv.classList.contains('column') ||
        containerDiv.classList.contains('dz-column')
      ) {
        currentFlexDirection = 'column';
      }
    } else {
      const inner = targetEl.querySelector('.row-inner, .column-inner') as HTMLElement | null;
      if (inner) {
        currentFlexDirection = inner.style.flexDirection || 'row';
      }
    }

    traitManager.addTrait({
      name: 'flexDirection',
      label: '方向',
      type: 'select',
      value: currentFlexDirection,
      options: [
        { value: 'row', label: '横向' },
        { value: 'column', label: '纵向' },
      ],
    });

    traitManager.addTrait({
      name: 'justifyContent',
      label: 'Justify',
      type: 'select',
      value: (targetEl as HTMLElement).style.justifyContent || 'flex-start',
      options: [
        { value: 'flex-start', label: 'Start' },
        { value: 'center', label: 'Center' },
        { value: 'flex-end', label: 'End' },
        { value: 'space-between', label: 'Space Between' },
        { value: 'space-around', label: 'Space Around' },
        { value: 'space-evenly', label: 'Space Evenly' },
      ],
    });

    traitManager.addTrait({
      name: 'alignItems',
      label: 'Align',
      type: 'select',
      value: (targetEl as HTMLElement).style.alignItems || 'stretch',
      options: [
        { value: 'stretch', label: 'Stretch' },
        { value: 'flex-start', label: 'Start' },
        { value: 'center', label: 'Center' },
        { value: 'flex-end', label: 'End' },
      ],
    });

    traitManager.addTrait({
      name: 'gap',
      label: 'Gap',
      type: 'text',
      value: (targetEl as HTMLElement).style.gap || '',
    });

    traitManager.addTrait({
      name: 'flexWrap',
      label: 'Flex Wrap',
      type: 'select',
      value: (targetEl as HTMLElement).style.flexWrap || 'nowrap',
      options: [
        { value: 'nowrap', label: 'No Wrap' },
        { value: 'wrap', label: 'Wrap' },
        { value: 'wrap-reverse', label: 'Wrap Reverse' },
      ],
    });
  }

  const tag = targetEl.tagName.toLowerCase();
  const isTextual = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'].includes(tag);

  if (isTextual) {
    traitManager.addTrait({
      name: 'textContent',
      label: 'Text',
      type: 'text',
      value: targetEl.textContent || '',
    });

    traitManager.addTrait({
      name: 'fontSizeClass',
      label: 'Font Size',
      type: 'select',
      value: '',
      options: [
        { value: '', label: 'Default' },
        { value: 'text-sm', label: 'text-sm' },
        { value: 'text-lg', label: 'text-lg' },
        { value: 'text-xl', label: 'text-xl' },
        { value: 'text-2xl', label: 'text-2xl' },
        { value: 'text-[20px]', label: 'text-[20px]' },
      ],
    });

    traitManager.addTrait({
      name: 'fontFamilyClass',
      label: 'Font Family',
      type: 'select',
      value: '',
      options: [
        { value: '', label: 'Default' },
        { value: 'font-sans', label: 'font-sans' },
        { value: 'font-serif', label: 'font-serif' },
        { value: 'font-mono', label: 'font-mono' },
      ],
    });

    traitManager.addTrait({
      name: 'fontWeightClass',
      label: 'Font Weight',
      type: 'select',
      value: '',
      options: [
        { value: '', label: 'Default' },
        { value: 'font-light', label: 'font-light' },
        { value: 'font-normal', label: 'font-normal' },
        { value: 'font-medium', label: 'font-medium' },
        { value: 'font-bold', label: 'font-bold' },
        { value: 'font-black', label: 'font-black' },
      ],
    });

    traitManager.addTrait({
      name: 'textColorClass',
      label: 'Text Color',
      type: 'text',
      value: '',
    });

    traitManager.addTrait({
      name: 'bgColorClass',
      label: 'Background',
      type: 'text',
      value: '',
    });

    traitManager.addTrait({
      name: 'lineHeightClass',
      label: 'Line Height',
      type: 'select',
      value: '',
      options: [
        { value: '', label: 'Default' },
        { value: 'leading-tight', label: 'leading-tight' },
        { value: 'leading-normal', label: 'leading-normal' },
        { value: 'leading-loose', label: 'leading-loose' },
        { value: 'leading-[1.8]', label: 'leading-[1.8]' },
      ],
    });

    traitManager.addTrait({
      name: 'letterSpacingClass',
      label: 'Letter Spacing',
      type: 'select',
      value: '',
      options: [
        { value: '', label: 'Default' },
        { value: 'tracking-tight', label: 'tracking-tight' },
        { value: 'tracking-wider', label: 'tracking-wider' },
        { value: 'tracking-[0.1em]', label: 'tracking-[0.1em]' },
      ],
    });

    traitManager.addTrait({
      name: 'textTransformClass',
      label: 'Transform',
      type: 'select',
      value: '',
      options: [
        { value: '', label: 'Default' },
        { value: 'uppercase', label: 'uppercase' },
        { value: 'lowercase', label: 'lowercase' },
        { value: 'capitalize', label: 'capitalize' },
        { value: 'normal-case', label: 'normal-case' },
      ],
    });

    traitManager.addTrait({
      name: 'textAlignClass',
      label: 'Text Align',
      type: 'select',
      value: '',
      options: [
        { value: '', label: 'Default' },
        { value: 'text-left', label: 'text-left' },
        { value: 'text-center', label: 'text-center' },
        { value: 'text-right', label: 'text-right' },
        { value: 'text-justify', label: 'text-justify' },
      ],
    });

    traitManager.addTrait({
      name: 'textShadow',
      label: 'Text Shadow (CSS)',
      type: 'text',
      value: (targetEl as HTMLElement).style.textShadow || '',
    });
  }
}

