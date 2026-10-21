import { QueryClient } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 1000, // 10 seconds default stale time
        gcTime: 5 * 60 * 1000, // 5 minutes cache retention
        retry: (failureCount, error: any) => {
          // Do not retry unauthorized or not found errors
          const msg = error?.message || '';
          if (msg.includes('401') || msg.includes('404') || msg.includes('Unauthorized')) {
            return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: Always make a new query client per request to avoid cross-request state leakage
    return makeQueryClient();
  } else {
    // Browser: Create query client once per session
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}
