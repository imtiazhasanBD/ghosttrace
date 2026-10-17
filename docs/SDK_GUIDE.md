# GhostTrace Node.js SDK Integration Guide

This guide walks through instrumenting any Node.js, Express, or NestJS application with `@ghosttrace/sdk-node`.

---

## 1. Installation

```bash
pnpm add @ghosttrace/sdk-node @ghosttrace/instrumentation-nest @ghosttrace/instrumentation-prisma
```

---

## 2. Initialization

Initialize the SDK at the very top of your entry file (before any other imports or modules are loaded):

```ts
// src/tracing.ts
import { initGhostTrace } from '@ghosttrace/sdk-node';

initGhostTrace({
  apiKey: process.env.GHOSTTRACE_API_KEY,
  endpoint: process.env.GHOSTTRACE_ENDPOINT || 'http://localhost:3001/v1/traces',
  serviceName: 'my-service',
  debug: false,
});
```

Import this file before bootstrapping your app:
```ts
// src/main.ts
import './tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

---

## 3. NestJS Route Instrumentation

Import `GhostTraceNestModule` into your root `AppModule`:

```ts
import { Module } from '@nestjs/common';
import { GhostTraceNestModule } from '@ghosttrace/instrumentation-nest';

@Module({
  imports: [GhostTraceNestModule],
})
export class AppModule {}
```

This automatically captures:
- HTTP method, URL, status code, latency
- Exceptions and stack traces on failed requests
- Request correlation headers

---

## 4. Prisma ORM Query Instrumentation

Attach the GhostTrace middleware to your Prisma client:

```ts
import { PrismaClient } from '@prisma/client';
import { attachGhostTracePrismaMiddleware } from '@ghosttrace/instrumentation-prisma';

const prisma = new PrismaClient();
attachGhostTracePrismaMiddleware(prisma);

export { prisma };
```

---

## 5. Background Jobs Context Propagation

Wrap background job executions within the parent span context:

```ts
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('background-worker');

async function processEmailNotification(orderId: string) {
  const span = tracer.startSpan('job.send_order_email');
  try {
    // Send email logic...
    span.setAttribute('order.id', orderId);
  } catch (err: any) {
    span.recordException(err);
    throw err;
  } finally {
    span.end();
  }
}
```
