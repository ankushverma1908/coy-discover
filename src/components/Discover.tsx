'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Profile, SwipeAction } from '@/lib/types';
import { fetchFeed, fetchMatches, postSwipe } from '@/lib/api';
import SwipeCard, { ProfileFace } from './SwipeCard';

type View = 'deck' | 'matches';
const ME_PHOTO = 'https://i.pravatar.cc/600?img=64';

export default function Discover() {
  const [view, setView] = useState<View>('deck');
  const [deck, setDeck] = useState<Profile[] | null>(null);
  const [error, setError] = useState(false);
  const [dir, setDir] = useState(1);
  const [match, setMatch] = useState<Profile | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const cooling = useRef(false);

  const load = useCallback(() => {
    setError(false); setDeck(null);
    fetchFeed().then(setDeck).catch(() => setError(true));
  }, []);
  useEffect(load, [load]);

  const commit = useCallback((action: SwipeAction) => {
    const top = deck?.[0];
    if (!top || cooling.current || match) return; // client-side double-swipe guard
    cooling.current = true;
    setTimeout(() => { cooling.current = false; }, 300);
    setDir(action === 'like' ? 1 : -1);
    setDeck((d) => d && d.slice(1)); // optimistic
    postSwipe(top.id, action)
      .then((r) => { if (r.matched && r.match) setMatch(r.match); })
      .catch(() => {
        setDeck((d) => (d && !d.some((p) => p.id === top.id) ? [top, ...d] : d)); // restore card
        setToast("Couldn't save that swipe. Please try again.");
        setTimeout(() => setToast(null), 3000);
      });
  }, [deck, match]);

  useEffect(() => {
    if (view !== 'deck') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') commit('like');
      if (e.key === 'ArrowLeft') commit('pass');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, commit]);

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-extrabold text-rose-500">Coy</h1>
        <div className="flex rounded-full bg-neutral-100 p-1 text-sm font-semibold">
          {(['deck', 'matches'] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`rounded-full px-3 py-1 capitalize ${view === v ? 'bg-white text-rose-500 shadow' : 'text-neutral-500'}`}>{v}</button>
          ))}
        </div>
      </header>

      {view === 'deck' ? (
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          {error ? (
            <Center><p>Something went wrong loading profiles.</p><Btn onClick={load}>Retry</Btn></Center>
          ) : deck === null ? (
            <div className="flex-1 animate-pulse rounded-3xl bg-neutral-200" aria-label="Loading" />
          ) : deck.length === 0 ? (
            <Center><h2 className="text-xl font-bold">You&apos;re all caught up</h2><p className="text-neutral-500">Check back later for new people.</p><Btn onClick={() => setView('matches')}>Check Matches</Btn></Center>
          ) : (
            <>
              <div className="relative min-h-0 flex-1">
                {deck[1] && (
                  <div className="absolute inset-0 origin-bottom scale-95 overflow-hidden rounded-3xl bg-neutral-300 opacity-80 shadow">
                    <ProfileFace p={deck[1]} />
                  </div>
                )}
                <AnimatePresence custom={dir}>
                  <SwipeCard key={deck[0].id} profile={deck[0]} dir={dir} onSwipe={commit} />
                </AnimatePresence>
              </div>
              <div className="flex justify-center gap-8 pt-4">
                <button aria-label="Pass" onClick={() => commit('pass')} className="h-14 w-14 rounded-full bg-white text-2xl text-neutral-500 shadow-md ring-1 ring-neutral-200">✕</button>
                <button aria-label="Like" onClick={() => commit('like')} className="h-14 w-14 rounded-full bg-rose-500 text-2xl text-white shadow-md">♥</button>
              </div>
            </>
          )}
        </div>
      ) : (
        <MatchesView />
      )}

      {toast && <div role="alert" className="absolute inset-x-4 bottom-4 rounded-xl bg-neutral-900 px-4 py-3 text-center text-sm text-white shadow-lg">{toast}</div>}

      {match && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-rose-500 to-fuchsia-700 p-6 text-white">
          <h2 className="text-4xl font-extrabold">It&apos;s a match!</h2>
          <div className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ME_PHOTO} alt="You" className="h-32 w-32 -rotate-6 rounded-full border-4 border-white object-cover" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={match.photoUrl} alt={match.name} className="-ml-6 h-32 w-32 rotate-6 rounded-full border-4 border-white object-cover" />
          </div>
          <p>You and {match.name} liked each other.</p>
          <div className="flex gap-3">
            <button onClick={() => setMatch(null)} className="rounded-full bg-white/20 px-5 py-3 font-semibold">Keep swiping</button>
            <button onClick={() => { setMatch(null); setView('matches'); }} className="rounded-full bg-white px-5 py-3 font-semibold text-rose-600">View matches</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchesView() {
  const [matches, setMatches] = useState<Profile[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { fetchMatches().then(setMatches).catch(() => setError(true)); }, []);
  if (error) return <Center><p>Couldn&apos;t load matches.</p></Center>;
  if (!matches) return <div className="grid grid-cols-2 gap-3 px-4">{[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-neutral-200" />)}</div>;
  if (!matches.length) return <Center><h2 className="text-xl font-bold">No matches yet</h2><p className="text-neutral-500">Keep swiping — mutual likes show up here.</p></Center>;
  return (
    <div className="grid grid-cols-2 gap-3 overflow-y-auto px-4 pb-4">
      {matches.map((m) => (
        <div key={m.id} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.photoUrl} alt={m.name} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-sm font-semibold text-white">{m.name}, {m.age}</div>
        </div>
      ))}
    </div>
  );
}

const Center = ({ children }: { children: React.ReactNode }) => <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">{children}</div>;
const Btn = (p: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...p} className="rounded-full bg-rose-500 px-5 py-2 font-semibold text-white" />;
