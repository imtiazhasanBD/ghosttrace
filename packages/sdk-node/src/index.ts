import { diag, DiagConsoleLogger, DiagLogLevel, trace, Tracer } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { RedactingSpanProcessor } from './redactor';

export interface GhostTraceConfig {
  apiKey?: string;
  endpoint?: string;
  serviceName?: string;
  debug?: boolean;
  batchTimeoutMs?: number;
  maxQueueSize?: number;
  maxExportBatchSize?: number;
}

let provider: NodeTracerProvider | null = null;
let isInitialized = false;

export function initGhostTrace(config: GhostTraceConfig = {}): {
  tracer: Tracer;
  shutdown: () => Promise<void>;
} {
  if (isInitialized && provider) {
    return {
      tracer: trace.getTracer(config.serviceName || 'ghosttrace-app'),
      shutdown: () => provider!.shutdown(),
    };
  }

  const apiKey = config.apiKey || process.env.GHOSTTRACE_API_KEY;
  const endpoint = config.endpoint || process.env.GHOSTTRACE_ENDPOINT || 'http://localhost:3001/v1/traces';
  const serviceName = config.serviceName || process.env.GHOSTTRACE_SERVICE_NAME || 'node-service';

  if (config.debug) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  if (!apiKey) {
    console.warn('[GhostTrace SDK] Warning: No GHOSTTRACE_API_KEY provided. Traces may be rejected by the ingestion gateway.');
  }

  // 1. Setup Resource
  const resource = new Resource({
    [ATTR_SERVICE_NAME]: serviceName,
    'telemetry.sdk.name': 'ghosttrace-sdk-node',
    'telemetry.sdk.version': '1.0.0',
    'host.node_version': process.version,
  });

  // 2. Setup Provider
  provider = new NodeTracerProvider({ resource });

  // 3. Attach Redactor
  provider.addSpanProcessor(new RedactingSpanProcessor());

  // 4. Setup OTLP Exporter with retry and backoff
  const exporter = new OTLPTraceExporter({
    url: endpoint,
    headers: {
      'x-ghosttrace-key': apiKey || '',
      Authorization: `Bearer ${apiKey || ''}`,
    },
    timeoutMillis: config.batchTimeoutMs || 3000,
  });

  // 5. Setup BatchSpanProcessor
  const batchProcessor = new BatchSpanProcessor(exporter, {
    maxQueueSize: config.maxQueueSize || 2048,
    maxExportBatchSize: config.maxExportBatchSize || 512,
    scheduledDelayMillis: 500,
    exportTimeoutMillis: config.batchTimeoutMs || 3000,
  });

  provider.addSpanProcessor(batchProcessor);
  provider.register();

  isInitialized = true;
  console.log(`[GhostTrace SDK] Initialized for service "${serviceName}" -> ${endpoint}`);

  // 6. Graceful shutdown handler
  const shutdown = async () => {
    if (provider) {
      console.log('[GhostTrace SDK] Flushing pending spans and shutting down provider...');
      await provider.shutdown();
      isInitialized = false;
      provider = null;
    }
  };

  const handleExit = () => {
    shutdown().finally(() => {
      // Allow clean process termination
    });
  };

  process.once('SIGINT', handleExit);
  process.once('SIGTERM', handleExit);
  process.once('beforeExit', handleExit);

  return {
    tracer: trace.getTracer(serviceName),
    shutdown,
  };
}

export * from './redactor';
