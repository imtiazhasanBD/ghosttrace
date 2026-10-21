import { LiveTailService } from './live-tail.service';
import { LiveTailEvent } from '@ghosttrace/shared-types';
import { firstValueFrom, take, toArray } from 'rxjs';

describe('LiveTailService Unit Tests', () => {
  let service: LiveTailService;

  beforeEach(() => {
    service = new LiveTailService();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('Publishing & Bounded Ring Buffer', () => {
    it('should publish events and enforce max bounded ring buffer size', () => {
      const projectId = 'proj-bounded-test';

      // Publish 60 events (max capacity is 50)
      for (let i = 1; i <= 60; i++) {
        service.publishEvent({
          type: 'trace',
          projectId,
          data: {
            traceId: `trace-${i}`,
            serviceName: 'test-service',
            name: `GET /item/${i}`,
            statusCode: 'OK',
            durationMs: 10 + i,
          },
        });
      }

      const stats = service.getStats();
      expect(stats.trackedProjects).toBe(1);

      // Verify that bounded buffer holds exactly 50 events
      const history = (service as any).projectHistory.get(projectId) as LiveTailEvent[];
      expect(history.length).toBe(50);

      // Oldest events (1 to 10) must have been dropped
      expect(history[0].data.traceId).toBe('trace-11');
      expect(history[49].data.traceId).toBe('trace-60');
    });
  });

  describe('Project-Scoped Subscription & Heartbeats', () => {
    it('should receive replayed history and only project-matching live events', async () => {
      const targetProject = 'project-target';
      const otherProject = 'project-other';

      // Publish an event before subscription
      service.publishEvent({
        type: 'trace',
        projectId: targetProject,
        data: {
          traceId: 'pre-sub-trace',
          serviceName: 'api',
          name: 'POST /checkout',
          statusCode: 'OK',
        },
      });

      // Also publish an event for another project
      service.publishEvent({
        type: 'trace',
        projectId: otherProject,
        data: {
          traceId: 'other-proj-trace',
          serviceName: 'auth',
          name: 'POST /login',
          statusCode: 'OK',
        },
      });

      const receivedEvents: any[] = [];
      const stream$ = service.getEventStream(targetProject);

      const sub = stream$.subscribe((msg) => {
        receivedEvents.push(msg.data);
      });

      // Publish another event while subscribed
      service.publishEvent({
        type: 'error',
        projectId: targetProject,
        data: {
          traceId: 'live-error-trace',
          serviceName: 'api',
          name: 'POST /checkout/fail',
          statusCode: 'ERROR',
          statusMessage: 'Item out of stock',
        },
      });

      // Publish event for other project (should not be received)
      service.publishEvent({
        type: 'trace',
        projectId: otherProject,
        data: {
          traceId: 'ignored-trace',
          serviceName: 'billing',
          name: 'POST /charge',
          statusCode: 'OK',
        },
      });

      // Give event loop tick
      await new Promise((r) => setTimeout(r, 20));

      expect(receivedEvents.length).toBe(2);
      expect(receivedEvents[0].data.traceId).toBe('pre-sub-trace');
      expect(receivedEvents[1].data.traceId).toBe('live-error-trace');

      // Unsubscribe and verify subscriber cleanup
      sub.unsubscribe();
      expect(service.getStats().activeSubscribers).toBe(0);
    });
  });
});
