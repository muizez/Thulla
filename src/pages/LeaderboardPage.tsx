import { useEffect, useState } from 'react';
import { ArrowLeft, Award, RefreshCw, Trophy } from 'lucide-react';
import type { LeaderboardEntry } from '../game/types';
import { apiFetch } from '../hooks/useThullaSocket';
import { AvatarIcon } from '../components/AvatarIcon';

interface LeaderboardPageProps {
  currentUserId: string;
  onBack: () => void;
}

export function LeaderboardPage({
  currentUserId,
  onBack,
}: LeaderboardPageProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiFetch<{ leaderboard: LeaderboardEntry[] }>('/api/players/leaderboard')
      .then((res) => setEntries(res.leaderboard))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-100 px-4 sm:px-8 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-slate-200 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        <section className="bg-[#111827] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/35 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Campus Thulla Leaderboard
              </h1>
              <p className="text-xs text-slate-400">
                Ranked by total escapes (wins), win percentage, and best win streaks.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              Loading leaderboard...
            </p>
          ) : entries.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Award className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300">No ranked players yet.</p>
              <p className="text-xs text-slate-500">
                Complete a match of Thulla to claim #1 on the board.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-slate-400">
                    <th className="py-3 pr-3">Rank</th>
                    <th className="py-3 px-3">Player</th>
                    <th className="py-3 px-3 text-right">Games</th>
                    <th className="py-3 px-3 text-right">Wins</th>
                    <th className="py-3 px-3 text-right">Thullas</th>
                    <th className="py-3 px-3 text-right">Win %</th>
                    <th className="py-3 pl-3 text-right">Best Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {entries.map((entry) => {
                    const isMe = entry.userId === currentUserId;
                    return (
                      <tr
                        key={entry.userId}
                        className={isMe ? 'bg-emerald-950/35' : ''}
                      >
                        <td className="py-3 pr-3 font-mono font-bold tabular-nums text-amber-300">
                          #{entry.rank}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <AvatarIcon avatarId={entry.avatar} size="sm" />
                            <span className="font-semibold text-white">
                              {entry.username}
                              {isMe && (
                                <span className="ml-2 text-[11px] text-emerald-300 font-medium">
                                  (You)
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                          {entry.totalGames}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-emerald-300">
                          {entry.totalWins}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-300">
                          {entry.totalLosses}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-200">
                          {entry.winPercentage}%
                        </td>
                        <td className="py-3 pl-3 text-right font-mono tabular-nums text-sky-300">
                          {entry.bestStreak}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
