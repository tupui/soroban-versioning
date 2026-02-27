// @ts-nocheck

import React, { useState, useEffect } from 'react';

interface FoksDiscussionProps {
  proposalId: string;
}

export const FoksDiscussion = ({ proposalId }: FoksDiscussionProps) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  
  const spaceId = import.meta.env.PUBLIC_FOKS_SPACE_ID || "soroban-versioning";

  const foksUrl = `https://foks.pub/embed/${spaceId}/topic/${proposalId}`;

  return (
    <section className="mt-12 border-t border-zinc-800 pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Governance Discussion</h2>
          <p className="text-zinc-400 text-sm">Participate in the decentralized debate for proposal #{proposalId}</p>
        </div>
        <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-zinc-800/50 text-zinc-400 rounded-full border border-zinc-700 w-fit">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          Decentralized via FOKS
        </span>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900/30 min-h-[600px] shadow-2xl">
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10">
            <div className="w-8 h-8 border-2 border-zinc-500 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-zinc-500 text-sm mt-4 font-mono">Connecting to FOKS nodes...</p>
          </div>
        )}

        <iframe
          src={foksUrl}
          className="w-full h-[650px] border-none"
          onLoad={() => setStatus('success')}
          title="FOKS Discussion"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          loading="lazy"
        />
      </div>
    </section>
  );
};