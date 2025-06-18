/**
 * Audit timeline page
 */

'use client';

import { AuditTimeline } from '@/components/audit';

export default function AuditPage() {
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Audit History</h1>
        <p className="text-sm text-gray-600 mt-1">
          View all system activities and changes
        </p>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <AuditTimeline />
      </main>
    </div>
  );
}