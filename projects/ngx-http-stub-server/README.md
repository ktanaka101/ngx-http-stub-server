# Angular HTTP Stub Server

## Summary

This library provides a simple and effective way to stub responses for Angular's HTTP client. With this library, you can define stub handlers for each URL/HTTP method and return any stub response you want. Additionally, you can create stateful stubs that can mimic server behavior.

## Features

- Define stub handlers for each URL/HTTP method and return any desired stub response
- Define stubs before the HTTP request occurs
  Unlike Angular's official HttpTestingController, which only allows stubbing after the HTTP request is initiated, this library enables you to define stubs before the request occurs, making it possible to create more flexible and robust tests.
- Change stub handlers during a test case
- Create stateful stubs that mimic server behavior
- Have state per test case, eliminating any conflicts when running test cases in parallel.

## Example

```typescript
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { lastValueFrom } from 'rxjs';
import { handlerBuilder, HttpClientStubBackendController, setupStubServer } from 'ngx-http-stub-server';

@Injectable({
  providedIn: 'root',
})
class DummyService {
  constructor(private httpClient: HttpClient) {}

  getUsers(): Promise<User[]> {
    return lastValueFrom(this.httpClient.get<User[]>('/users'));
  }

  getProjects(): Promise<Project[]> {
    return lastValueFrom(this.httpClient.get<Project[]>('/projects'));
  }
}

type User = {
  id: number;
  name: string;
};
type Project = {
  id: number;
  name: string;
  users: User[];
};

type ServerState = {
  users: {
    id: number;
    name: string;
  }[];
  projects: {
    id: number;
    name: string;
    userIds: number[];
  }[];
};

describe('HttpStubServer', () => {
  let service: DummyService;
  let backendController: HttpClientStubBackendController<ServerState>;

  beforeEach(() => {
    const server = setupStubServer<ServerState>(
      // Deifne initial state
      {
        users: [
          {
            id: 1,
            name: 'Alice',
          },
          {
            id: 2,
            name: 'Bob',
          },
        ],
        projects: [
          {
            id: 1,
            name: 'Project A',
            userIds: [1, 2],
          },
          {
            id: 2,
            name: 'Project B',
            userIds: [],
          },
        ],
      },
      // Define handlers
      handlerBuilder.get('/users', (_req, res, state) => {
        return res.ok({
          body: state.users,
          status: 200,
        });
      }),
      handlerBuilder.get('/projects', (_req, res, state) => {
        return res.ok({
          body: state.projects.map((project) => ({
            id: project.id,
            name: project.name,
            users: state.users.filter((user) =>
              project.userIds.includes(user.id)
            ),
          })),
          status: 200,
        });
      })
    );

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), server.provideHttpClientStubBackend()],
    });
    service = TestBed.inject(DummyService);
    backendController = TestBed.inject(HttpClientStubBackendController);
  });

  it('Get a stub value', fakeAsync(() => {
    let actualUsers = null as User[] | null;
    service.getUsers().then((users) => {
      actualUsers = users;
    });
    let actualProjects = null as Project[] | null;
    service.getProjects().then((projects) => {
      actualProjects = projects;
    });
    tick();

    expect(actualUsers).toEqual([
      {
        id: 1,
        name: 'Alice',
      },
      {
        id: 2,
        name: 'Bob',
      },
    ]);

    expect(actualProjects).toEqual([
      {
        id: 1,
        name: 'Project A',
        users: [
          {
            id: 1,
            name: 'Alice',
          },
          {
            id: 2,
            name: 'Bob',
          },
        ],
      },
      {
        id: 2,
        name: 'Project B',
        users: [],
      },
    ]);
  }));

  it('Update handler', fakeAsync(() => {
    backendController.putHandlers(
      handlerBuilder.get('/users', (_req, res, _state) => {
        return res.ok({
          body: [
            {
              id: 100,
              name: 'Put User',
            },
          ],
          status: 200,
        });
      }),
      handlerBuilder.get('/projects', (_req, res, _state) => {
        return res.ok({
          body: [
            {
              id: 1000,
              name: 'Put Project',
              users: [
                {
                  id: 100,
                  name: 'Put User',
                },
              ],
            },
          ],
          status: 200,
        });
      })
    );
  });
});
```

## Support angular

- Angular >= 15

## Build

Run `ng build ngx-http-stub-server` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test ngx-http-stub-server` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
