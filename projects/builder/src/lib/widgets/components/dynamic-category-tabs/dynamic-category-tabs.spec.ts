import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicCategoryTabs } from './dynamic-category-tabs';

describe('DynamicCategoryTabs', () => {
  let component: DynamicCategoryTabs;
  let fixture: ComponentFixture<DynamicCategoryTabs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicCategoryTabs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicCategoryTabs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
