import { useEffect, useState } from 'react';
import { ArrowLeft, Globe, RefreshCw } from 'lucide-react';
import type { PublicRoomSummary } from '../game/types';
import { apiFetch } from '../hooks/useThullaSocket';

interface JoinRoomPageProps {
  initialCode?: string;
  onBack: () => void;
  onJoinCode: (code: string) => Promise<void>;
  onQuickMatch: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function JoinRoomPage({
  initialCode = '',
  onBack,
  onJoinCode,
  onQuickMatch,
  loading,
  error,
}: JoinRoomPageProps) {
  const [code, setCode] = useState(initialCode);
  const [rooms, setRooms] = useState<PublicRoomSummary[]>([]);

  const refresh = () => {
    apiFetch<{ rooms: PublicRoomSummary[] }>('/api/rooms')
      .then((d) => setRooms(d.rooms))
      .catch(() => {});
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    await onJoinCode(code.trim().toUpperCase());
  };

  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-100 px-4 sm:px-8 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <form
          onSubmit={handleSubmit}
          className="bg-[#111827] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Join a Thulla Table</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Enter a friend’s 6-character code or pick an open public lobby below.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200"
            >
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 block">
              <span className="sr-only">Room Code</span>
              <input
                type="text"
                required
                minLength={4}
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code (e.g. K7M9PQ)"
                className="w-full px-4 py-3 rounded-xl bg-[#0B1120] border border-white/15 font-mono text-base tracking-widest uppercase text-white focus:outline-none focus:border-amber-400"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </form>

        <section className="bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              Public Online Rooms
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refresh}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-slate-300 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onQuickMatch}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white cursor-pointer"
              >
                Auto-Matchmake
              </button>
            </div>
          </div>

          {rooms.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No public tables open right now. Click Auto-Matchmake to start one!
            </p>
          ) : (
            <div className="space-y-2.5">
              {rooms.map((r) => (
                <div
                  key={r.roomCode}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0B1120] border border-white/10"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {r.roomName}
                    </div>
                    <div className="text-xs text-slate-400">
                      Host: {r.hostName} · {r.presetName} ·{' '}
                      <span className="font-mono text-amber-300">{r.roomCode}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-300 tabular-nums">
                      {r.playerCount}/{r.maxPlayers}
                    </span>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => onJoinCode(r.roomCode)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
