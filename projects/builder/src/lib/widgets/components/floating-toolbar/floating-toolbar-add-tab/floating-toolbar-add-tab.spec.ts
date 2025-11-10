import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingToolbarAddTab } from './floating-toolbar-add-tab';

describe('FloatingToolbarAddTab', () => {
  let component: FloatingToolbarAddTab;
  let fixture: ComponentFixture<FloatingToolbarAddTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingToolbarAddTab]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingToolbarAddTab);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
