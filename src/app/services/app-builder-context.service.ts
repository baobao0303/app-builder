import { Injectable, Type } from '@angular/core';

import { BuilderContextConfig } from '../../../projects/builder/src/lib/core/context/builder-context';
import { BlockModel } from '../../../projects/builder/src/lib/widgets/block-manager/model/block.model';
import { ComponentDefinition } from '../../../projects/builder/src/lib/core/dom-components/model/component.model';
import { CanvasZone } from 'builder';

import { Banner } from '../../../projects/builder/src/lib/widgets/components/banner/banner';
import { AComponent } from '../../../projects/builder/src/lib/widgets/components/a/a.component';
import { CardComponent } from '../../../projects/builder/src/lib/widgets/components/card/card.component';
import { ListComponent } from '../../../projects/builder/src/lib/widgets/components/list/list.component';
import { VoucherComponent } from '../../../projects/builder/src/lib/widgets/components/voucher/voucher.component';
import { VoucherCarouselComponent } from '../../../projects/builder/src/lib/widgets/components/voucher/voucher-carousel.component';
import { ColumnComponent } from '../../../projects/builder/src/lib/widgets/ToolBoxs/components/basics/column/column';
import { HeadingComponent } from '../../../projects/builder/src/lib/widgets/ToolBoxs/components/basics/heading/heading';
import { ImageComponent } from '../../../projects/builder/src/lib/widgets/ToolBoxs/components/basics/image/image.component';
import { VideoComponent } from '../../../projects/builder/src/lib/widgets/ToolBoxs/components/basics/video/video.component';
import { RowComponent } from '../../../projects/builder/src/lib/widgets/ToolBoxs/components/basics/row/row';
import { SectionComponent } from '../../../projects/builder/src/lib/widgets/ToolBoxs/components/basics/section/section';
import { TextComponent } from '../../../projects/builder/src/lib/widgets/ToolBoxs/components/basics/text/text';
import { NavbarComponent } from '../../../projects/builder/src/lib/widgets/ToolBoxs/components/extras/navbar/navbar.component';
import { MainComponent } from '../../../projects/builder/src/lib/widgets/ToolBoxs/components/basics/main/main';
import { HeaderComponent } from '../../../projects/builder/src/lib/widgets/ToolBoxs/components/layouts/header/header';
import { FooterComponent } from '../../../projects/builder/src/lib/widgets/ToolBoxs/components/layouts/footer/footer';
import { ProductCardComponent } from '../../../projects/builder/src/lib/widgets/components/product-card/product-card.component';
import { ProductCarouselComponent } from '../../../projects/builder/src/lib/widgets/components/product-carousel/product-carousel.component';
import { PaginationComponent } from '../../../projects/builder/src/lib/widgets/components/pagination/pagination.component';
import { DiscountBadgeComponent } from '../../../projects/builder/src/lib/widgets/components/discount-badge/discount-badge.component';
import { RatingComponent } from '../../../projects/builder/src/lib/widgets/components/rating/rating.component';
import { PriceDisplayComponent } from '../../../projects/builder/src/lib/widgets/components/price-display/price-display.component';
import { CategoryNavItemComponent } from '../../../projects/builder/src/lib/widgets/components/category-nav-item/category-nav-item.component';
import { AddToCartButtonComponent } from '../../../projects/builder/src/lib/widgets/components/add-to-cart-button/add-to-cart-button.component';
import { CategoryProductCarouselComponent } from '../../../projects/builder/src/lib/widgets/components/category-product-carousel/category-product-carousel.component';
import { DynamicCategoryTabsComponent } from '../../../projects/builder/src/lib/widgets/components/dynamic-category-tabs/dynamic-category-tabs.component';
import { TabPanelComponent } from '../../../projects/builder/src/lib/widgets/components/tab-panel/tab-panel.component';

