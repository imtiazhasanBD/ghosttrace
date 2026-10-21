'use client';

import React from 'react';
import { ProjectTelemetryProvider, useProjectTelemetry } from '../../../lib/ProjectTelemetryContext';
import { Sidebar } from '../../../components/Sidebar';
import { TopHeader } from '../../../components/TopHeader';
import { TraceComparisonModal } from '../../../components/TraceComparisonModal';

function ProjectLayoutInner({ children }: { children: React.ReactNode }) {
  const { showCompareModal, setShowCompareModal, comparisonResult, isComparing } =
    useProjectTelemetry();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-row font-sans selection:bg-primary/20 selection:text-primary">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <TopHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Global Trace Comparison Modal */}
      {showCompareModal && (
        <TraceComparisonModal
          comparison={comparisonResult}
          isLoading={isComparing}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
}

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  return (
    <ProjectTelemetryProvider projectId={params.projectId}>
      <ProjectLayoutInner>{children}</ProjectLayoutInner>
    </ProjectTelemetryProvider>
  );
}
