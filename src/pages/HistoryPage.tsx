import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, History, Skull, Trophy } from 'lucide-react';
import type { GameMoveRecord, MatchHistoryItem } from '../game/types';
import { apiFetch } from '../hooks/useThullaSocket';

interface HistoryPageProps {
  onBack: () => void;
}

export function HistoryPage({ onBack }: HistoryPageProps) {
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [movesMap, setMovesMap] = useState<Record<string, GameMoveRecord[]>>({});

  useEffect(() => {
    apiFetch<{ history: MatchHistoryItem[] }>('/api/history')
      .then((res) => setHistory(res.history))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sessionId);
    if (!movesMap[sessionId]) {
      try {
        const res = await apiFetch<{ moves: GameMoveRecord[] }>(
          `/api/games/${encodeURIComponent(sessionId)}/history`
        );
        setMovesMap((prev) => ({ ...prev, [sessionId]: res.moves }));
      } catch {
        setMovesMap((prev) => ({ ...prev, [sessionId]: [] }));
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-100 px-4 sm:px-8 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <section className="bg-[#111827] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/35 flex items-center justify-center">
              <History className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Match History &amp; Trick Replay
              </h1>
              <p className="text-xs text-slate-400">
                Inspect completed tables, final standings, and move-by-move card logs.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              Loading completed matches...
            </p>
          ) : history.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              No completed games recorded yet. Finish a match to see its replay log here.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const isOpen = expandedId === item.sessionId;
                const moves = movesMap[item.sessionId] ?? [];
                return (
                  <div
                    key={item.sessionId}
                    className="rounded-xl bg-[#0B1120] border border-white/10 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.sessionId)}
                      aria-expanded={isOpen}
                      className="w-full p-4 flex flex-wrap items-center justify-between gap-4 text-left hover:bg-white/[0.02] cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                          <span>{item.roomName}</span>
                          <span className="font-mono text-xs text-amber-300">
                            {item.roomCode}
                          </span>
                          <span className="text-xs font-normal text-slate-400">
                            · {item.mode}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 tabular-nums">
                          <span className="inline-flex items-center gap-1 text-emerald-300">
                            <Trophy className="w-3.5 h-3.5" />
                            Winner: {item.winnerName}
                          </span>
                          <span className="inline-flex items-center gap-1 text-rose-300">
                            <Skull className="w-3.5 h-3.5" />
                            Thulla: {item.thullaLoserName}
                          </span>
                          <span>
                            {item.playerCount} players · {item.totalMoves} moves
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 shrink-0">
                        {isOpen ? 'Hide Moves' : 'View Replay'}
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-white/10 p-4 space-y-4 bg-[#080E1A]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {item.results.map((r) => (
                            <div
                              key={r.playerId}
                              className="p-2.5 rounded-lg bg-[#111827] border border-white/10 flex items-center justify-between text-xs"
                            >
                              <span className="font-semibold text-white">
                                #{r.finalPosition} {r.username}
                              </span>
                              <span
                                className={`font-bold ${
                                  r.result === 'WINNER'
                                    ? 'text-amber-300'
                                    : r.result === 'THULLA'
                                      ? 'text-rose-400'
                                      : 'text-emerald-300'
                                }`}
                              >
                                {r.result} ({r.score} pts)
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1.5">
                          <h3 className="text-xs font-bold text-slate-300">
                            Card-by-Card Log ({moves.length} moves)
                          </h3>
                          {moves.length === 0 ? (
                            <p className="text-xs text-slate-500">
                              No move records found for this session.
                            </p>
                          ) : (
                            <div className="max-h-52 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-mono">
                              {moves.map((m) => (
                                <div
                                  key={m.moveNumber}
                                  className={`px-2.5 py-1.5 rounded bg-[#111827] border ${
                                    m.isOffSuit
                                      ? 'border-rose-500/40 text-rose-200'
                                      : 'border-white/5 text-slate-300'
                                  }`}
                                >
                                  #{m.moveNumber} · T{m.trickNumber} · {m.username}:{' '}
                                  {m.note}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
