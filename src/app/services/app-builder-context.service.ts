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
    '1-columns': RowComponent,
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
      attributes: { 'data-widget': 'row' },
      classes: ['row'],
      components: [
        {
          tagName: 'div',
          attributes: { 'data-widget': 'column' },
          classes: ['column'],
          components: [],
        },
      ],
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
