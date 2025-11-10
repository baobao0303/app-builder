import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../../core/modal-dialog/modal.service';
import { DynamicTab } from '../../components/dynamic-category-tabs/dynamic-category-tabs.component';

@Component({
  selector: 'app-tab-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tab-edit-modal">
      <form (ngSubmit)="save()">
        <div class="form-group">
          <label for="tab-label">Tên Tab</label>
          <input id="tab-label" type="text" [(ngModel)]="tab.label" name="label" required>
        </div>
        <div class="form-group">
          <label for="tab-icon">Icon (URL hoặc Emoji)</label>
          <input id="tab-icon" type="text" [(ngModel)]="tab.icon" name="icon" required>
          <!-- Tùy chọn: Thêm nút để mở modal chọn ảnh -->
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" (click)="close()">Hủy</button>
          <button type="submit" class="btn-save">Lưu</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .tab-edit-modal {
      padding: 20px;
      min-width: 400px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-group label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: #333;
    }
    .form-group input {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    .modal-actions button {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .btn-cancel {
      background-color: #f1f1f1;
      color: #555;
    }
    .btn-cancel:hover { background-color: #e5e5e5; }
    .btn-save {
      background-color: #e83e8c;
      color: #fff;
    }
    .btn-save:hover { background-color: #d1327b; }
  `]
})
export class TabEditModalComponent implements OnInit {
  private modalService = inject(ModalService);

  tab: Partial<DynamicTab> = { label: '', icon: '' };
  onSave?: (newTab: DynamicTab) => void;

  ngOnInit(): void {
    const state = this.modalService.getState();
    if (state?.data) {
      // Nếu có dữ liệu truyền vào (để sửa), gán nó vào tab
      this.tab = { ...state.data.tab }; 
      this.onSave = state.data.onSave;
    }
  }

  save(): void {
    if (this.tab.label && this.tab.icon) {
      if (this.onSave) {
        // Tạo ID ngẫu nhiên cho tab mới
        const newTab: DynamicTab = {
          id: this.tab.id || `tab-${Date.now()}`,
          label: this.tab.label,
          icon: this.tab.icon,
        };
        this.onSave(newTab);
      }
      this.close();
    }
  }

  close(): void {
    this.modalService.close();
  }
}



