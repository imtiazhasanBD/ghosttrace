'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProjectTelemetry } from '../../../../lib/ProjectTelemetryContext';
import { useOverviewQuery, useTracesQuery } from '../../../../lib/hooks/useTelemetryQueries';
import { ServicesView } from '../../../../components/ServicesView';

export default function ServicesPage() {
  const router = useRouter();
  const { currentProjectId, isAutoRefresh, refreshInterval } = useProjectTelemetry();

  const { data: metricsData } = useOverviewQuery(currentProjectId, {
    refetchInterval: isAutoRefresh ? refreshInterval : false,
  });

  const { data: tracesData } = useTracesQuery(
    { projectId: currentProjectId, limit: 100 },
    { refetchInterval: isAutoRefresh ? refreshInterval : false }
  );

  const metrics = metricsData ?? null;
  const traces = tracesData?.traces ?? [];
  const allServices = metrics?.services || [];

  const handleFilterByService = (serviceName: string) => {
    router.push(`/projects/${currentProjectId}/traces?service=${encodeURIComponent(serviceName)}`);
  };

  return (
    <div className="space-y-6">
      <ServicesView
        services={allServices}
        traces={traces}
        metrics={metrics}
        onFilterByService={handleFilterByService}
      />
    </div>
  );
}
