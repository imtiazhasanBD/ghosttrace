import { TracesService } from './traces.service';
import { formatSql, redactSql, parseDatabaseSpanInfo } from '@ghosttrace/shared-types';

describe('TracesService - Slow Query Analyzer Unit Tests', () => {
  let service: TracesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      span: {
        count: jest.fn().mockResolvedValue(2),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'span-db-1',
            traceId: 'trace-11111111111111111111111111111111',
            projectId: 'proj-123',
            name: 'prisma.DemoProduct.findUnique',
            durationMs: 142.5,
            statusCode: 'OK',
            statusMessage: null,
            createdAt: new Date('2026-10-21T06:00:00Z'),
            attributes: {
              'db.system': 'postgresql',
              'db.operation': 'findUnique',
              'db.sql.table': 'DemoProduct',
            },
            trace: {
              serviceName: 'demo-api',
              rootSpanName: 'POST /checkout/success',
            },
          },
          {
            id: 'span-db-2',
            traceId: 'trace-22222222222222222222222222222222',
            projectId: 'proj-123',
            name: 'prisma.raw.queryRaw',
            durationMs: 310.8,
            statusCode: 'OK',
            statusMessage: null,
            createdAt: new Date('2026-10-21T06:01:00Z'),
            attributes: {
              'db.system': 'postgresql',
              'db.operation': 'queryRaw',
              'db.statement': "SELECT * FROM users WHERE password = 'supersecret' AND status = 'active'",
            },
            trace: {
              serviceName: 'demo-api',
              rootSpanName: 'POST /users/search',
            },
          },
        ]),
      },
      trace: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    service = new TracesService(mockPrisma);
  });

  describe('Slow Query Retrieval & Filtering', () => {
    it('should query slow database spans exceeding threshold with correct stats', async () => {
      const result = await service.getSlowQueries({
        projectId: 'proj-123',
        thresholdMs: 100,
      });

      expect(result.total).toBe(2);
      expect(result.thresholdMs).toBe(100);
      expect(result.maxDurationMs).toBe(310.8);
      expect(result.avgSlowDurationMs).toBe(226.65);
      expect(result.queries.length).toBe(2);

      // Check first query (Prisma ORM span without raw SQL)
      const q1 = result.queries[0];
      expect(q1.name).toBe('prisma.DemoProduct.findUnique');
      expect(q1.operation).toBe('findUnique');
      expect(q1.model).toBe('DemoProduct');
      expect(q1.statement).toBeNull();
      expect(q1.formattedStatement).toBeNull();
      expect(q1.serviceName).toBe('demo-api');

      // Check second query (Raw SQL span with sensitive value redacted)
      const q2 = result.queries[1];
      expect(q2.statement).toContain('[REDACTED]');
      expect(q2.statement).not.toContain('supersecret');
      expect(q2.formattedStatement).toContain('SELECT *');
      expect(q2.formattedStatement).toContain('FROM users');
    });

    it('should respect model and operation filters', async () => {
      await service.getSlowQueries({
        projectId: 'proj-123',
        thresholdMs: 50,
        model: 'DemoProduct',
        operation: 'findUnique',
      });

      expect(mockPrisma.span.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            projectId: 'proj-123',
            durationMs: { gte: 50 },
            AND: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'DemoProduct', mode: 'insensitive' } }),
              expect.objectContaining({ name: { contains: 'findUnique', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });

    it('should support sorting by duration ascending and recent', async () => {
      await service.getSlowQueries({
        projectId: 'proj-123',
        sortBy: 'duration_asc',
      });
      expect(mockPrisma.span.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { durationMs: 'asc' },
        }),
      );

      await service.getSlowQueries({
        projectId: 'proj-123',
        sortBy: 'recent',
      });
      expect(mockPrisma.span.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { startTimeUnixNano: 'desc' },
        }),
      );
    });
  });

  describe('SQL Redaction & Formatting Utilities', () => {
    it('should redact sensitive password and token clauses in SQL', () => {
      const raw = "SELECT * FROM accounts WHERE password = 'mySecretPassword' AND token = 'secret123'";
      const redacted = redactSql(raw);
      expect(redacted).not.toContain('mySecretPassword');
      expect(redacted).not.toContain('secret123');
      expect(redacted).toContain("password = '[REDACTED]'");
      expect(redacted).toContain("token = '[REDACTED]'");
    });

    it('should format multi-clause SQL safely with proper line breaks', () => {
      const sql = 'SELECT id, name FROM users WHERE id = 1 AND active = true ORDER BY name DESC LIMIT 10';
      const formatted = formatSql(sql);

      expect(formatted).toContain('SELECT id, name');
      expect(formatted).toContain('FROM users');
      expect(formatted).toContain('WHERE id = 1');
      expect(formatted).toContain('ORDER BY name DESC');
      expect(formatted).toContain('LIMIT 10');
    });

    it('should safely parse Prisma ORM spans without raw SQL', () => {
      const info = parseDatabaseSpanInfo({
        name: 'prisma.DemoOrder.create',
        attributes: {
          'db.system': 'postgresql',
          'db.operation': 'create',
          'db.sql.table': 'DemoOrder',
        },
      });

      expect(info.isRawSql).toBe(false);
      expect(info.model).toBe('DemoOrder');
      expect(info.operation).toBe('create');
      expect(info.displaySummary).toBe('prisma.DemoOrder.create()');
      expect(info.statement).toBeNull();
    });
  });
});
