import { HttpClient, provideHttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { lastValueFrom } from 'rxjs';
import { handlerBuilder, setupStubServer } from './handler';
import { HttpClientStubBackendController } from './ngx-http-stub-server';

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

describe('HttpClientStubBackend', () => {
  let service: DummyService;
  let backendController: HttpClientStubBackendController<ServerState>;

  beforeEach(() => {
    const server = setupStubServer<ServerState>(
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

  it('Put handler', fakeAsync(() => {
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
        id: 100,
        name: 'Put User',
      },
    ]);

    expect(actualProjects).toEqual([
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
    ]);
  }));

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

  it('Reset state', fakeAsync(() => {
    backendController.putHandlers(
      handlerBuilder.get('/users', (_req, res, state) => {
        state.users.push({
          id: 1000,
          name: 'override User',
        });
        return res.ok({
          body: state.users,
          status: 200,
        });
      })
    );

    let actualUsers = null as User[] | null;
    service.getUsers().then((users) => {
      actualUsers = users;
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
      {
        id: 1000,
        name: 'override User',
      },
    ]);

    backendController.resetState();
    service.getUsers().then((users) => {
      actualUsers = users;
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
      {
        id: 1000,
        name: 'override User',
      },
    ]);
  }));

  it('Reset handlers', fakeAsync(() => {
    backendController.putHandlers(
      handlerBuilder.get('/users', (_req, res, _state) => {
        return res.ok({
          body: [
            {
              id: 1000,
              name: 'override User',
            },
          ],
          status: 200,
        });
      })
    );

    let actualUsers = null as User[] | null;
    service.getUsers().then((users) => {
      actualUsers = users;
    });
    tick();
    expect(actualUsers).toEqual([
      {
        id: 1000,
        name: 'override User',
      },
    ]);

    backendController.resetHandlers();
    service.getUsers().then((users) => {
      actualUsers = users;
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
  }));
});
