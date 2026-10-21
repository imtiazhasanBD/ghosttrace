import { Injectable, Logger, MessageEvent, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable, interval, merge, from } from 'rxjs';
import { filter, map, finalize } from 'rxjs/operators';
import { LiveTailEvent } from '@ghosttrace/shared-types';
import * as crypto from 'crypto';

@Injectable()
export class LiveTailService implements OnModuleDestroy {
  private readonly logger = new Logger(LiveTailService.name);
  private readonly eventSubject = new Subject<LiveTailEvent>();

  // Bounded ring-buffer history per project to prevent unbounded memory growth
  private readonly projectHistory = new Map<string, LiveTailEvent[]>();
  private readonly MAX_BUFFER_PER_PROJECT = 50;

  // Active subscription counter
  private subscriberCount = 0;

  onModuleDestroy() {
    this.eventSubject.complete();
    this.projectHistory.clear();
  }

  /**
   * Publish a telemetry event after successful persistence.
   * Only called once ingestion has succeeded.
   */
  publishEvent(event: Omit<LiveTailEvent, 'id' | 'timestamp'>): void {
    const fullEvent: LiveTailEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    // Maintain bounded ring buffer per project
    let history = this.projectHistory.get(event.projectId);
    if (!history) {
      history = [];
      this.projectHistory.set(event.projectId, history);
    }

    history.push(fullEvent);
    if (history.length > this.MAX_BUFFER_PER_PROJECT) {
      history.shift(); // Drop oldest event
    }

    // Broadcast event
    this.eventSubject.next(fullEvent);
  }

  /**
   * Subscribe to live SSE events for a specific project.
   * Replays recent bounded history, merges real-time events, and emits periodic heartbeats.
   */
  getEventStream(projectId: string): Observable<MessageEvent> {
    this.subscriberCount++;
    this.logger.log(`Client subscribed to Live Tail for project ${projectId}. Active subscribers: ${this.subscriberCount}`);

    // 1. Initial replay of bounded history (if any)
    const history = this.projectHistory.get(projectId) || [];
    const historyObservable = from(history);

    // 2. Real-time project-filtered stream
    const liveObservable = this.eventSubject.asObservable().pipe(
      filter((e) => e.projectId === projectId),
    );

    // 3. Heartbeat every 15s to prevent proxy/firewall timeouts
    const heartbeatObservable = interval(15000).pipe(
      map((): LiveTailEvent => ({
        id: crypto.randomUUID(),
        type: 'heartbeat',
        projectId,
        timestamp: new Date().toISOString(),
        data: {
          traceId: '',
          serviceName: 'ghosttrace-heartbeat',
          name: 'ping',
          statusCode: 'OK',
        },
      })),
    );

    return merge(historyObservable, liveObservable, heartbeatObservable).pipe(
      map((evt: LiveTailEvent): MessageEvent => ({
        data: evt,
        id: evt.id,
        type: evt.type,
        retry: 3000, // Reconnect retry interval in ms
      })),
      finalize(() => {
        this.subscriberCount = Math.max(0, this.subscriberCount - 1);
        this.logger.log(`Client disconnected from Live Tail for project ${projectId}. Active subscribers: ${this.subscriberCount}`);
      }),
    );
  }

  /**
   * Return current metrics for health and diagnostics
   */
  getStats() {
    return {
      activeSubscribers: this.subscriberCount,
      trackedProjects: this.projectHistory.size,
      maxBufferPerProject: this.MAX_BUFFER_PER_PROJECT,
    };
  }
}
