import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabEditModal } from './tab-edit-modal';

describe('TabEditModal', () => {
  let component: TabEditModal;
  let fixture: ComponentFixture<TabEditModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabEditModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabEditModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
