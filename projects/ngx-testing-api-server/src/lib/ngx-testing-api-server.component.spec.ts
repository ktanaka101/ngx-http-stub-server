import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxTestingApiServerComponent } from './ngx-testing-api-server.component';

describe('NgxTestingApiServerComponent', () => {
  let component: NgxTestingApiServerComponent;
  let fixture: ComponentFixture<NgxTestingApiServerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgxTestingApiServerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxTestingApiServerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
