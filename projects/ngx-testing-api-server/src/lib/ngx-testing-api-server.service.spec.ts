import { TestBed } from '@angular/core/testing';

import { NgxTestingApiServerService } from './ngx-testing-api-server.service';

describe('NgxTestingApiServerService', () => {
  let service: NgxTestingApiServerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxTestingApiServerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
