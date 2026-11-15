import { motion } from 'motion/react';
import type { Card, Suit } from '../game/types';

export const SUIT_SYMBOL: Record<Suit, string> = {
  SPADES: '♠',
  HEARTS: '♥',
  DIAMONDS: '♦',
  CLUBS: '♣',
};

export function isRedSuit(suit: Suit): boolean {
  return suit === 'HEARTS' || suit === 'DIAMONDS';
}

interface PlayingCardProps {
  card: Card;
  playable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export function PlayingCard({
  card,
  playable = false,
  selected = false,
  disabled = false,
  compact = false,
  onClick,
  onDoubleClick,
}: PlayingCardProps) {
  const red = isRedSuit(card.suit);
  const symbol = SUIT_SYMBOL[card.suit];
  const colorClass = red ? 'text-red-600' : 'text-slate-900';

  const sizeClass = compact
    ? 'w-14 h-20 sm:w-16 sm:h-24 rounded-lg'
    : 'w-16 h-24 sm:w-[74px] sm:h-[108px] md:w-[80px] md:h-[116px] rounded-xl';

  const interactive = Boolean(onClick) && !disabled;

  return (
    <motion.button
      type="button"
      disabled={!interactive}
      onClick={interactive ? onClick : undefined}
      onDoubleClick={interactive ? onDoubleClick : undefined}
      aria-label={`${card.rank} of ${card.suit.toLowerCase()}${
        selected ? ', selected' : ''
      }${disabled ? ', unplayable' : ''}`}
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={{
        opacity: disabled ? 0.42 : 1,
        y: selected ? -16 : 0,
        scale: selected ? 1.05 : 1,
      }}
      whileHover={interactive ? { y: selected ? -18 : -8 } : undefined}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden select-none bg-[#FAF8F2] border text-left shadow-lg transition-shadow ${sizeClass} ${
        selected
          ? 'border-amber-400 ring-2 ring-amber-400 shadow-amber-950/60 z-20'
          : playable
            ? 'border-amber-300/80 hover:border-amber-400 shadow-black/50 cursor-pointer'
            : 'border-slate-300 shadow-black/40 cursor-default'
      }`}
    >
      {/* Top-Left Corner */}
      <div
        className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 leading-none font-bold flex flex-col items-center ${colorClass}`}
      >
        <span className={compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}>
          {card.rank}
        </span>
        <span className={compact ? 'text-[10px]' : 'text-xs'}>{symbol}</span>
      </div>

      {/* Center Suit Pip */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none leading-none ${colorClass} ${
          compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
        }`}
        aria-hidden="true"
      >
        {symbol}
      </div>

      {/* Bottom-Right Corner (inverted) */}
      <div
        className={`absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 leading-none font-bold flex flex-col items-center rotate-180 ${colorClass}`}
      >
        <span className={compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}>
          {card.rank}
        </span>
        <span className={compact ? 'text-[10px]' : 'text-xs'}>{symbol}</span>
      </div>
    </motion.button>
  );
}

export function CardBack({ count }: { count?: number }) {
  return (
    <div className="relative w-9 h-13 rounded-md bg-gradient-to-br from-emerald-950 to-slate-900 border border-amber-400/50 shadow-md flex items-center justify-center">
      <div className="w-6 h-9 rounded-sm border border-amber-400/35 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.22),transparent)] flex items-center justify-center">
        {count !== undefined && (
          <span className="font-mono text-[11px] font-bold text-amber-200 tabular-nums">
            {count}
          </span>
        )}
      </div>
    </div>
  );
}
