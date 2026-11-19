'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Profile, SwipeAction } from '@/lib/types';

export default function ProfileDetail({ profile, onClose, onAction }: { profile: Profile; onClose: () => void; onAction?: (a: SwipeAction) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`${profile.name}'s profile`} className="fixed inset-0 z-40 flex items-end justify-center bg-black/50" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white" onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profile.photoUrl} alt={profile.name} className="aspect-[4/5] w-full bg-neutral-200 object-cover" />
          <button aria-label="Close" onClick={onClose} className="absolute right-3 top-3 h-9 w-9 rounded-full bg-black/50 text-lg text-white">✕</button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <h2 className="text-2xl font-extrabold">{profile.name}, {profile.age}</h2>
            <p className="text-sm text-neutral-500">{profile.location}</p>
          </div>
          <section>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-400">About</h3>
            <p className="text-neutral-800">{profile.bio}</p>
          </section>
          <section>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-400">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((i) => <span key={i} className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-600">{i}</span>)}
            </div>
          </section>
          {onAction && (
            <div className="flex justify-center gap-8 pb-2 pt-2">
              <button aria-label="Pass" onClick={() => onAction('pass')} className="h-14 w-14 rounded-full bg-white text-2xl text-neutral-500 shadow-md ring-1 ring-neutral-200">✕</button>
              <button aria-label="Like" onClick={() => onAction('like')} className="h-14 w-14 rounded-full bg-rose-500 text-2xl text-white shadow-md">♥</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}