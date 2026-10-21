'use client';

import React from 'react';
import { useProjectTelemetry } from '../../../../../lib/ProjectTelemetryContext';
import { useApiKeysQuery } from '../../../../../lib/hooks/useTelemetryQueries';
import { OnboardingModal } from '../../../../../components/OnboardingModal';

export default function SdkSettingsPage() {
  const { currentProjectId } = useProjectTelemetry();
  const { data: apiKeysData, refetch } = useApiKeysQuery(currentProjectId);
  const apiKeys = apiKeysData ?? [];

  return (
    <div className="space-y-6">
      <OnboardingModal
        projectId={currentProjectId}
        apiKeys={apiKeys}
        onKeysUpdated={() => refetch()}
      />
    </div>
  );
}
