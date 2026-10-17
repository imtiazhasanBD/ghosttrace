import { IngestionService } from './ingestion.service';

describe('IngestionService Unit Tests', () => {
  let service: IngestionService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      trace: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      span: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      errorGroup: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    service = new IngestionService(mockPrisma);
  });

  describe('Attribute Redaction & Parsing', () => {
    it('should redact sensitive keys such as password, authorization, and secret', () => {
      const rawAttrs = [
        { key: 'user.id', value: { stringValue: '12345' } },
        { key: 'user.password', value: { stringValue: 'plaintext-secret-password' } },
        { key: 'authorization', value: { stringValue: 'Bearer secret_jwt_token_here' } },
        { key: 'api_key', value: { stringValue: 'gt_live_secret123' } },
      ];

      const parsed = (service as any).parseAttributes(rawAttrs);

      expect(parsed['user.id']).toBe('12345');
      expect(parsed['user.password']).toBe('[REDACTED]');
      expect(parsed['authorization']).toBe('[REDACTED]');
      expect(parsed['api_key']).toBe('[REDACTED]');
    });
  });

  describe('ID Normalization', () => {
    it('should normalize 32-hex trace ID and 16-hex span ID', () => {
      const hexTrace = '4bf92f3577b34da6a3ce929d0e0e4736';
      const hexSpan = '00f067aa0ba902b7';

      expect((service as any).normalizeId(hexTrace, 32)).toBe(hexTrace);
      expect((service as any).normalizeId(hexSpan, 16)).toBe(hexSpan);
    });

    it('should convert base64 ID to hex string correctly', () => {
      const buf = Buffer.from('00f067aa0ba902b7', 'hex');
      const base64 = buf.toString('base64');

      expect((service as any).normalizeId(base64, 16)).toBe('00f067aa0ba902b7');
    });
  });

  describe('Span Kind Normalization', () => {
    it('should normalize numeric and string span kinds', () => {
      expect((service as any).normalizeKind(1)).toBe('INTERNAL');
      expect((service as any).normalizeKind(2)).toBe('SERVER');
      expect((service as any).normalizeKind(3)).toBe('CLIENT');
      expect((service as any).normalizeKind('SPAN_KIND_SERVER')).toBe('SERVER');
    });
  });

  describe('Trace and Span Persistence', () => {
    it('should persist trace and span and return accepted count', async () => {
      const payload = {
        resourceSpans: [
          {
            resource: {
              attributes: [
                { key: 'service.name', value: { stringValue: 'test-service' } },
              ],
            },
            scopeSpans: [
              {
                scope: { name: 'test-scope' },
                spans: [
                  {
                    traceId: '11111111111111111111111111111111',
                    spanId: '2222222222222222',
                    name: 'HTTP GET /health',
                    kind: 2,
                    startTimeUnixNano: '1700000000000000000',
                    endTimeUnixNano: '1700000000010000000',
                    status: { code: 1 },
                    attributes: [],
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = await service.ingestTraces(payload, 'test-project-123');
      expect(result.acceptedSpans).toBe(1);
      expect(result.rejectedSpans).toBe(0);
      expect(mockPrisma.trace.upsert).toHaveBeenCalledTimes(1);
      expect(mockPrisma.span.upsert).toHaveBeenCalledTimes(1);
    });
  });
});
