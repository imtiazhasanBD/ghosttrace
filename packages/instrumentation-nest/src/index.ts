import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Module,
  Global,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { trace, SpanKind, SpanStatusCode, context } from '@opentelemetry/api';

@Injectable()
export class GhostTraceInterceptor implements NestInterceptor {
  private readonly tracer = trace.getTracer('@ghosttrace/instrumentation-nest');

  intercept(execContext: ExecutionContext, next: CallHandler): Observable<any> {
    if (execContext.getType() !== 'http') {
      return next.handle();
    }

    const http = execContext.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const method = req.method || 'GET';
    const path = req.route ? req.route.path : req.path || req.url || '/';
    const spanName = `HTTP ${method} ${path}`;

    const span = this.tracer.startSpan(
      spanName,
      {
        kind: SpanKind.SERVER,
        attributes: {
          'http.method': method,
          'http.url': req.originalUrl || req.url,
          'http.route': path,
          'http.user_agent': req.headers ? req.headers['user-agent'] : undefined,
          'http.host': req.headers ? req.headers.host : undefined,
        },
      },
      context.active(),
    );

    const activeCtx = trace.setSpan(context.active(), span);

    return context.with(activeCtx, () => {
      return next.handle().pipe(
        tap({
          next: () => {
            const statusCode = res.statusCode || 200;
            span.setAttribute('http.status_code', statusCode);
            if (statusCode >= 400) {
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: `HTTP ${statusCode}`,
              });
            } else {
              span.setStatus({ code: SpanStatusCode.OK });
            }
            span.end();
          },
          error: (err: any) => {
            const statusCode = err.status || err.statusCode || 500;
            span.setAttribute('http.status_code', statusCode);
            span.recordException(err);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: err.message || 'Internal Server Error',
            });
            span.end();
          },
        }),
      );
    });
  }
}

@Global()
@Module({
  providers: [
    GhostTraceInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: GhostTraceInterceptor,
    },
  ],
  exports: [GhostTraceInterceptor],
})
export class GhostTraceNestModule {}
