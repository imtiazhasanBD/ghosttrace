'use client';

import React from 'react';
import { useProjectTelemetry } from '../../../../lib/ProjectTelemetryContext';
import { LiveTailConsole } from '../../../../components/LiveTailConsole';

export default function LiveTailPage() {
  const { currentProjectId, metrics } = useProjectTelemetry();
  const allServices = metrics?.services || [];

  return (
    <div className="space-y-4">
      <LiveTailConsole projectId={currentProjectId} services={allServices} />
    </div>
  );
}
