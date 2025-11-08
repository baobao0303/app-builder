import {
  Component,
  EventEmitter,
  Output,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { COMPONENT_CATEGORIES, ComponentCategories } from '../components.show';
import { TabTooltipDirective } from '../directives/tab-tooltip.directive';
import { ComponentModelService } from '../../../core/dom-components/component-model.service';
import { ComponentModel } from '../../../core/dom-components/model/component.model';
import { TraitManagerService } from '../../../core/trait-manager/trait-manager.service';
import { CssGeneratorService } from '../../../core/code-generator/css-generator.service';
import { ParserService } from '../../../core/parser/parser.service';
import { AssetManagerService, Asset } from '../../../core/asset-manager/asset-manager.service';

@Component({
  selector: 'app-tool-box',
  standalone: true,
  imports: [CommonModule, FormsModule, TabTooltipDirective],
  templateUrl: './tool-box.html',
  styleUrl: './tool-box.scss',
})
export class ToolBox implements AfterViewInit, OnDestroy {
  @Output() addWidget = new EventEmitter<string>();
  @ViewChild('tabContent', { static: false }) tabContentRef?: ElementRef<HTMLElement>;

  private componentModelService = inject(ComponentModelService);
  traitManager = inject(TraitManagerService);

  private parser = inject(ParserService);
  private assetManager = inject(AssetManagerService);

  assets: Asset[] = [];

  activeTab: 'assets' | 'components' | 'attributes' | 'styles' = 'assets';

  // Sub-tab cho Components tab
  activeComponentSubTab: 'components' | 'blocks' = 'components';

  // Sub-tab cho Attributes tab
  activeAttributeSubTab: 'content' | 'style' | 'advanced' = 'content';

  // Content attributes state
  contentId: string = '';
  contentTitle: string = '';
  contentClass: string = '';
  private contentUpdateInterval?: number;

  // Flag to prevent loading properties while user is editing
  private isEditingTypographyProperty: boolean = false;

  // Attribute sections expanded state
  attributeSectionsExpanded: Record<string, boolean> = {
    element: true,
    general: true,
  };

  // Style tab state dropdown
  activeStyleState: string = '- State -';
  styleStateDropdownOpen: boolean = false;
  styleStates: string[] = ['- State -', 'hover', 'active', 'nth-of-type(2n)'];

  // Style sections expanded state (for Attributes > Style tab)
  styleAttributeSectionsExpanded: Record<string, boolean> = {
    display: false,
    typography: false,
    size: false,
    margin: false,
    padding: false,
    border: false,
    borderRadius: false,
    backgroundImage: false,
  };

  // Advanced sections expanded state (for Attributes > Advanced tab)
  advancedAttributeSectionsExpanded: Record<string, boolean> = {
    transform: true,
    transition: true,
    animation: true,
    layout: true,
    interaction: true,
  };

  // Display properties state
  displayProperties = {
    display: 'block',
    position: 'static',
    top: 'auto',
    left: 'auto',
    bottom: 'auto',
    right: 'auto',
    float: 'none',
    opacity: 1,
    background: 'rgba(0, 0, 0, 0)',
    color: 'rgb(33, 37, 41)',
  };

  // Display dropdown options
  displayOptions = ['block', 'inline', 'flex', 'grid', 'none'];
  positionOptions = ['static', 'relative', 'absolute', 'fixed', 'sticky'];
  positionValueOptions = ['auto', '0', '10px', '20px', '50px', '100px'];
  floatOptions = ['none', 'left', 'right'];

  // Typography properties state
  typographyProperties = {
    fontSize: '16',
    fontSizeUnit: 'px',
    fontWeight: 'normal',
    fontFamily: '',
    textAlign: 'left',
    lineHeight: '24',
    lineHeightUnit: 'px',
    letterSpacing: '0',
    letterSpacingUnit: 'px',
    textDecoration: 'none',
    decorationColor: 'rgb(33, 37, 41)',
    decorationStyle: 'solid',
  };

  // Typography dropdown options
  fontWeightOptions = [
    'normal',
    'bold',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
  ];
  fontFamilyOptions = ['Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New'];
  textAlignOptions = ['left', 'center', 'right', 'justify'];
  textDecorationOptions = ['none', 'underline', 'overline', 'line-through'];
  decorationStyleOptions = ['solid', 'double', 'dotted', 'dashed', 'wavy'];
  unitOptions = ['px', '%', 'em', 'rem', 'vw', 'vh'];

  // Size properties state
  sizeProperties = {
    width: 'auto',
    widthUnit: 'px',
    height: 'auto',
    heightUnit: 'px',
    minWidth: '0',
    minWidthUnit: 'px',
    minHeight: '0',
    minHeightUnit: 'px',
    maxWidth: 'none',
    maxWidthUnit: 'px',
    maxHeight: 'none',
    maxHeightUnit: 'px',
  };

  // Margin & Padding properties state
  marginProperties = {
    top: '0',
    topUnit: 'px',
    right: '0',
    rightUnit: 'px',
    bottom: '0',
    bottomUnit: 'px',
    left: '0',
    leftUnit: 'px',
  };

  paddingProperties = {
    top: '0',
    topUnit: 'px',
    right: '0',
    rightUnit: 'px',
    bottom: '0',
    bottomUnit: 'px',
    left: '0',
    leftUnit: 'px',
  };

  // Border properties state
  borderProperties = {
    style: 'none',
    width: '0',
    widthUnit: 'px',
    color: 'rgb(33, 37, 41)',
  };

  // Border dropdown options
  borderStyleOptions = [
    'none',
    'solid',
    'dotted',
    'dashed',
    'double',
    'groove',
    'ridge',
    'inset',
    'outset',
  ];

  // Border-radius properties state
  borderRadiusProperties = {
    topLeft: '0',
    topLeftUnit: 'px',
    topRight: '0',
    topRightUnit: 'px',
    bottomLeft: '0',
    bottomLeftUnit: 'px',
    bottomRight: '0',
    bottomRightUnit: 'px',
  };

  // Background-image properties state
  backgroundImageProperties = {
    image: 'none',
    repeat: 'no-repeat',
    size: 'cover',
    positionX: 'center',
    positionY: 'center',
  };

  // Background-image dropdown options
  backgroundRepeatOptions = ['no-repeat', 'repeat', 'repeat-x', 'repeat-y', 'space', 'round'];
  backgroundSizeOptions = ['auto', 'cover', 'contain'];
  backgroundPositionOptions = ['left', 'center', 'right', 'top', 'bottom'];

  // Advanced properties state
  transformProperties = {
    translateX: '0px',
    translateY: '0px',
    rotate: '0deg',
    scaleX: '1',
    scaleY: '1',
    skewX: '0deg',
    skewY: '0deg',
  };

  transitionProperties = {
    property: 'all',
    duration: '0.3s',
    timingFunction: 'ease',
    delay: '0s',
  };

  animationProperties = {
    name: '',
    duration: '1s',
    timingFunction: 'ease',
    delay: '0s',
    iterationCount: '1',
    direction: 'normal',
  };

  layoutProperties = {
    zIndex: 'auto',
    overflowX: 'visible',
    overflowY: 'visible',
  };

  interactionProperties = {
    cursor: 'default',
    pointerEvents: 'auto',
    userSelect: 'auto',
    visibility: 'visible',
  };

  // Advanced dropdown options
  overflowOptions = ['visible', 'hidden', 'scroll', 'auto'];
  cursorOptions = [
    'default',
    'pointer',
    'text',
    'move',
    'not-allowed',
    'wait',
    'help',
    'crosshair',
    'grab',
    'grabbing',
  ];
  pointerEventsOptions = [
    'auto',
    'none',
    'visiblePainted',
    'visibleFill',
    'visibleStroke',
    'painted',
  ];
  userSelectOptions = ['auto', 'none', 'text', 'all'];
  visibilityOptions = ['visible', 'hidden', 'collapse'];
  timingFunctionOptions = [
    'ease',
    'linear',
    'ease-in',
    'ease-out',
    'ease-in-out',
    'step-start',
    'step-end',
  ];
  animationDirectionOptions = ['normal', 'reverse', 'alternate', 'alternate-reverse'];

  // Sub-tab cho Styles tab
  activeStyleSubTab: 'variables' | 'css' = 'variables';

  // CSS Editor state
  cssCode: string = '/* Select a component to edit its CSS */';
  cssSelector: string = '';
  private lastSelectedId: string | null = null;
  private cssUpdateInterval?: number;

  // Block search
  blockSearchQuery: string = '';

  // Component search
  componentSearchQuery: string = '';

  // Layer tree data - populated from ComponentModelService
  layerTree: Array<{
    component: ComponentModel;
    label: string;
    id: string;
    icon: string;
    level: number;
    expanded: boolean;
    selected: boolean;
    children?: Array<any>;
  }> = [];

  selectedComponentId: string | null = null;
  private updateInterval?: number;

  constructor() {
    // Poll for changes (update every 500ms)
    this.updateInterval = window.setInterval(() => {
      this.updateLayerTree();
    }, 500);

    // Subscribe to asset changes
    this.assetManager.assets$.subscribe((assets) => {
      this.assets = assets;
    });
  }

  triggerFileInput(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = (event: any) => this.handleFileUpload(event);
    input.click();
  }

  removeAsset(id: string, event: MouseEvent): void {
    event.stopPropagation(); // Prevent drag from starting
    this.assetManager.removeAsset(id);
  }

  onDragStartAsset(event: DragEvent, asset: Asset): void {
    // Use text-key format so dynamic-zone can create component from registry
    const componentKey = asset.type === 'image' ? 'image' : 'video';
    event.dataTransfer?.setData('text/plain', componentKey);

    // Also store asset src in a custom data format for later use
    event.dataTransfer?.setData(
      'application/json',
      JSON.stringify({
        assetSrc: asset.src,
        assetName: asset.name,
      })
    );

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  handleFileUpload(event: any): void {
    const files = event.target.files;
    if (!files) return;

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const newAsset: Omit<Asset, 'id'> = {
          name: file.name,
          src: e.target.result,
          type: file.type.startsWith('image') ? 'image' : 'video',
        };
        this.assetManager.addAsset(newAsset);
      };
      reader.readAsDataURL(file);
    }
  }

  // Store expanded state by component ID
  private expandedStates = new Map<string, boolean>();

  updateLayerTree(): void {
    const rootComponent = this.componentModelService.getRootComponent();
    if (rootComponent) {
      this.layerTree = [this.convertComponentToLayer(rootComponent, 0)];
    } else {
      this.layerTree = [];
    }
  }

  convertComponentToLayer(
    component: ComponentModel,
    level: number
  ): {
    component: ComponentModel;
    label: string;
    id: string;
    icon: string;
    level: number;
    expanded: boolean;
    selected: boolean;
    children?: Array<any>;
  } {
    const tagName = component.getTagName();
    const id = component.getId();
    const children = component.getComponents();

    // Determine icon based on tag name
    let icon = 'mdi-view-dashboard-outline'; // Default icon for div/container
    if (tagName === 'section') icon = 'mdi-view-grid-outline';
    else if (tagName === 'nav' || tagName === 'navbar') icon = 'mdi-menu';
    else if (tagName === 'div' || tagName === 'container') icon = 'mdi-view-dashboard-outline';
    else if (tagName === 'h1') icon = 'mdi-format-header-1';
    else if (tagName === 'h2') icon = 'mdi-format-header-2';
    else if (tagName === 'h3') icon = 'mdi-format-header-3';
    else if (tagName === 'h4' || tagName === 'h5' || tagName === 'h6')
      icon = 'mdi-format-header-decrease';
    else if (tagName === 'p' || tagName === 'span') icon = 'mdi-format-text';
    else if (tagName === 'img' || tagName === 'image') icon = 'mdi-image';
    else if (tagName === 'video') icon = 'mdi-video';
    else if (tagName === 'button') icon = 'mdi-button-cursor';
    else if (tagName === 'input') icon = 'mdi-form-textbox';
    else if (tagName === 'a' || tagName === 'link') icon = 'mdi-link';
    else if (tagName === 'ul' || tagName === 'ol') icon = 'mdi-format-list-bulleted';
    else if (tagName === 'li') icon = 'mdi-format-list-bulleted-type';
    else if (tagName === 'form') icon = 'mdi-form-select';
    else if (tagName === 'table') icon = 'mdi-table';
    else if (tagName === 'thead' || tagName === 'tbody' || tagName === 'tfoot')
      icon = 'mdi-table-row';
    else if (tagName === 'tr') icon = 'mdi-table-row-plus-after';
    else if (tagName === 'td' || tagName === 'th') icon = 'mdi-table-cell';

    // Preserve expanded state if exists, otherwise default to true
    const expanded = this.expandedStates.has(id) ? this.expandedStates.get(id)! : true;

    const layer: any = {
      component,
      label: level === 0 ? 'Page' : tagName,
      id,
      icon,
      level,
      expanded,
      selected: this.selectedComponentId === id,
    };

    if (children.length > 0) {
      layer.children = children.map((child) => this.convertComponentToLayer(child, level + 1));
    }

    return layer;
  }

  toggleLayer(layer: any): void {
    if (layer.children && layer.children.length > 0) {
      layer.expanded = !layer.expanded;
      // Save expanded state
      this.expandedStates.set(layer.id, layer.expanded);
    }
    // Select layer
    this.selectLayer(layer);
  }

  selectLayer(layer: any): void {
    // Deselect all
    this.selectedComponentId = layer.id;
    this.deselectAllLayers(this.layerTree);
    // Select current
    layer.selected = true;

    // Emit selection event (similar to navigator panel)
    if (layer.component) {
      // You can emit an event here if needed
      // this.componentSelect.emit(layer.component);
    }
  }

  private deselectAllLayers(layers: any[]): void {
    layers.forEach((l) => {
      l.selected = false;
      if (l.children) {
        this.deselectAllLayers(l.children);
      }
    });
  }

  private scrollTimeout?: number;
  private scrollHandler?: (e: Event) => void;

  // Tab icons
  readonly tabIcons = {
    assets: 'mdi mdi-image-multiple-outline',
    components: 'mdi mdi-cube-outline',
    attributes: 'mdi mdi-cog-outline',
    styles: 'mdi mdi-palette-outline',
  };

  // Dropdown states
  openedDropdowns: { [key: string]: boolean } = {
    basic: true, // Open basic category by default
    forms: false,
    extra: false,
    layout: false,
  };

  // Style variables sections expanded state
  styleVariablesExpanded: { [key: string]: boolean } = {
    bootstrap: false,
    font: true,
  };

  // Style variables data
  styleVariables: {
    bootstrap: Record<string, string>;
    font: Record<string, string>;
  } = {
    bootstrap: {},
    font: {
      'font-sans-serif': '',
      'font-monospace': '',
      'font-family': '',
      'font-size': '',
      'font-weight': '',
      'font-style': '',
      'line-height': '',
    },
  };

  // Danh sách widget Regular theo categories (import từ components.show.ts)
  readonly regularCategories: ComponentCategories = COMPONENT_CATEGORIES;

  // Danh sách blocks (HTML blocks)
  readonly blocks: Array<{ key: string; label: string; html: string }> = [
    { key: 'block-heading', label: 'Heading Block', html: '<h1>Heading Text</h1>' },
    { key: 'block-paragraph', label: 'Paragraph Block', html: '<p>Paragraph text here</p>' },
    { key: 'block-button', label: 'Button Block', html: '<button>Click Me</button>' },
    {
      key: 'block-container',
      label: 'Container Block',
      html: '<div style="padding:16px;border:1px solid #ddd;">Container</div>',
    },
    // Thêm blocks ở đây
  ];

  // Filtered blocks based on search query
  get filteredBlocks(): Array<{ key: string; label: string; html: string }> {
    if (!this.blockSearchQuery.trim()) {
      return this.blocks;
    }
    const query = this.blockSearchQuery.toLowerCase().trim();
    return this.blocks.filter(
      (block) =>
        block.label.toLowerCase().includes(query) || block.key.toLowerCase().includes(query)
    );
  }

  // Clear block search
  clearBlockSearch(): void {
    this.blockSearchQuery = '';
  }

  // Clear component search
  clearComponentSearch(): void {
    this.componentSearchQuery = '';
  }

  // Filtered regular categories based on search query
  get filteredRegularCategories(): ComponentCategories {
    if (!this.componentSearchQuery.trim()) {
      return this.regularCategories;
    }
    const query = this.componentSearchQuery.toLowerCase().trim();
    const filtered: ComponentCategories = {
      basic: [],
      forms: [],
      extra: [],
      layout: [],
    };

    // Filter each category
    Object.keys(this.regularCategories).forEach((category) => {
      const key = category as keyof ComponentCategories;
      filtered[key] = this.regularCategories[key].filter(
        (item) => item.label.toLowerCase().includes(query) || item.key.toLowerCase().includes(query)
      );
    });

    return filtered;
  }

  toggleDropdown(category: string): void {
    this.openedDropdowns[category] = !this.openedDropdowns[category];
  }

  toggleStyleVariableSection(section: string): void {
    this.styleVariablesExpanded[section] = !this.styleVariablesExpanded[section];
  }

  updateStyleVariable(section: string, key: string, value: string): void {
    if (this.styleVariables[section as keyof typeof this.styleVariables]) {
      this.styleVariables[section as keyof typeof this.styleVariables][key] = value;
      // Apply CSS variable to document root
      document.documentElement.style.setProperty(`--${key}`, value);
    }
  }

  getStyleVariableKeys(section: string): string[] {
    const sectionData = this.styleVariables[section as keyof typeof this.styleVariables];
    return sectionData ? Object.keys(sectionData) : [];
  }

  formatVariableLabel(key: string): string {
    // Convert kebab-case to readable format
    // Example: "font-sans-serif" -> "Font sans serif" (only first word capitalized)
    const words = key.split('-');
    if (words.length === 0) return key;

    // Capitalize first word only
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();

    // Keep other words lowercase
    for (let i = 1; i < words.length; i++) {
      words[i] = words[i].toLowerCase();
    }

    return words.join(' ');
  }

  // Danh sách pages
  readonly pages: Array<{ id: string; name: string }> = [
    { id: 'page-1', name: 'Page 1' },
    // Thêm pages ở đây
  ];

  // Danh sách attributes templates
  readonly attributeTemplates: Array<{
    key: string;
    label: string;
    attributes: Record<string, string>;
  }> = [
    { key: 'href', label: 'Link (href)', attributes: { href: '#' } },
    { key: 'target', label: 'Target', attributes: { target: '_blank' } },
    { key: 'title', label: 'Title', attributes: { title: '' } },
    { key: 'alt', label: 'Alt Text', attributes: { alt: '' } },
    { key: 'data-id', label: 'Data ID', attributes: { 'data-id': '' } },
  ];

  // Danh sách style templates
  readonly styleTemplates: Array<{ key: string; label: string; styles: Record<string, string> }> = [
    { key: 'margin-small', label: 'Margin Small', styles: { margin: '8px' } },
    { key: 'margin-medium', label: 'Margin Medium', styles: { margin: '16px' } },
    { key: 'margin-large', label: 'Margin Large', styles: { margin: '24px' } },
    { key: 'padding-small', label: 'Padding Small', styles: { padding: '8px' } },
    { key: 'padding-medium', label: 'Padding Medium', styles: { padding: '16px' } },
    { key: 'padding-large', label: 'Padding Large', styles: { padding: '24px' } },
    { key: 'text-center', label: 'Text Center', styles: { 'text-align': 'center' } },
    { key: 'text-left', label: 'Text Left', styles: { 'text-align': 'left' } },
    { key: 'text-right', label: 'Text Right', styles: { 'text-align': 'right' } },
  ];

  addBanner(): void {
    this.addWidget.emit('banner');
  }

  // Gắn key vào dataTransfer khi bắt đầu kéo
  onDragStart(ev: DragEvent, key: string) {
    ev.dataTransfer?.setData('text/plain', key);
    ev.dataTransfer?.setDragImage?.(new Image(), 0, 0);
    if (ev.dataTransfer) {
      ev.dataTransfer.effectAllowed = 'copy';
    }
  }

  // Gắn HTML block vào dataTransfer khi bắt đầu kéo block
  onDragStartBlock(ev: DragEvent, block: { key: string; label: string; html: string }) {
    // Set HTML content as JSON
    const jsonData = JSON.stringify({ content: block.html });
    ev.dataTransfer?.setData('application/json', jsonData);
    ev.dataTransfer?.setData('text/plain', block.key);
    ev.dataTransfer?.setDragImage?.(new Image(), 0, 0);
    if (ev.dataTransfer) {
      ev.dataTransfer.effectAllowed = 'copy';
    }
  }

  ngAfterViewInit(): void {
    this.setupScrollbarVisibility();
    // Initial update
    this.updateLayerTree();
    this.updateCssCode();
    this.updateContentAttributes();

    // Watch for selection changes to update CSS code
    this.cssUpdateInterval = window.setInterval(() => {
      this.checkSelectionChange();
    }, 300);

    // Watch for selection changes to update content attributes
    this.contentUpdateInterval = window.setInterval(() => {
      this.updateContentAttributes();
      // Also load properties when selection changes
      // But skip if user is currently editing a typography property
      if (this.activeTab === 'attributes' && !this.isEditingTypographyProperty) {
        if (this.activeAttributeSubTab === 'style') {
          this.loadDisplayProperties();
          this.loadTypographyProperties();
          this.loadSizeProperties();
          this.loadMarginProperties();
          this.loadPaddingProperties();
          this.loadBorderProperties();
          this.loadBorderRadiusProperties();
          this.loadBackgroundImageProperties();
        } else if (this.activeAttributeSubTab === 'advanced') {
          this.loadTransformProperties();
          this.loadTransitionProperties();
          this.loadAnimationProperties();
          this.loadLayoutProperties();
          this.loadInteractionProperties();
        }
      }
    }, 300);
  }

  checkSelectionChange(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const id = selectedElement.id;
      if (id !== this.lastSelectedId) {
        this.lastSelectedId = id;
        this.updateCssCode();
      }
    } else if (this.lastSelectedId !== null) {
      this.lastSelectedId = null;
      this.updateCssCode();
    }
  }

  updateCssCode(): void {
    // Only update if CSS tab is active
    if (this.activeTab !== 'styles' || this.activeStyleSubTab !== 'css') {
      return;
    }

    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const id = selectedElement.id;
      if (id) {
        const component = this.componentModelService.getComponent(id);
        if (component) {
          const classes = component.getClasses();
          if (classes.length > 0) {
            this.cssSelector = '.' + classes.join('.');
          } else {
            this.cssSelector = `#${id}`;
          }

          // Get current CSS from component model first
          const styles = component.getStyle();
          if (Object.keys(styles).length > 0) {
            const styleStr = Object.entries(styles)
              .map(([k, v]) => `  ${this.convertToKebabCase(k)}: ${v};`)
              .join('\n');
            this.cssCode = `${this.cssSelector} {\n${styleStr}\n}`;
          } else {
            // Fallback: Get inline styles from DOM element
            const inlineStyle = selectedElement.getAttribute('style');
            if (inlineStyle) {
              const parsedStyles = this.parser.parseStyle(inlineStyle);
              if (Object.keys(parsedStyles).length > 0) {
                const styleStr = Object.entries(parsedStyles)
                  .map(([k, v]) => `  ${this.convertToKebabCase(k)}: ${v};`)
                  .join('\n');
                this.cssCode = `${this.cssSelector} {\n${styleStr}\n}`;
              } else {
                this.cssCode = `${this.cssSelector} {\n  \n}`;
              }
            } else {
              this.cssCode = `${this.cssSelector} {\n  \n}`;
            }
          }
          return;
        }
      }
    }

    // No selection
    if (this.lastSelectedId === null) {
      this.cssCode = '/* Select a component to edit its CSS */';
      this.cssSelector = '';
    }
  }

  convertToKebabCase(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  convertFromKebabCase(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  updateCssFromCode(): void {
    if (!this.cssSelector || !this.cssCode) return;

    const selectedElement = this.traitManager.getSelected();
    if (!selectedElement || !(selectedElement instanceof HTMLElement)) return;

    const id = selectedElement.id;
    if (!id) return;

    const component = this.componentModelService.getComponent(id);
    if (!component) return;

    // Clear existing inline styles from the DOM element first
    selectedElement.removeAttribute('style');

    // Parse CSS code using ParserService
    try {
      const rules = this.parser.parseCss(this.cssCode);

      // Check if there are valid rules with styles
      if (rules.length > 0 && rules[0].styles && Object.keys(rules[0].styles).length > 0) {
        const rule = rules[0];
        const stylesForModel: Record<string, string> = {};

        // Prepare styles for the model (camelCase) and apply to DOM (kebab-case)
        Object.entries(rule.styles).forEach(([key, value]) => {
          const camelKey = this.convertFromKebabCase(key);
          stylesForModel[camelKey] = value;
          // Apply styles to the DOM element
          selectedElement.style.setProperty(key, value);
        });

        // Apply styles to component model (assuming setStyle will be fixed to REPLACE)
        component.setStyle(stylesForModel);

        console.log('[ToolBox] CSS updated for component:', id, stylesForModel);
      } else {
        // No valid styles found, so clear styles in the model
        component.setStyle({});
        console.log('[ToolBox] CSS cleared for component:', id);
      }
    } catch (error) {
      console.error('[ToolBox] Error parsing CSS:', error);
    }
  }

  ngOnDestroy(): void {
    this.cleanupScrollbarVisibility();
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.cssUpdateInterval) {
      clearInterval(this.cssUpdateInterval);
    }
    if (this.contentUpdateInterval) {
      clearInterval(this.contentUpdateInterval);
    }
  }

  updateContentAttributes(): void {
    // Only update if Content tab is active
    if (this.activeTab !== 'attributes' || this.activeAttributeSubTab !== 'content') {
      return;
    }

    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const id = selectedElement.id;
      const className = selectedElement.className || '';

      // Get title/text content for heading and text elements
      const tagName = selectedElement.tagName?.toLowerCase();
      const isTextElement = [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'span',
        'a',
        'button',
        'label',
      ].includes(tagName);
      const title = isTextElement ? selectedElement.textContent || '' : '';

      this.contentId = id || '';
      this.contentTitle = title;
      this.contentClass = className;
    } else {
      // No selection - clear values
      this.contentId = '';
      this.contentTitle = '';
      this.contentClass = '';
    }
  }

  updateContentId(value: string): void {
    this.contentId = value;
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const oldId = selectedElement.id || '';
      selectedElement.id = value;
      // Sync to model service
      if (oldId) {
        this.componentModelService.updateComponentId(oldId, value);
      } else if (value) {
        // If component doesn't have id yet, we need to get it from component model
        const component = this.componentModelService.getComponent(value);
        if (!component) {
          // Try to find component by element
          // This is a simplified approach - in a real scenario, you'd need a better mapping
          const root = this.componentModelService.getRootComponent();
          if (root) {
            // Find component that matches this element
            // For now, just update the DOM element
          }
        }
      }
      this.traitManager.updateAttribute('id', value);
    }
  }

  updateContentTitle(value: string): void {
    this.contentTitle = value;
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const tagName = selectedElement.tagName?.toLowerCase();
      const isTextElement = [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'span',
        'a',
        'button',
        'label',
      ].includes(tagName);
      if (isTextElement) {
        selectedElement.textContent = value;
        this.traitManager.updateAttribute('textContent', value);
      }
    }
  }

  updateContentClass(value: string): void {
    this.contentClass = value;
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      selectedElement.className = value;
      this.traitManager.updateAttribute('class', value);
    }
  }

  isTextElement(): boolean {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const tagName = selectedElement.tagName?.toLowerCase();
      return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'button', 'label'].includes(
        tagName
      );
    }
    return false;
  }

  toggleAttributeSection(section: string): void {
    this.attributeSectionsExpanded[section] = !this.attributeSectionsExpanded[section];
  }

  toggleStyleAttributeSection(section: string): void {
    this.styleAttributeSectionsExpanded[section] = !this.styleAttributeSectionsExpanded[section];
  }

  toggleAdvancedAttributeSection(section: string): void {
    this.advancedAttributeSectionsExpanded[section] =
      !this.advancedAttributeSectionsExpanded[section];
  }

  selectStyleState(state: string): void {
    this.activeStyleState = state;
    this.styleStateDropdownOpen = false;
  }

  toggleStyleStateDropdown(): void {
    this.styleStateDropdownOpen = !this.styleStateDropdownOpen;
  }

  resetStyleState(): void {
    this.activeStyleState = '- State -';
    // Reset all style properties to default values
    this.loadDisplayProperties();
    this.loadTypographyProperties();
    this.loadSizeProperties();
    this.loadMarginProperties();
    this.loadPaddingProperties();
    this.loadBorderProperties();
    this.loadBorderRadiusProperties();
    this.loadBackgroundImageProperties();
  }

  // Update display property
  updateDisplayProperty(property: string, value: string): void {
    (this.displayProperties as any)[property] = value;
    this.applyDisplayStyles();
  }

  // Update opacity
  updateOpacity(value: number | string): void {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    this.displayProperties.opacity = isNaN(numValue) ? 0 : numValue;
    this.applyDisplayStyles();
  }

  // Helper to parse number from input
  parseNumber(value: string): number {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  // Update float (segmented control)
  updateFloat(value: string): void {
    this.displayProperties.float = value;
    this.applyDisplayStyles();
  }

  // Apply all display styles to selected element
  applyDisplayStyles(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const props = this.displayProperties;

      // Apply each property
      selectedElement.style.display = props.display;
      selectedElement.style.position = props.position;
      selectedElement.style.top = props.top;
      selectedElement.style.left = props.left;
      selectedElement.style.bottom = props.bottom;
      selectedElement.style.right = props.right;
      selectedElement.style.float = props.float;
      selectedElement.style.opacity = String(props.opacity);
      selectedElement.style.background = props.background;
      selectedElement.style.color = props.color;

      // Update via trait manager
      this.traitManager.updateAttribute('style', selectedElement.style.cssText);
    }
  }

  // Load display properties from selected element
  loadDisplayProperties(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const style = window.getComputedStyle(selectedElement);
      this.displayProperties = {
        display: style.display || 'block',
        position: style.position || 'static',
        top: style.top || 'auto',
        left: style.left || 'auto',
        bottom: style.bottom || 'auto',
        right: style.right || 'auto',
        float: style.float || 'none',
        opacity: Number(style.opacity) || 1,
        background: style.backgroundColor || 'rgba(0, 0, 0, 0)',
        color: style.color || 'rgb(33, 37, 41)',
      };
    }
  }

  // Typography
  updateTypographyProperty(property: string, value: string): void {
    // Validate that the property exists in typographyProperties
    if (property in this.typographyProperties) {
      // Set flag to prevent reloading properties while editing
      this.isEditingTypographyProperty = true;

      // Special validation for decorationColor - ensure it's a valid color value
      if (property === 'decorationColor') {
        // Validate RGB/RGBA format or hex color
        const rgbPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)$/i;
        const hexPattern = /^#?[0-9a-f]{3,6}$/i;
        const namedColorPattern = /^[a-z]+$/i;

        if (
          !rgbPattern.test(value) &&
          !hexPattern.test(value) &&
          !namedColorPattern.test(value) &&
          value !== 'transparent' &&
          value !== 'inherit'
        ) {
          // If invalid, try to convert or use default
          console.warn(`Invalid color value: ${value}, using default`);
          value = this.typographyProperties.decorationColor || 'rgb(33, 37, 41)';
        }
      }

      (this.typographyProperties as any)[property] = value;
      this.applyTypographyStyles();

      // Reset flag after a short delay to allow styles to be applied
      setTimeout(() => {
        this.isEditingTypographyProperty = false;
      }, 100);
    } else {
      console.warn(`Invalid typography property: ${property}`);
    }
  }

  applyTypographyStyles(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const props = this.typographyProperties;

      // Apply font size
      if (props.fontSize && props.fontSizeUnit) {
        selectedElement.style.fontSize = `${props.fontSize}${props.fontSizeUnit}`;
      }

      // Apply font weight
      if (props.fontWeight) {
        selectedElement.style.fontWeight = props.fontWeight;
      }

      // Apply font family
      if (props.fontFamily) {
        selectedElement.style.fontFamily = props.fontFamily;
      }

      // Apply text align
      if (props.textAlign) {
        selectedElement.style.textAlign = props.textAlign;
      }

      // Apply line height
      if (props.lineHeight && props.lineHeightUnit) {
        selectedElement.style.lineHeight = `${props.lineHeight}${props.lineHeightUnit}`;
      }

      // Apply letter spacing (only if values are valid)
      if (
        props.letterSpacing !== undefined &&
        props.letterSpacing !== null &&
        props.letterSpacingUnit
      ) {
        selectedElement.style.letterSpacing = `${props.letterSpacing}${props.letterSpacingUnit}`;
      }

      // Apply text decoration
      if (props.textDecoration) {
        selectedElement.style.textDecorationLine = props.textDecoration;
      }

      // Apply decoration color (only if text decoration is not 'none')
      if (props.decorationColor && props.textDecoration && props.textDecoration !== 'none') {
        selectedElement.style.textDecorationColor = props.decorationColor;
      } else if (props.decorationColor) {
        // Still set it even if decoration is none, so it's ready when decoration is applied
        selectedElement.style.textDecorationColor = props.decorationColor;
      }

      // Apply decoration style
      if (props.decorationStyle) {
        selectedElement.style.textDecorationStyle = props.decorationStyle;
      }

      // Update via trait manager
      this.traitManager.updateAttribute('style', selectedElement.style.cssText);
    }
  }

  loadTypographyProperties(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const style = window.getComputedStyle(selectedElement);

      const parseUnit = (value: string, defaultUnit = 'px') => {
        if (!value || value === 'normal') return { value: '24', unit: defaultUnit };
        const match = value.match(/^(-?\d*\.?\d+)(.*)$/);
        if (match) {
          return { value: match[1], unit: match[2] || defaultUnit };
        }
        return { value: value, unit: defaultUnit };
      };

      const fontSize = parseUnit(style.fontSize);
      const lineHeight = parseUnit(style.lineHeight);
      const letterSpacing = parseUnit(style.letterSpacing);

      this.typographyProperties = {
        fontSize: fontSize.value,
        fontSizeUnit: fontSize.unit,
        fontWeight: style.fontWeight,
        fontFamily: style.fontFamily.split(',')[0].replace(/\"/g, '').trim(),
        textAlign: style.textAlign,
        lineHeight: lineHeight.value,
        lineHeightUnit: lineHeight.unit,
        letterSpacing: letterSpacing.value,
        letterSpacingUnit: letterSpacing.unit,
        textDecoration: style.textDecorationLine,
        decorationColor: style.textDecorationColor,
        decorationStyle: style.textDecorationStyle,
      };
    }
  }

  // Size
  updateSizeProperty(property: string, value: string): void {
    (this.sizeProperties as any)[property] = value;
    this.applySizeStyles();
  }

  applySizeStyles(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const props = this.sizeProperties;
      selectedElement.style.width =
        props.width === 'auto' ? 'auto' : `${props.width}${props.widthUnit}`;
      selectedElement.style.height =
        props.height === 'auto' ? 'auto' : `${props.height}${props.heightUnit}`;
      selectedElement.style.minWidth = `${props.minWidth}${props.minWidthUnit}`;
      selectedElement.style.minHeight = `${props.minHeight}${props.minHeightUnit}`;
      selectedElement.style.maxWidth =
        props.maxWidth === 'none' ? 'none' : `${props.maxWidth}${props.maxWidthUnit}`;
      selectedElement.style.maxHeight =
        props.maxHeight === 'none' ? 'none' : `${props.maxHeight}${props.maxHeightUnit}`;

      // Update via trait manager
      this.traitManager.updateAttribute('style', selectedElement.style.cssText);
    }
  }

  loadSizeProperties(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const style = window.getComputedStyle(selectedElement);

      const parseUnit = (value: string, defaultUnit = 'px') => {
        if (!value || value === 'auto' || value === 'none')
          return { value: value, unit: defaultUnit };
        const match = value.match(/^(-?\d*\.?\d+)(.*)$/);
        if (match) {
          return { value: match[1], unit: match[2] || defaultUnit };
        }
        return { value: value, unit: defaultUnit };
      };

      const width = parseUnit(style.width);
      const height = parseUnit(style.height);
      const minWidth = parseUnit(style.minWidth);
      const minHeight = parseUnit(style.minHeight);
      const maxWidth = parseUnit(style.maxWidth);
      const maxHeight = parseUnit(style.maxHeight);

      this.sizeProperties = {
        width: width.value,
        widthUnit: width.unit,
        height: height.value,
        heightUnit: height.unit,
        minWidth: minWidth.value,
        minWidthUnit: minWidth.unit,
        minHeight: minHeight.value,
        minHeightUnit: minHeight.unit,
        maxWidth: maxWidth.value,
        maxWidthUnit: maxWidth.unit,
        maxHeight: maxHeight.value,
        maxHeightUnit: maxHeight.unit,
      };
    }
  }

  // Margin
  updateMarginProperty(property: string, value: string): void {
    (this.marginProperties as any)[property] = value;
    this.applyMarginStyles();
  }

  applyMarginStyles(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const props = this.marginProperties;
      selectedElement.style.marginTop = `${props.top}${props.topUnit}`;
      selectedElement.style.marginRight = `${props.right}${props.rightUnit}`;
      selectedElement.style.marginBottom = `${props.bottom}${props.bottomUnit}`;
      selectedElement.style.marginLeft = `${props.left}${props.leftUnit}`;

      // Update via trait manager
      this.traitManager.updateAttribute('style', selectedElement.style.cssText);
    }
  }

  loadMarginProperties(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const style = window.getComputedStyle(selectedElement);

      const parseUnit = (value: string, defaultUnit = 'px') => {
        if (!value) return { value: '0', unit: defaultUnit };
        const match = value.match(/^(-?\d*\.?\d+)(.*)$/);
        if (match) {
          return { value: match[1], unit: match[2] || defaultUnit };
        }
        return { value: value, unit: defaultUnit };
      };

      const top = parseUnit(style.marginTop);
      const right = parseUnit(style.marginRight);
      const bottom = parseUnit(style.marginBottom);
      const left = parseUnit(style.marginLeft);

      this.marginProperties = {
        top: top.value,
        topUnit: top.unit,
        right: right.value,
        rightUnit: right.unit,
        bottom: bottom.value,
        bottomUnit: bottom.unit,
        left: left.value,
        leftUnit: left.unit,
      };
    }
  }

  // Padding
  updatePaddingProperty(property: string, value: string): void {
    (this.paddingProperties as any)[property] = value;
    this.applyPaddingStyles();
  }

  applyPaddingStyles(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const props = this.paddingProperties;
      selectedElement.style.paddingTop = `${props.top}${props.topUnit}`;
      selectedElement.style.paddingRight = `${props.right}${props.rightUnit}`;
      selectedElement.style.paddingBottom = `${props.bottom}${props.bottomUnit}`;
      selectedElement.style.paddingLeft = `${props.left}${props.leftUnit}`;

      // Update via trait manager
      this.traitManager.updateAttribute('style', selectedElement.style.cssText);
    }
  }

  loadPaddingProperties(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const style = window.getComputedStyle(selectedElement);

      const parseUnit = (value: string, defaultUnit = 'px') => {
        if (!value) return { value: '0', unit: defaultUnit };
        const match = value.match(/^(-?\d*\.?\d+)(.*)$/);
        if (match) {
          return { value: match[1], unit: match[2] || defaultUnit };
        }
        return { value: value, unit: defaultUnit };
      };

      const top = parseUnit(style.paddingTop);
      const right = parseUnit(style.paddingRight);
      const bottom = parseUnit(style.paddingBottom);
      const left = parseUnit(style.paddingLeft);

      this.paddingProperties = {
        top: top.value,
        topUnit: top.unit,
        right: right.value,
        rightUnit: right.unit,
        bottom: bottom.value,
        bottomUnit: bottom.unit,
        left: left.value,
        leftUnit: left.unit,
      };
    }
  }

  // Border
  updateBorderProperty(property: string, value: string): void {
    (this.borderProperties as any)[property] = value;
    this.applyBorderStyles();
  }

  applyBorderStyles(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const props = this.borderProperties;
      selectedElement.style.borderStyle = props.style;
      selectedElement.style.borderWidth = `${props.width}${props.widthUnit}`;
      selectedElement.style.borderColor = props.color;

      // Update via trait manager
      this.traitManager.updateAttribute('style', selectedElement.style.cssText);
    }
  }

  loadBorderProperties(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const style = window.getComputedStyle(selectedElement);

      const parseUnit = (value: string, defaultUnit = 'px') => {
        if (!value) return { value: '0', unit: defaultUnit };
        const match = value.match(/^(-?\d*\.?\d+)(.*)$/);
        if (match) {
          return { value: match[1], unit: match[2] || defaultUnit };
        }
        return { value: value, unit: defaultUnit };
      };

      const width = parseUnit(style.borderWidth);

      this.borderProperties = {
        style: style.borderStyle,
        width: width.value,
        widthUnit: width.unit,
        color: style.borderColor,
      };
    }
  }

  // Border-radius
  updateBorderRadiusProperty(property: string, value: string): void {
    (this.borderRadiusProperties as any)[property] = value;
    this.applyBorderRadiusStyles();
  }

  applyBorderRadiusStyles(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const props = this.borderRadiusProperties;
      selectedElement.style.borderTopLeftRadius = `${props.topLeft}${props.topLeftUnit}`;
      selectedElement.style.borderTopRightRadius = `${props.topRight}${props.topRightUnit}`;
      selectedElement.style.borderBottomLeftRadius = `${props.bottomLeft}${props.bottomLeftUnit}`;
      selectedElement.style.borderBottomRightRadius = `${props.bottomRight}${props.bottomRightUnit}`;

      // Update via trait manager
      this.traitManager.updateAttribute('style', selectedElement.style.cssText);
    }
  }

  loadBorderRadiusProperties(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const style = window.getComputedStyle(selectedElement);

      const parseUnit = (value: string, defaultUnit = 'px') => {
        if (!value) return { value: '0', unit: defaultUnit };
        const match = value.match(/^(-?\d*\.?\d+)(.*)$/);
        if (match) {
          return { value: match[1], unit: match[2] || defaultUnit };
        }
        return { value: value, unit: defaultUnit };
      };

      const topLeft = parseUnit(style.borderTopLeftRadius);
      const topRight = parseUnit(style.borderTopRightRadius);
      const bottomLeft = parseUnit(style.borderBottomLeftRadius);
      const bottomRight = parseUnit(style.borderBottomRightRadius);

      this.borderRadiusProperties = {
        topLeft: topLeft.value,
        topLeftUnit: topLeft.unit,
        topRight: topRight.value,
        topRightUnit: topRight.unit,
        bottomLeft: bottomLeft.value,
        bottomLeftUnit: bottomLeft.unit,
        bottomRight: bottomRight.value,
        bottomRightUnit: bottomRight.unit,
      };
    }
  }

  // Background-image
  updateBackgroundImageProperty(property: string, value: string): void {
    (this.backgroundImageProperties as any)[property] = value;
    this.applyBackgroundImageStyles();
  }

  applyBackgroundImageStyles(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const props = this.backgroundImageProperties;
      selectedElement.style.backgroundImage = `url('${props.image}')`;
      selectedElement.style.backgroundRepeat = props.repeat;
      selectedElement.style.backgroundSize = props.size;
      selectedElement.style.backgroundPosition = `${props.positionX} ${props.positionY}`;

      // Update via trait manager
      this.traitManager.updateAttribute('style', selectedElement.style.cssText);
    }
  }

  loadBackgroundImageProperties(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const style = window.getComputedStyle(selectedElement);

      const imageUrlMatch = style.backgroundImage.match(/url\("(.*?)"\)/);
      const imageUrl = imageUrlMatch ? imageUrlMatch[1] : 'none';

      const position = style.backgroundPosition.split(' ');

      this.backgroundImageProperties = {
        image: imageUrl,
        repeat: style.backgroundRepeat,
        size: style.backgroundSize,
        positionX: position[0] || 'center',
        positionY: position[1] || 'center',
      };
    }
  }

  // Advanced: Transform
  updateTransformProperty(property: string, value: string): void {
    (this.transformProperties as any)[property] = value;
    this.applyTransformStyles();
  }

  applyTransformStyles(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const props = this.transformProperties;
      const transform = `translate(${props.translateX}, ${props.translateY}) rotate(${props.rotate}) scale(${props.scaleX}, ${props.scaleY}) skew(${props.skewX}, ${props.skewY})`;
      selectedElement.style.transform = transform;
      this.traitManager.updateAttribute('style', selectedElement.style.cssText);
    }
  }

  loadTransformProperties(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const style = window.getComputedStyle(selectedElement);
      const transform = style.transform || 'none';
      // Parse transform string (simplified - in production, use a proper parser)
      if (transform !== 'none') {
        // Extract values from transform matrix or individual functions
        // This is a simplified parser - you might want to use a library for this
        const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
        const scaleMatch = transform.match(/scale\(([^,]+),\s*([^)]+)\)/);
        const skewMatch = transform.match(/skew\(([^,]+),\s*([^)]+)\)/);

        if (translateMatch) {
          this.transformProperties.translateX = translateMatch[1].trim();
          this.transformProperties.translateY = translateMatch[2].trim();
        }
        if (rotateMatch) {
          this.transformProperties.rotate = rotateMatch[1].trim();
        }
        if (scaleMatch) {
          this.transformProperties.scaleX = scaleMatch[1].trim();
          this.transformProperties.scaleY = scaleMatch[2].trim();
        }
        if (skewMatch) {
          this.transformProperties.skewX = skewMatch[1].trim();
          this.transformProperties.skewY = skewMatch[2].trim();
        }
      }
    }
  }

  // Advanced: Transition
  updateTransitionProperty(property: string, value: string): void {
    (this.transitionProperties as any)[property] = value;
    this.applyTransitionStyles();
  }

  applyTransitionStyles(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const props = this.transitionProperties;
      selectedElement.style.transition = `${props.property} ${props.duration} ${props.timingFunction} ${props.delay}`;
      this.traitManager.updateAttribute('style', selectedElement.style.cssText);
    }
  }

  loadTransitionProperties(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const style = window.getComputedStyle(selectedElement);
      const transition = style.transition || 'none';
      if (transition !== 'none') {
        // Parse transition string (simplified)
        const parts = transition.split(' ');
        if (parts.length >= 4) {
          this.transitionProperties.property = parts[0];
          this.transitionProperties.duration = parts[1];
          this.transitionProperties.timingFunction = parts[2];
          this.transitionProperties.delay = parts[3];
        }
      }
    }
  }

  // Advanced: Animation
  updateAnimationProperty(property: string, value: string): void {
    (this.animationProperties as any)[property] = value;
    this.applyAnimationStyles();
  }

  applyAnimationStyles(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const props = this.animationProperties;
      if (props.name) {
        selectedElement.style.animation = `${props.name} ${props.duration} ${props.timingFunction} ${props.delay} ${props.iterationCount} ${props.direction}`;
      } else {
        selectedElement.style.animation = 'none';
      }
      this.traitManager.updateAttribute('style', selectedElement.style.cssText);
    }
  }

  loadAnimationProperties(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const style = window.getComputedStyle(selectedElement);
      const animation = style.animation || 'none';
      if (animation !== 'none') {
        // Parse animation string (simplified)
        const parts = animation.split(' ');
        if (parts.length >= 6) {
          this.animationProperties.name = parts[0];
          this.animationProperties.duration = parts[1];
          this.animationProperties.timingFunction = parts[2];
          this.animationProperties.delay = parts[3];
          this.animationProperties.iterationCount = parts[4];
          this.animationProperties.direction = parts[5];
        }
      }
    }
  }

  // Advanced: Layout
  updateLayoutProperty(property: string, value: string): void {
    (this.layoutProperties as any)[property] = value;
    this.applyLayoutStyles();
  }

  applyLayoutStyles(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const props = this.layoutProperties;
      selectedElement.style.zIndex = props.zIndex;
      selectedElement.style.overflowX = props.overflowX;
      selectedElement.style.overflowY = props.overflowY;
      this.traitManager.updateAttribute('style', selectedElement.style.cssText);
    }
  }

  loadLayoutProperties(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const style = window.getComputedStyle(selectedElement);
      this.layoutProperties = {
        zIndex: style.zIndex || 'auto',
        overflowX: style.overflowX || 'visible',
        overflowY: style.overflowY || 'visible',
      };
    }
  }

  // Advanced: Interaction
  updateInteractionProperty(property: string, value: string): void {
    (this.interactionProperties as any)[property] = value;
    this.applyInteractionStyles();
  }

  applyInteractionStyles(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const props = this.interactionProperties;
      selectedElement.style.cursor = props.cursor;
      selectedElement.style.pointerEvents = props.pointerEvents;
      selectedElement.style.userSelect = props.userSelect;
      selectedElement.style.visibility = props.visibility;
      this.traitManager.updateAttribute('style', selectedElement.style.cssText);
    }
  }

  loadInteractionProperties(): void {
    const selectedElement = this.traitManager.getSelected();
    if (selectedElement && selectedElement instanceof HTMLElement) {
      const style = window.getComputedStyle(selectedElement);
      this.interactionProperties = {
        cursor: style.cursor || 'default',
        pointerEvents: style.pointerEvents || 'auto',
        userSelect: style.userSelect || 'auto',
        visibility: style.visibility || 'visible',
      };
    }
  }

  // Helper: Convert RGB/RGBA to hex
  rgbToHex(rgb: string): string {
    if (!rgb || rgb === 'transparent') return '#000000';
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    // If already hex, return as is
    if (rgb.startsWith('#')) return rgb;
    return '#000000';
  }

  // Helper: Convert hex to RGB
  hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return hex;
  }

  // Helper: Convert hex to RGBA
  hexToRgba(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, 0)`;
    }
    return hex;
  }

  private setupScrollbarVisibility(): void {
    // Use setTimeout to ensure ViewChild is available
    setTimeout(() => {
      const tabContent = this.tabContentRef?.nativeElement;
      if (!tabContent) return;

      this.scrollHandler = (e: Event) => {
        const target = e.target as HTMLElement;
        if (!target) return;

        // Add scrolling class
        target.classList.add('scrolling');

        // Clear existing timeout
        if (this.scrollTimeout) {
          clearTimeout(this.scrollTimeout);
        }

        // Remove scrolling class after scroll stops
        this.scrollTimeout = window.setTimeout(() => {
          target.classList.remove('scrolling');
        }, 500);
      };

      tabContent.addEventListener('scroll', this.scrollHandler);
    }, 0);
  }

  private cleanupScrollbarVisibility(): void {
    const tabContent = this.tabContentRef?.nativeElement;
    if (tabContent && this.scrollHandler) {
      tabContent.removeEventListener('scroll', this.scrollHandler);
    }
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }
}
