import {
  HttpBackend,
  HttpErrorResponse,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import {
  HttpClientStubBackend,
  HttpClientStubBackendController,
} from './ngx-http-stub-server';

export function setupTestingServer<TState>(
  initialState: TState,
  ...handlers: ApiHandler<TState>[]
) {
  const server = new HttpClientStubBackend<TState>();
  server.initialize(initialState, handlers);
  const controller = new HttpClientStubBackendController<TState>(server);

  return {
    server,
    provideHttpClientTestingBackend: () => {
      return [
        HttpClientStubBackend,
        {
          provide: HttpBackend,
          useValue: server,
        },
        {
          provide: HttpClientStubBackendController,
          useValue: controller,
        },
      ];
    },
  };
}

export type HttpMethod =
  | 'HEAD'
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS';

export class ApiHandler<TState> {
  constructor(
    public method: HttpMethod,
    public url: string,
    public handle: (
      req: HttpRequest<unknown>,
      res: typeof responseBuilder,
      state: TState
    ) => HttpResponse<unknown> | HttpErrorResponse
  ) {}
}

export type HandlerFn<TState> = (
  req: HttpRequest<unknown>,
  res: typeof responseBuilder,
  state: TState
) => HttpResponse<unknown> | HttpErrorResponse;

export const handlerBuilder = {
  head: <TState>(
    path: string,
    handler: HandlerFn<TState>
  ): ApiHandler<TState> => {
    return new ApiHandler('HEAD', path, handler);
  },
  get: <TState>(
    path: string,
    handler: HandlerFn<TState>
  ): ApiHandler<TState> => {
    return new ApiHandler('GET', path, handler);
  },
  post: <TState>(
    path: string,
    handler: HandlerFn<TState>
  ): ApiHandler<TState> => {
    return new ApiHandler('POST', path, handler);
  },
  put: <TState>(
    path: string,
    handler: HandlerFn<TState>
  ): ApiHandler<TState> => {
    return new ApiHandler('PUT', path, handler);
  },
  delete: <TState>(
    path: string,
    handler: HandlerFn<TState>
  ): ApiHandler<TState> => {
    return new ApiHandler('DELETE', path, handler);
  },
  patch: <TState>(
    path: string,
    handler: HandlerFn<TState>
  ): ApiHandler<TState> => {
    return new ApiHandler('PATCH', path, handler);
  },
  options: <TState>(
    path: string,
    handler: HandlerFn<TState>
  ): ApiHandler<TState> => {
    return new ApiHandler('OPTIONS', path, handler);
  },
};

export const responseBuilder = {
  ok: <T>(params: { body: T; status: number }): HttpResponse<T> => {
    return new HttpResponse({
      body: params.body,
      status: params.status,
    });
  },
  error: (params: { body: string; status: number }): HttpErrorResponse => {
    return new HttpErrorResponse({
      error: params.body,
      status: params.status,
    });
  },
};
