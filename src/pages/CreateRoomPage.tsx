import { useState } from 'react';
import { ArrowLeft, Bot, Globe, Users } from 'lucide-react';
import {
  DEFAULT_GAME_RULES,
  type BotDifficulty,
  type GameMode,
  type GameRulesConfig,
} from '../game/types';
import { GameRulesEditor } from '../components/GameRulesEditor';

interface CreateRoomPageProps {
  onBack: () => void;
  onCreate: (input: {
    roomName: string;
    mode: GameMode;
    maxPlayers: number;
    botCount: number;
    botDifficulty: BotDifficulty;
    rules: GameRulesConfig;
  }) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function CreateRoomPage({
  onBack,
  onCreate,
  loading,
  error,
}: CreateRoomPageProps) {
  const [mode, setMode] = useState<GameMode>('FRIENDS');
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [botCount, setBotCount] = useState(0);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('MEDIUM');
  const [rules, setRules] = useState<GameRulesConfig>(DEFAULT_GAME_RULES);

  const handleModeChange = (next: GameMode) => {
    setMode(next);
    if (next === 'BOTS' && botCount === 0) {
      setBotCount(Math.min(3, maxPlayers - 1));
    } else if (next === 'FRIENDS' && botCount > 0) {
      setBotCount(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate({
      roomName,
      mode,
      maxPlayers,
      botCount: Math.min(botCount, maxPlayers - 1),
      botDifficulty,
      rules,
    });
  };

  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-100 px-4 sm:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
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
          className="bg-[#111827] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-7"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Create a Thulla Table
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Choose your game mode, AI opponent count, and customizable rules before dealing.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200"
            >
              {error}
            </div>
          )}

          {/* Mode Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'FRIENDS' as const,
                label: 'Private Friends',
                desc: 'Invite with room code',
                icon: Users,
              },
              {
                id: 'BOTS' as const,
                label: 'Solo vs Bots',
                desc: 'Instant AI opponents',
                icon: Bot,
              },
              {
                id: 'ONLINE' as const,
                label: 'Public Online',
                desc: 'Open to matchmaking',
                icon: Globe,
              },
            ].map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModeChange(m.id)}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-900/40 border-amber-400 text-white'
                      : 'bg-[#0B1120] border-white/10 text-slate-300 hover:border-white/25'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mb-2 ${
                      active ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  />
                  <div className="text-sm font-bold">{m.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{m.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="sm:col-span-2 block space-y-1.5">
              <span className="text-xs font-semibold text-slate-200">
                Table Name (optional)
              </span>
              <input
                type="text"
                maxLength={40}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Iqbal Hostel Room 204"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1120] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-200">
                Table Size (2–6)
              </span>
              <select
                value={maxPlayers}
                onChange={(e) => {
                  const nextMax = Number(e.target.value);
                  setMaxPlayers(nextMax);
                  if (botCount >= nextMax) setBotCount(nextMax - 1);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0B1120] border border-white/15 text-sm text-white"
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} Players
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-200">
                AI Bots ({botCount})
              </span>
              <select
                value={botCount}
                onChange={(e) => setBotCount(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-[#0B1120] border border-white/15 text-sm text-white"
              >
                {Array.from({ length: maxPlayers }, (_, i) => i).map((n) => (
                  <option key={n} value={n}>
                    {n === 0 ? 'No Bots' : `${n} Bot${n > 1 ? 's' : ''}`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {botCount > 0 && (
            <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-[#0B1120] border border-white/10">
              <span className="text-xs font-semibold text-slate-300">
                Bot Intelligence:
              </span>
              {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setBotDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    botDifficulty === diff
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/[0.05] text-slate-400 hover:text-white'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-white/10">
            <GameRulesEditor
              rules={rules}
              canEdit={true}
              onChange={setRules}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating Table...' : 'Open Game Lobby'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