@Injectable()
export class AppBuilderContextService implements BuilderContextConfig {
  readonly registry: Record<string, Type<unknown>> = {
    banner: Banner,
    canvas: CanvasZone,
    a: AComponent,
    section: SectionComponent,
    navbar: NavbarComponent,
    row: RowComponent,
    column: ColumnComponent,
    '1-columns': ColumnComponent,
    '2-columns': RowComponent,
    '3-columns': RowComponent,
    '2-columns-3-7': RowComponent,
    image: ImageComponent,
    video: VideoComponent,
    list: ListComponent,
    card: CardComponent,
    heading: HeadingComponent,
    text: TextComponent,
    voucher: VoucherComponent,
    'voucher-carousel': VoucherCarouselComponent,
    main: MainComponent,
    header: HeaderComponent,
    footer: FooterComponent,
    'product-card': ProductCardComponent,
    'product-carousel': ProductCarouselComponent,
    pagination: PaginationComponent,
    'discount-badge': DiscountBadgeComponent,
    rating: RatingComponent,
    'price-display': PriceDisplayComponent,
    'category-nav-item': CategoryNavItemComponent,
    'add-to-cart-button': AddToCartButtonComponent,
    'category-product-carousel': CategoryProductCarouselComponent,
    'dynamic-category-tabs': DynamicCategoryTabsComponent,
    'tab-panel': TabPanelComponent,
  };

