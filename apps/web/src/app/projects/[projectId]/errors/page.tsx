'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProjectTelemetry } from '../../../../lib/ProjectTelemetryContext';
import { useErrorGroupsQuery } from '../../../../lib/hooks/useTelemetryQueries';
import { ErrorGroupsView } from '../../../../components/ErrorGroupsView';

export default function ErrorsPage() {
  const router = useRouter();
  const { currentProjectId, setShowCompareModal, isAutoRefresh, refreshInterval } = useProjectTelemetry();

  const {
    data: errorGroupsData,
    refetch,
  } = useErrorGroupsQuery(currentProjectId, {
    refetchInterval: isAutoRefresh ? refreshInterval : false,
  });

  const errorGroups = errorGroupsData ?? [];

  const handleInvestigateTraces = (serviceName: string, errorType: string) => {
    router.push(
      `/projects/${currentProjectId}/traces?service=${encodeURIComponent(
        serviceName
      )}&status=ERROR&search=${encodeURIComponent(errorType)}`
    );
  };

  return (
    <div className="space-y-6">
      <ErrorGroupsView
        errorGroups={errorGroups}
        onRefresh={() => refetch()}
        onInvestigateTraces={handleInvestigateTraces}
        onOpenCompare={() => setShowCompareModal(true)}
      />
    </div>
  );
}
