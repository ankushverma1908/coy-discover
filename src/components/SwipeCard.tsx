'use client';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import type { Profile, SwipeAction } from '@/lib/types';

const THRESHOLD = 120;
const variants = {
  exit: (d: number) => ({ x: d * 500, rotate: d * 25, opacity: 0, transition: { duration: 0.25 } }),
};

export function ProfileFace({ p }: { p: Profile }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.photoUrl} alt={p.name} draggable={false} className="h-full w-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
        <h2 className="text-2xl font-bold">{p.name}, {p.age}</h2>
        <p className="text-sm opacity-90">{p.location}</p>
        <p className="mt-1 text-sm">{p.bio}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {p.interests.map((i) => <span key={i} className="rounded-full bg-white/25 px-2 py-0.5 text-xs">{i}</span>)}
        </div>
      </div>
    </>
  );
}

export default function SwipeCard({ profile, dir, onSwipe, onOpen }: { profile: Profile; dir: number; onSwipe: (a: SwipeAction) => void; onOpen: () => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [20, THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-THRESHOLD, -20], [1, 0]);
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > THRESHOLD || info.velocity.x > 600) onSwipe('like');
    else if (info.offset.x < -THRESHOLD || info.velocity.x < -600) onSwipe('pass');
  };
  return (
    <motion.div
      custom={dir} variants={variants} exit="exit"
      drag="x" dragSnapToOrigin dragElastic={0.9} dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={onDragEnd} onTap={onOpen} style={{ x, rotate }} whileTap={{ cursor: 'grabbing' }}
      className="absolute inset-0 touch-pan-y overflow-hidden rounded-3xl bg-neutral-300 shadow-lg"
    >
      <ProfileFace p={profile} />
      <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white">Tap for details</div>
      <motion.div style={{ opacity: likeOpacity }} className="absolute left-5 top-8 -rotate-12 rounded-lg border-4 border-emerald-400 px-3 py-1 text-3xl font-extrabold text-emerald-400">LIKE</motion.div>
      <motion.div style={{ opacity: nopeOpacity }} className="absolute right-5 top-8 rotate-12 rounded-lg border-4 border-rose-500 px-3 py-1 text-3xl font-extrabold text-rose-500">NOPE</motion.div>
    </motion.div>
  );
}