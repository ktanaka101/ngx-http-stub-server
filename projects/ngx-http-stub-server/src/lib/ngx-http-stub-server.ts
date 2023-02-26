import {
  HttpBackend,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiHandler, HttpMethod, responseBuilder } from './handler';
import clone from 'clone';

/**
 * This class is used to control the HttpClientStubBackend.
 * It is used to put handlers and reset the state.
 */
@Injectable()
export class HttpClientStubBackendController<TState> {
  constructor(private backend: HttpClientStubBackend<TState>) {}

  /**
   * If a handler with matching HTTP method and URL exists, overwrite that handler.
   * If it doesn't exist, just add it.
   *
   * @param handlers The handlers to be used by the backend.
   *
   * @example
   *   const server = setupStubServer<{}>(
   *     {},
   *     handlerBuilder.get('/users', (_req, res, _state) => {
   *       return res.ok({
   *         body: 'Original body',
   *         status: 200,
   *       });
   *     }),
   *   );
   *   // get `/users` will return 'Original body'.
   *
   *   server.controller.putHandler(
   *     handlerBuilder.get('/users', (_req, res, _state) => {
   *       return res.ok({
   *         body: 'Override body',
   *         status: 200,
   *       })
   *     })
   *   );
   *   // get `/users` will return 'Override body'.
   */
  putHandlers(...handlers: ApiHandler<TState>[]): void {
    this.backend.putHandlers(...handlers);
  }

  /**
   * Initialize the backend with the initial handlers.
   *
   * @example
   *   const server = setupStubServer<{}>(
   *     {},
   *     handlerBuilder.get('/users', (_req, res, _state) => {
   *       return res.ok({
   *         body: 'Original body',
   *         status: 200,
   *       });
   *     }),
   *   );
   *   server.controller.putHandler(
   *     handlerBuilder.get('/users', (_req, res, _state) => {
   *       return res.ok({
   *         body: 'Override body',
   *         status: 200,
   *       })
   *     })
   *   );
   *   // get `/users` will return 'Override body'.
   *
   *   server.controller.resetHandlers();
   *   // get `/users` will return 'Original body'.
   */
  resetHandlers(): void {
    this.backend.resetHandlers();
  }

  /**
   * Reset the state of the backend.
   *
   * @example
   *   const server = setupStubServer<{}>(
   *     {},
   *     handlerBuilder.get('/users', (_req, res, state) => {
   *       const response = res.ok({
   *         body: state,
   *         status: 200,
   *       });
   *       state = { overide: 100 };
   *
   *       return response;
   *     }),
   *   );
   *   // First time, get `/users` will return `{}`.
   *   // Second time, get `/users` will return `{ overide: 100 }`.
   *
   *   server.controller.resetState();
   *   // get `/users` will return `{}`.
   */
  resetState(): void {
    this.backend.resetState();
  }
}

@Injectable()
export class HttpClientStubBackend<TState> implements HttpBackend {
  private apiHandlers!: ApiHandlers<TState>;
  private state!: TState;

  private initialState!: TState;
  private initialHandlers!: ApiHandlers<TState>;

  initialize(newState: TState, handlers: ApiHandler<TState>[]): void {
    this.state = clone(newState);
    this.initialState = clone(newState);

    this.apiHandlers = new ApiHandlers(clone(handlers));
    this.initialHandlers = clone(this.apiHandlers);
  }

  putHandlers(...handlers: ApiHandler<TState>[]): void {
    for (const handler of handlers) {
      this.apiHandlers.put(handler);
    }
  }

  resetHandlers(): void {
    this.apiHandlers = clone(this.initialHandlers);
  }

  resetState(): void {
    this.state = clone(this.initialState);
  }

  handle(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    const handler = this.apiHandlers.match(req.method, req.url);
    if (handler === undefined) {
      throw new Error('No handler found for this request');
    }

    return new Observable((observer) => {
      const stubResponse = handler.handle(req, responseBuilder, this.state);
      observer.next({ type: HttpEventType.Sent });

      const statusOk = stubResponse.status >= 200 && stubResponse.status < 300;
      if (stubResponse instanceof HttpResponse) {
        if (!statusOk) {
          throw new Error(
            "Invalid response. It's not an error but status is not OK"
          );
        }
        observer.next(stubResponse);
        observer.complete();
      } else if (stubResponse instanceof HttpErrorResponse) {
        if (statusOk) {
          throw new Error("Invalid response. It's an error but status is OK");
        }

        observer.error(stubResponse);
      } else {
        throw new Error(`Invalid response. ${stubResponse}`);
      }

      return undefined;
    });
  }
}

class ApiHandlers<TState> {
  private handlersByMethod = {
    HEAD: [] as ApiHandler<TState>[],
    GET: [] as ApiHandler<TState>[],
    POST: [] as ApiHandler<TState>[],
    PUT: [] as ApiHandler<TState>[],
    DELETE: [] as ApiHandler<TState>[],
    PATCH: [] as ApiHandler<TState>[],
    OPTIONS: [] as ApiHandler<TState>[],
  };

  constructor(handlers: ApiHandler<TState>[]) {
    for (const handler of handlers) {
      this.put(handler);
    }
  }

  put(handler: ApiHandler<TState>): void {
    const handlers = this.handlersByMethod[handler.method];
    if (handlers === undefined) {
      throw new Error(`Invalid method: ${handler.method}`);
    }

    const index = handlers.findIndex((h) => h.url === handler.url);
    if (index === -1) {
      handlers.push(handler);
    } else {
      handlers[index] = handler;
    }
  }

  match(method: string, url: string): ApiHandler<TState> | undefined {
    const handlers = this.handlersByMethod[method as HttpMethod];
    if (handlers === undefined) {
      return undefined;
    }

    return handlers.find((h) => h.url === url);
  }
}
