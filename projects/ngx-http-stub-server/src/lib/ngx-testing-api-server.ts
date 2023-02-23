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

@Injectable()
export class HttpClientTestingBackendController<TState> {
  constructor(private backend: HttpClientTestingBackend<TState>) {}

  putHandlers(...handlers: ApiHandler<TState>[]): void {
    this.backend.putHandlers(...handlers);
  }
}

@Injectable()
export class HttpClientTestingBackend<TState> implements HttpBackend {
  private apiHandlers!: ApiHandlers<TState>;
  private state!: TState;

  initialize(newState: TState, handlers: ApiHandler<TState>[]): void {
    this.state = newState;
    this.apiHandlers = new ApiHandlers(handlers);
  }

  putHandlers(...handlers: ApiHandler<TState>[]): void {
    for (const handler of handlers) {
      this.apiHandlers.put(handler);
    }
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
