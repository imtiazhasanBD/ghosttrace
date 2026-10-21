import { trace, SpanKind, SpanStatusCode, context } from '@opentelemetry/api';
import { redactSql } from '@ghosttrace/shared-types';

export function ghostTracePrismaExtension() {
  const tracer = trace.getTracer('@ghosttrace/instrumentation-prisma');

  return {
    name: 'ghosttrace-instrumentation',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          const isRaw = !model || operation?.toLowerCase().includes('raw');
          const spanName = `prisma.${model || 'raw'}.${operation}`;

          const attributes: Record<string, any> = {
            'db.system': 'postgresql',
            'db.operation': operation,
            'db.sql.table': model || 'raw',
          };

          if (isRaw && args) {
            let rawQuery: string | null = null;
            if (typeof args === 'string') {
              rawQuery = args;
            } else if (Array.isArray(args?.strings)) {
              rawQuery = args.strings.join('?');
            } else if (args?.query && typeof args.query === 'string') {
              rawQuery = args.query;
            }

            if (rawQuery) {
              attributes['db.statement'] = redactSql(rawQuery);
            }
          }

          const span = tracer.startSpan(
            spanName,
            {
              kind: SpanKind.CLIENT,
              attributes,
            },
            context.active(),
          );

          const activeCtx = trace.setSpan(context.active(), span);

          return context.with(activeCtx, async () => {
            try {
              const result = await query(args);
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
        },
      },
    },
  };
}

export function attachGhostTracePrismaMiddleware(prismaClient: any) {
  const tracer = trace.getTracer('@ghosttrace/instrumentation-prisma');

  // If $use is available (Prisma Client Middleware)
  if (typeof prismaClient.$use === 'function') {
    prismaClient.$use(async (params: any, next: (params: any) => Promise<any>) => {
      const isRaw = !params.model || params.action?.toLowerCase().includes('raw');
      const spanName = `prisma.${params.model || 'raw'}.${params.action}`;

      const attributes: Record<string, any> = {
        'db.system': 'postgresql',
        'db.operation': params.action,
        'db.sql.table': params.model || 'raw',
      };

      // Safely extract raw SQL query if present
      if (isRaw && params.args) {
        let rawQuery: string | null = null;
        if (typeof params.args === 'string') {
          rawQuery = params.args;
        } else if (Array.isArray(params.args?.strings)) {
          rawQuery = params.args.strings.join('?');
        } else if (params.args?.query && typeof params.args.query === 'string') {
          rawQuery = params.args.query;
        }

        if (rawQuery) {
          attributes['db.statement'] = redactSql(rawQuery);
        }
      }

      const span = tracer.startSpan(
        spanName,
        {
          kind: SpanKind.CLIENT,
          attributes,
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
