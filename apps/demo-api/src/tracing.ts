import { initGhostTrace } from '@ghosttrace/sdk-node';

initGhostTrace({
  apiKey: process.env.GHOSTTRACE_API_KEY || 'gt_live_default_demo_project_key_test_12345',
  endpoint: process.env.GHOSTTRACE_ENDPOINT || 'http://localhost:3001/v1/traces',
  serviceName: process.env.GHOSTTRACE_SERVICE_NAME || 'demo-api',
  debug: false,
});
