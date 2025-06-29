/**
 * Matter-specific audit timeline page
 */

'use client';

import { use } from 'react';
import { AuditTimeline } from '@/components/audit';

interface MatterAuditPageProps {
  params: Promise<{ id: string }>;
}

export default function MatterAuditPage({ params }: MatterAuditPageProps) {
  const { id } = use(params);
  
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Matter Audit History</h1>
        <p className="text-sm text-gray-600 mt-1">
          View all activities for matter ID: {id}
        </p>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <AuditTimeline matterId={id} />
      </main>
    </div>
  );
}