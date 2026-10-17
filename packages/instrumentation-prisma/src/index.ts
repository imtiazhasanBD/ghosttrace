import { trace, SpanKind, SpanStatusCode, context } from '@opentelemetry/api';

export function attachGhostTracePrismaMiddleware(prismaClient: any) {
  const tracer = trace.getTracer('@ghosttrace/instrumentation-prisma');

  // If $use is available (Prisma Client Middleware)
  if (typeof prismaClient.$use === 'function') {
    prismaClient.$use(async (params: any, next: (params: any) => Promise<any>) => {
      const spanName = `prisma.${params.model || 'raw'}.${params.action}`;
      const span = tracer.startSpan(
        spanName,
        {
          kind: SpanKind.CLIENT,
          attributes: {
            'db.system': 'postgresql',
            'db.operation': params.action,
            'db.sql.table': params.model || 'raw',
          },
        },
        context.active(),
      );

      const activeCtx = trace.setSpan(context.active(), span);

      return context.with(activeCtx, async () => {
        try {
          const result = await next(params);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error: any) {
          span.recordException(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message || 'Prisma query error',
          });
          throw error;
        } finally {
          span.end();
        }
      });
    });
  }

  return prismaClient;
}
