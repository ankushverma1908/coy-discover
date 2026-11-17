'use client';
import { useState } from 'react';
import Discover from '@/components/Discover';

type Tab = 'home' | 'discover';
export default function Page() {
  const [tab, setTab] = useState<Tab>('discover');
  return (
    <main className="mx-auto flex h-dvh max-w-md flex-col bg-white shadow-xl">
      <div className="min-h-0 flex-1">{tab === 'discover' ? <Discover /> : null /* Home: intentionally blank */}</div>
      <nav className="flex border-t border-neutral-200" aria-label="Main">
        {(['home', 'discover'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} aria-current={tab === t}
            className={`flex-1 py-3 text-sm font-semibold capitalize ${tab === t ? 'text-rose-500' : 'text-neutral-400'}`}>
            {t}
          </button>
        ))}
      </nav>
    </main>
  );
}
