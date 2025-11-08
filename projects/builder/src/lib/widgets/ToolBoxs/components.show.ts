export interface ComponentItem {
  key: string;
  label: string;
  icon: string;
}

export interface ComponentCategories {
  basic: ComponentItem[];
  forms: ComponentItem[];
  extra: ComponentItem[];
  layout: ComponentItem[];
}

export const COMPONENT_CATEGORIES: ComponentCategories = {
  basic: [
    { key: '1-columns', label: '1 columns', icon: 'mdi mdi-view-column' },
    { key: 'heading', label: 'Heading', icon: 'mdi mdi-format-header-1' },
    { key: 'text', label: 'Text', icon: 'mdi mdi-format-text' },
    { key: '2-columns', label: '2 columns', icon: 'mdi mdi-view-column' },
    { key: '3-columns', label: '3 columns', icon: 'mdi mdi-view-column' },
    { key: '2-columns-3-7', label: '2 columns 3/7', icon: 'mdi mdi-view-column' },
    { key: 'image', label: 'Image', icon: 'mdi mdi-image' },
    { key: 'video', label: 'Video', icon: 'mdi mdi-video' },
    { key: 'list', label: 'List', icon: 'mdi mdi-format-list-bulleted' },
    { key: 'card', label: 'Card', icon: 'mdi mdi-card' },
    { key: 'voucher', label: 'Voucher Card', icon: 'mdi mdi-ticket' },
    { key: 'voucher-carousel', label: 'Voucher Carousel', icon: 'mdi mdi-image-multiple' },
  ],
  forms: [
    // Thêm form items ở đây
  ],
  extra: [{ key: 'navbar', label: 'Navbar', icon: 'mdi mdi-menu' }],
  layout: [
    { key: 'section', label: 'Section', icon: 'mdi mdi-cube-outline' },
    { key: 'main', label: 'Main', icon: 'mdi mdi-view-dashboard' },
    { key: 'header', label: 'Header', icon: 'mdi mdi-page-layout-header' },
    { key: 'footer', label: 'Footer', icon: 'mdi mdi-page-layout-footer' },
  ],
};
