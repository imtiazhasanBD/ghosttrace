'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchProjects } from '../lib/api';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    fetchProjects()
      .then((projects) => {
        if (projects && projects.length > 0) {
          router.replace(`/projects/${projects[0].id}/overview`);
        } else {
          router.replace('/projects/default/overview');
        }
      })
      .catch((err) => {
        console.error('Failed to resolve project for root redirect:', err);
        router.replace('/projects/default/overview');
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        <p className="text-xs font-mono text-slate-400">Loading GhostTrace workspace...</p>
      </div>
    </div>
  );
}
