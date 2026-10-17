'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProjectTelemetry } from '../../../../lib/ProjectTelemetryContext';
import { ErrorGroupsView } from '../../../../components/ErrorGroupsView';

export default function ErrorsPage() {
  const router = useRouter();
  const { errorGroups, currentProjectId, refreshData, setShowCompareModal } = useProjectTelemetry();

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
        onRefresh={refreshData}
        onInvestigateTraces={handleInvestigateTraces}
        onOpenCompare={() => setShowCompareModal(true)}
      />
    </div>
  );
}
