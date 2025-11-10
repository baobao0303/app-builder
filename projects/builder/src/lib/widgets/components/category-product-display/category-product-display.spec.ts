import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryProductDisplay } from './category-product-display';

describe('CategoryProductDisplay', () => {
  let component: CategoryProductDisplay;
  let fixture: ComponentFixture<CategoryProductDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryProductDisplay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryProductDisplay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