  readonly componentDefinitions: Record<string, ComponentDefinition> = {
    banner: {
      tagName: 'div',
      attributes: { 'data-widget': 'banner' },
      style: { padding: '10px', border: '1px solid #ccc', background: '#f0f0f0' },
      classes: ['banner-widget'],
      content: 'Banner Component',
    },
    canvas: {
      tagName: 'div',
      attributes: { 'data-widget': 'canvas' },
      style: { width: '100%', height: '300px', border: '1px solid #ddd', background: '#fafafa' },
      classes: ['canvas-widget'],
      content: 'Canvas Component',
    },
    section: {
      tagName: 'section',
      classes: ['p-4', 'bg-slate-50', 'border', 'border-slate-300', 'rounded'],
      components: [],
    },
    header: {
      tagName: 'header',
      classes: ['header', 'dz-header'],
      components: [
        {
          tagName: 'div',
          classes: [
            'header-content',
            'flex',
            'items-center',
            'justify-between',
            'p-4',
            'bg-white',
            'shadow-sm',
          ],
          components: [
            {
              tagName: 'div',
              classes: ['header-brand', 'flex', 'items-center'],
              components: [
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['brand-link', 'text-xl', 'font-bold', 'text-gray-900'],
                  content: 'Your Brand',
                },
              ],
            },
            {
              tagName: 'nav',
              classes: ['header-nav', 'flex', 'items-center', 'space-x-6'],
              components: [
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['nav-link', 'text-gray-700'],
                  content: 'Home',
                },
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['nav-link', 'text-gray-700'],
                  content: 'About',
                },
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['nav-link', 'text-gray-700'],
                  content: 'Services',
                },
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['nav-link', 'text-gray-700'],
                  content: 'Contact',
                },
              ],
            },
            {
              tagName: 'div',
              classes: ['header-actions'],
              components: [
                {
                  tagName: 'button',
                  classes: [
                    'cta-button',
                    'px-4',
                    'py-2',
                    'bg-blue-600',
                    'text-white',
                    'rounded-md',
                  ],
                  content: 'Get Started',
                },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      tagName: 'footer',
      classes: ['footer', 'dz-footer'],
      components: [
        {
          tagName: 'div',
          classes: [
            'footer-top',
            'grid',
            'grid-cols-1',
            'md:grid-cols-4',
            'gap-8',
            'p-8',
            'bg-gray-900',
            'text-white',
          ],
          components: [
            {
              tagName: 'div',
              classes: ['footer-column'],
              components: [
                {
                  tagName: 'h3',
                  classes: ['footer-title', 'text-lg', 'font-bold', 'mb-4'],
                  content: 'About Us',
                },
                {
                  tagName: 'p',
                  classes: ['footer-text', 'text-gray-400', 'text-sm', 'mb-4'],
                  content: 'Your company description goes here.',
                },
              ],
            },
            {
              tagName: 'div',
              classes: ['footer-column'],
              components: [
                {
                  tagName: 'h3',
                  classes: ['footer-title', 'text-lg', 'font-bold', 'mb-4'],
                  content: 'Quick Links',
                },
                {
                  tagName: 'ul',
                  classes: ['footer-links', 'space-y-2'],
                  components: [
                    {
                      tagName: 'li',
                      components: [
                        {
                          tagName: 'a',
                          attributes: { href: '#' },
                          classes: ['footer-link', 'text-gray-400'],
                          content: 'Home',
                        },
                      ],
                    },
                    {
                      tagName: 'li',
                      components: [
                        {
                          tagName: 'a',
                          attributes: { href: '#' },
                          classes: ['footer-link', 'text-gray-400'],
                          content: 'About',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          tagName: 'div',
          classes: ['footer-bottom', 'border-t', 'border-gray-800', 'p-4', 'bg-gray-950'],
          components: [
            {
              tagName: 'div',
              classes: ['footer-bottom-content', 'flex', 'justify-between', 'items-center'],
              components: [
                {
                  tagName: 'p',
                  classes: ['footer-copyright', 'text-gray-400', 'text-sm'],
                  content: '© 2024 Your Company. All rights reserved.',
                },
              ],
            },
          ],
        },
      ],
    },
    main: {
      tagName: 'main',
      attributes: { id: 'site-content' },
      classes: ['main', 'dz-main'],
      components: [
        {
          tagName: 'h1',
          classes: ['main-title', 'dz-heading', 'text-3xl', 'font-bold', 'text-center', 'mb-4'],
          content: 'Begin each day by telling yourself',
        },
        {
          tagName: 'div',
          classes: [
            'main-metadata',
            'flex',
            'items-center',
            'justify-center',
            'gap-4',
            'text-sm',
            'text-gray-600',
            'mb-6',
          ],
          components: [
            {
              tagName: 'div',
              classes: ['metadata-item', 'flex', 'items-center', 'gap-1'],
              components: [
                {
                  tagName: 'span',
                  classes: ['metadata-icon'],
                  content: '👤',
                },
                {
                  tagName: 'span',
                  content: 'By admin',
                },
              ],
            },
            {
              tagName: 'div',
              classes: ['metadata-item', 'flex', 'items-center', 'gap-1'],
              components: [
                {
                  tagName: 'span',
                  classes: ['metadata-icon'],
                  content: '📅',
                },
                {
                  tagName: 'span',
                  content: 'December 31, 2020',
                },
              ],
            },
            {
              tagName: 'div',
              classes: ['metadata-item', 'flex', 'items-center', 'gap-1'],
              components: [
                {
                  tagName: 'span',
                  classes: ['metadata-icon'],
                  content: '💬',
                },
                {
                  tagName: 'span',
                  content: '0 Comments',
                },
              ],
            },
          ],
        },
        {
          tagName: 'div',
          classes: ['main-image-wrapper', 'mb-6'],
          components: [
            {
              tagName: 'div',
              classes: ['dz-image', 'image-placeholder'],
              style: {
                width: '100%',
                minHeight: '300px',
                background: '#f0f0f0',
                border: '2px dashed #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
              },
              content: 'Feature Image',
            },
          ],
        },
        {
          tagName: 'div',
          classes: ['main-content'],
          components: [
            {
              tagName: 'p',
              classes: ['main-text', 'dz-text', 'text-base', 'text-gray-700', 'mb-4'],
              content: 'Begin each day by telling yourself:',
            },
            {
              tagName: 'blockquote',
              classes: [
                'main-quote',
                'text-lg',
                'italic',
                'text-gray-600',
                'border-l-4',
                'border-blue-500',
                'pl-4',
              ],
              content: '"Today I shall be meeting with interference. inaratitude."',
            },
          ],
        },
      ],
    },
    a: {
      tagName: 'div',
      classes: ['p-4', 'bg-blue-50', 'rounded', 'border', 'border-blue-200'],
      components: [
        {
          tagName: 'h1',
          classes: ['text-2xl', 'font-bold', 'text-blue-700'],
          content: 'Tailwind A Component',
        },
        {
          tagName: 'p',
          classes: ['mt-2', 'text-sm', 'text-blue-600'],
          content: 'This is rendered with Tailwind utilities.',
        },
        {
          tagName: 'button',
          classes: [
            'mt-3',
            'px-3',
            'py-1',
            'bg-blue-500',
            'text-white',
            'rounded',
            'hover:bg-blue-600',
          ],
          content: 'Action',
        },
      ],
    },
    navbar: {
      tagName: 'div',
      classes: ['bg-white', 'shadow-sm'],
      components: [
        {
          tagName: 'div',
          classes: [
            'flex',
            'items-center',
            'justify-between',
            'p-4',
            'border-b',
            'border-gray-200',
          ],
          components: [
            {
              tagName: 'div',
              classes: ['flex', 'items-center'],
              components: [
                {
                  tagName: 'button',
                  classes: [
                    'px-4',
                    'py-2',
                    'bg-gray-100',
                    'text-gray-700',
                    'rounded-md',
                    'hover:bg-gray-200',
                  ],
                  content: 'Brand link',
                },
              ],
            },
          ],
        },
        {
          tagName: 'div',
          classes: ['flex', 'justify-center', 'p-3'],
          components: [
            {
              tagName: 'nav',
              classes: ['flex', 'space-x-6'],
              components: [
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['text-gray-700', 'hover:text-blue-600'],
                  content: 'Product',
                },
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['text-gray-700', 'hover:text-blue-600'],
                  content: 'Features',
                },
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['text-gray-700', 'hover:text-blue-600'],
                  content: 'Reviews',
                },
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['text-gray-700', 'hover:text-blue-600'],
                  content: 'Pricing',
                },
                {
                  tagName: 'a',
                  attributes: { href: '#' },
                  classes: ['text-gray-700', 'hover:text-blue-600'],
                  content: 'FAQ',
                },
              ],
            },
          ],
        },
      ],
    },
    row: {
      tagName: 'div',
      attributes: { 'data-widget': 'row' },
      classes: ['row'],
      components: [],
    },
    column: {
      tagName: 'div',
      attributes: { 'data-widget': 'column' },
      classes: ['column'],
      components: [],
    },
    heading: {
      tagName: 'h1',
      classes: ['text-2xl', 'font-bold', 'text-gray-900'],
      content: 'Heading text',
    },
    text: {
      tagName: 'p',
      classes: ['text-sm', 'text-gray-700'],
      content: 'Paragraph text',
    },
    '1-columns': {
      tagName: 'div',
      attributes: { 'data-widget': 'column' },
      classes: ['column'],
      components: [],
    },
    '2-columns': {
      tagName: 'div',
      attributes: { 'data-widget': 'row' },
      classes: ['row'],
      components: [
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          components: [],
        },
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          components: [],
        },
      ],
    },
    '3-columns': {
      tagName: 'div',
      attributes: { 'data-widget': 'row' },
      classes: ['row'],
      components: [
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          components: [],
        },
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          components: [],
        },
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          components: [],
        },
      ],
    },
    '2-columns-3-7': {
      tagName: 'div',
      attributes: { 'data-widget': 'row' },
      classes: ['row'],
      components: [
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          style: { width: '30%' },
          components: [],
        },
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          style: { width: '70%' },
          components: [],
        },
      ],
    },
    image: {
      tagName: 'div',
      attributes: { 'data-widget': 'image' },
      classes: ['image-widget'],
      components: [],
    },
    video: {
      tagName: 'div',
      attributes: { 'data-widget': 'video' },
      classes: ['video-widget'],
      components: [],
    },
    list: {
      tagName: 'ul',
      attributes: { 'data-widget': 'list' },
      classes: ['list', 'space-y-2', 'list-none', 'p-0', 'm-0'],
      components: [
        {
          tagName: 'li',
          classes: [
            'p-3',
            'bg-white',
            'border',
            'border-gray-200',
            'rounded-md',
            'hover:bg-gray-50',
          ],
          content: 'List item 1',
        },
        {
          tagName: 'li',
          classes: [
            'p-3',
            'bg-white',
            'border',
            'border-gray-200',
            'rounded-md',
            'hover:bg-gray-50',
          ],
          content: 'List item 2',
        },
        {
          tagName: 'li',
          classes: [
            'p-3',
            'bg-white',
            'border',
            'border-gray-200',
            'rounded-md',
            'hover:bg-gray-50',
          ],
          content: 'List item 3',
        },
      ],
    },
    card: {
      tagName: 'div',
      attributes: { 'data-widget': 'card' },
      classes: ['card-widget'],
      components: [],
    },
    'voucher-carousel': {
      tagName: 'div',
      attributes: { 'data-widget': 'voucher-carousel' },
      style: { width: '100%' },
      components: [],
    },
    voucher: {
      tagName: 'div',
      attributes: { 'data-widget': 'voucher' },
      components: [],
    },
    'product-card': {
      tagName: 'div',
      attributes: { 'data-widget': 'product-card' },
      classes: ['product-card'],
      components: [],
    },
    'product-carousel': {
      tagName: 'div',
      attributes: { 'data-widget': 'product-carousel' },
      classes: ['product-carousel'],
      components: [],
    },
    pagination: {
      tagName: 'div',
      attributes: { 'data-widget': 'pagination' },
      classes: ['pagination'],
      components: [],
    },
    'discount-badge': {
      tagName: 'div',
      attributes: { 'data-widget': 'discount-badge' },
      classes: ['discount-badge'],
      components: [],
    },
    rating: {
      tagName: 'div',
      attributes: { 'data-widget': 'rating' },
      classes: ['rating'],
      components: [],
    },
    'price-display': {
      tagName: 'div',
      attributes: { 'data-widget': 'price-display' },
      classes: ['price-display'],
      components: [],
    },
    'category-nav-item': {
      tagName: 'div',
      attributes: { 'data-widget': 'category-nav-item' },
      classes: ['category-nav-item'],
      components: [],
    },
    'add-to-cart-button': {
      tagName: 'button',
      attributes: { 'data-widget': 'add-to-cart-button' },
      classes: ['add-to-cart-button'],
      components: [],
    },
    'category-product-carousel': {
      tagName: 'div',
      attributes: { 'data-widget': 'category-product-carousel' },
      classes: ['category-product-carousel'],
      components: [],
    },
    'dynamic-category-tabs': {
      tagName: 'div',
      attributes: { 'data-widget': 'dynamic-category-tabs' },
      classes: ['dynamic-category-tabs'],
      components: [],
    },
    'tab-panel': {
      tagName: 'div',
      attributes: { 'data-widget': 'tab-panel' },
      classes: ['tab-panel'],
      components: [],
    },
  };

  readonly defaultBlocks: BlockModel[] = [
    new BlockModel({
      id: 'block-1',
      label: 'Heading',
      category: 'Text',
      content: '<h1>Heading Text</h1>',
    }),
    new BlockModel({
      id: 'block-2',
      label: 'Paragraph',
      category: 'Text',
      content: '<p>Paragraph text here</p>',
    }),
    new BlockModel({
      id: 'block-3',
      label: 'Button',
      category: 'Components',
      content: '<button>Click Me</button>',
    }),
    new BlockModel({
      id: 'block-4',
      label: 'Container',
      category: 'Layout',
      content: '<div style="padding: 20px; border: 1px solid #ccc;">Container</div>',
    }),
  ];
}
