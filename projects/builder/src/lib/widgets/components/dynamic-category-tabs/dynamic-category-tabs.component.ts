import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  ViewChildren,
  QueryList,
  ViewContainerRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService } from '../../../core/modal-dialog/modal.service';
import { TabEditModalComponent } from '../../modals/tab-edit-modal/tab-edit-modal.component';
import { TabPanelComponent } from '../tab-panel/tab-panel.component';

export interface DynamicTab {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-dynamic-category-tabs',
  standalone: true,
  imports: [CommonModule, TabPanelComponent],
  template: `
    <div class="w-full">
      <img
        src="x"
        style="display:none"
        onerror="
        if (!window.selectPreviewTab) {
          window.selectPreviewTab = function (clickedTab, event) {
            if (event) {
              event.preventDefault();
              event.stopPropagation();
            }
            const componentRoot = clickedTab.closest('app-dynamic-category-tabs');
            if (!componentRoot) return;
            const tabId = clickedTab.getAttribute('data-tab-id');
            if (!tabId) return;
            const tabs = componentRoot.querySelectorAll('[data-tab-id]');
            const panels = componentRoot.querySelectorAll('[data-panel-id]');
            tabs.forEach(t => {
              if (t.getAttribute('data-tab-id') === tabId) {
                t.classList.add('active');
              } else {
                t.classList.remove('active');
              }
            });
            panels.forEach(panel => {
              const panelEl = panel.firstElementChild;
              if (panel.getAttribute('data-panel-id') === tabId) {
                panel.removeAttribute('hidden');
                if (panelEl) panelEl.removeAttribute('hidden');
              } else {
                panel.setAttribute('hidden', 'true');
                if (panelEl) panelEl.setAttribute('hidden', 'true');
              }
            });
          };
        }
      "
      />
      <div class="flex flex-wrap gap-4 p-4 bg-white rounded-xl">
        @for (tab of tabs; track tab.id) {
        <div
          class="group flex flex-col items-center justify-center w-[120px] h-20 p-2 border-2 border-gray-100 rounded-xl bg-white cursor-pointer transition-all duration-200 ease-in-out text-center hover:border-pink-500 hover:shadow-lg hover:-translate-y-0.5"
          [class.active]="activeTabId === tab.id"
          (mousedown)="selectTab(tab.id, $any($event))"
          onclick="window.selectPreviewTab && window.selectPreviewTab(this, event)"
          [attr.data-tab-id]="tab.id"
        >
          <div class="text-[28px] leading-none mb-2">
            <img
              [src]="tab.icon"
              alt=""
              onError="this.style.display='none'"
              class="max-w-[32px] max-h-[32px] object-contain"
            />
            {{ tab.icon.includes('/') ? '' : tab.icon }}
          </div>
          <div
            class="text-sm font-medium text-gray-800 leading-tight group-[.active]:text-white group-[.active]:font-semibold"
          >
            {{ tab.label }}
          </div>
        </div>
        }
        <div
          class="flex flex-col items-center justify-center w-[120px] h-20 p-2 rounded-xl cursor-pointer transition-all duration-200 ease-in-out text-center border-2 border-dashed border-gray-300 hover:border-pink-500 hover:text-pink-500"
          (mousedown)="addNewTab($any($event))"
        >
          <div class="text-[28px] leading-none mb-2">➕</div>
          <div class="text-sm font-medium leading-tight">Thêm mới</div>
        </div>
      </div>

      <div class="mt-5 min-h-[100px] border-2 border-dashed border-gray-300 p-4 rounded-xl">
        @for (tab of tabs; track tab.id) {
        <app-tab-panel
          [tabId]="tab.id"
          [active]="activeTabId === tab.id"
          [hidden]="activeTabId !== tab.id"
          [attr.data-panel-id]="tab.id"
        >
        </app-tab-panel>
        }
      </div>
    </div>
  `,
})
export class DynamicCategoryTabsComponent {
  private modalService = inject(ModalService);

  @ViewChildren(TabPanelComponent)
  private panelRefs!: QueryList<TabPanelComponent>;

  @Input() tabs: DynamicTab[] = [
    {
      id: '1',
      label: 'Tất Cả',
      icon: 'https://concung.com/img/res/v4/mc-menu-icon/all-cate-icon.png',
    },
    {
      id: '2',
      label: 'Tã, Bỉm',
      icon: 'https://concung.com/img/res/v4/mc-menu-icon/ta-bim-icon.png',
    },
  ];
  @Input() activeTabId: string = '1';

  @Output() tabSelected = new EventEmitter<string>();
  @Output() tabsChanged = new EventEmitter<DynamicTab[]>();

  selectTab(tabId: string, event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.activeTabId === tabId) return;

    this.activeTabId = tabId;
    this.tabSelected.emit(tabId);
  }

  addNewTab(event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.modalService.open({
      contentComponent: TabEditModalComponent,
      title: 'Thêm Tab Mới',
      data: {
        onSave: (newTab: DynamicTab) => {
          this.tabs = [...this.tabs, newTab];
          this.tabsChanged.emit(this.tabs);
          this.selectTab(newTab.id);
        },
      },
    });
  }

  getChildContainer(): ViewContainerRef | undefined {
    const activePanel = this.panelRefs.find((p) => p.tabId === this.activeTabId);
    return activePanel?.getChildContainer();
  }
}
