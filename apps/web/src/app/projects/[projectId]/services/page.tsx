'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProjectTelemetry } from '../../../../lib/ProjectTelemetryContext';
import { ServicesView } from '../../../../components/ServicesView';

export default function ServicesPage() {
  const router = useRouter();
  const { metrics, traces, currentProjectId } = useProjectTelemetry();

  const handleFilterByService = (serviceName: string) => {
    router.push(`/projects/${currentProjectId}/traces?service=${encodeURIComponent(serviceName)}`);
  };

  const allServices = metrics?.services || [];

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
