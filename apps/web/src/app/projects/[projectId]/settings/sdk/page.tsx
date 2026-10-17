'use client';

import React from 'react';
import { useProjectTelemetry } from '../../../../../lib/ProjectTelemetryContext';
import { OnboardingModal } from '../../../../../components/OnboardingModal';

export default function SdkSettingsPage() {
  const { currentProjectId, apiKeys, refreshData } = useProjectTelemetry();

  return (
    <div className="space-y-6">
      <OnboardingModal
        projectId={currentProjectId}
        apiKeys={apiKeys}
        onKeysUpdated={refreshData}
      />
    </div>
  );
}
