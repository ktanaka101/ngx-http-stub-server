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

/**
 * Setup a stub server.
 *
 * @param initialState The initial state of the server.
 * @param handlers The handlers to be used by the backend.
 * @returns The server controller and the provider function.
 */
export function setupStubServer<TState>(
  initialState: TState,
  ...handlers: ApiHandler<TState>[]
) {
  const server = new HttpClientStubBackend<TState>();
  server.initialize(initialState, handlers);
  const controller = new HttpClientStubBackendController<TState>(server);

  return {
    server,
    provideHttpClientStubBackend: () => {
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

/**
 * A builder for creating handlers.
 *
 * @example
 *   const handler = handlerBuilder.get('/users', (req, res, state) => {
 *     return res.ok({
 *       body: state.users,
 *       status: 200,
 *     });
 *   });
 */
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

/**
 * A builder for creating responses.
 */
export const responseBuilder = {
  /**
   * Create a new HttpResponse with the given parameters.
   *
   * @param params The parameters to create the response.
   * @returns The created response.
   */
  ok: <T>(params: { body: T; status: number }): HttpResponse<T> => {
    return new HttpResponse({
      body: params.body,
      status: params.status,
    });
  },

  /**
   * Create a new HttpErrorResponse with the given parameters.
   *
   * @param params The parameters to create the response.
   * @returns The created response.
   */
  error: (params: { body: string; status: number }): HttpErrorResponse => {
    return new HttpErrorResponse({
      error: params.body,
      status: params.status,
    });
  },
};
