import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Home, RotateCcw, Skull, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import type { PublicGameState } from '../game/types';
import { soundFx } from '../utils/sound';
import { AvatarIcon } from '../components/AvatarIcon';

interface ResultsPageProps {
  game: PublicGameState;
  currentUserId: string;
  onPlayAgain: () => void;
  onBackDashboard: () => void;
}

export function ResultsPage({
  game,
  currentUserId,
  onPlayAgain,
  onBackDashboard,
}: ResultsPageProps) {
  const me = game.players.find((p) => p.userId === currentUserId);
  const isHost = Boolean(me?.isHost);
  const winner = game.results[0];
  const thullaLoser =
    game.results.find((r) => r.result === 'THULLA') ??
    game.results[game.results.length - 1];

  useEffect(() => {
    soundFx.playVictory();
    try {
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#FAF8F2', '#38BDF8'],
      });
    } catch {
      // ignore in headless browsers
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-100 px-4 sm:px-8 py-10">
      <div className="max-w-4xl mx-auto space-y-7">
        <motion.section
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-gradient-to-b from-[#0F5132]/70 to-[#111827] border border-amber-400/35 rounded-3xl p-8 text-center space-y-5"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 mx-auto">
            <Trophy className="w-7 h-7 text-amber-400" />
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Match Complete · {game.roomName}
            </p>
            <h1
              data-testid="winner-headline"
              className="text-3xl sm:text-4xl font-extrabold text-white"
            >
              {winner ? `${winner.username} Escaped First!` : 'Match Finished!'}
            </h1>
            {thullaLoser && (
              <p className="text-sm text-rose-300 font-semibold flex items-center justify-center gap-1.5 pt-1">
                <Skull className="w-4 h-4" />
                {thullaLoser.username} got the THULLA ({thullaLoser.cardsRemaining}{' '}
                cards remaining)
              </p>
            )}
          </div>
        </motion.section>

        <section className="bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Final Standings</h2>
            <span className="text-xs text-slate-400 tabular-nums">
              {game.moveNumber} total cards played
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-400">
                  <th className="py-2.5 pr-3">Pos</th>
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-3">Outcome</th>
                  <th className="py-2.5 px-3 text-right">Cards Left</th>
                  <th className="py-2.5 pl-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {game.results.map((r) => (
                  <tr key={r.playerId}>
                    <td className="py-3 pr-3 font-mono font-bold tabular-nums text-slate-300">
                      #{r.finalPosition}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <AvatarIcon avatarId={r.avatar} size="sm" />
                        <span className="font-semibold text-white">
                          {r.username}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs font-bold">
                      <span
                        className={
                          r.result === 'WINNER'
                            ? 'text-amber-300'
                            : r.result === 'THULLA'
                              ? 'text-rose-400'
                              : 'text-emerald-300'
                        }
                      >
                        {r.result}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                      {r.cardsRemaining}
                    </td>
                    <td className="py-3 pl-3 text-right font-mono font-bold tabular-nums text-white">
                      {r.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {isHost && (
            <button
              type="button"
              onClick={onPlayAgain}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
          )}
          <button
            type="button"
            onClick={onBackDashboard}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-sm font-semibold text-white cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
