import { useState } from 'react';
import {
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  LogOut,
  Play,
  Trash2,
  UserMinus,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type {
  BotDifficulty,
  GameRulesConfig,
  PublicGameState,
} from '../game/types';
import { AvatarIcon } from '../components/AvatarIcon';
import { GameRulesEditor } from '../components/GameRulesEditor';

interface LobbyPageProps {
  game: PublicGameState;
  currentUserId: string;
  wsConnected: boolean;
  error: string | null;
  onToggleReady: () => void;
  onStartGame: () => void;
  onUpdateSettings: (patch: {
    rules?: GameRulesConfig;
    botCount?: number;
    botDifficulty?: BotDifficulty;
  }) => void;
  onKickPlayer: (playerId: string) => void;
  onCloseRoom: () => void;
  onLeaveRoom: () => void;
}

export function LobbyPage({
  game,
  currentUserId,
  wsConnected,
  error,
  onToggleReady,
  onStartGame,
  onUpdateSettings,
  onKickPlayer,
  onCloseRoom,
  onLeaveRoom,
}: LobbyPageProps) {
  const [copied, setCopied] = useState(false);

  const me = game.players.find((p) => p.userId === currentUserId);
  const isHost = Boolean(me?.isHost);
  const unreadyHumans = game.players.filter(
    (p) => !p.isBot && !p.isHost && !p.isReady
  );
  const canStart = isHost && game.players.length >= 2 && unreadyHumans.length === 0;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(game.roomCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-100 px-4 sm:px-8 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {game.roomName}
              </h1>
              <span className="text-xs font-medium text-slate-400">
                {game.mode} · {game.players.length}/{game.maxPlayers} Seated
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="inline-flex items-center gap-1.5">
                {wsConnected ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Live Sync</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-300">Reconnecting...</span>
                  </>
                )}
              </span>
              <span aria-hidden="true">·</span>
              <span>{game.lastEventMessage}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111827] border border-amber-400/40">
              <span className="text-xs text-slate-400">Code:</span>
              <span
                data-testid="room-code-display"
                className="font-mono text-base font-bold tracking-widest text-amber-300"
              >
                {game.roomCode}
              </span>
              <button
                type="button"
                onClick={copyCode}
                aria-label="Copy room code"
                className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {isHost && (
              <button
                type="button"
                onClick={onCloseRoom}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-xs font-semibold text-rose-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Close Room
              </button>
            )}

            <button
              type="button"
              onClick={onLeaveRoom}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-slate-300 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Leave
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-sm text-rose-200"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Players & Ready/Start Controls */}
          <section className="lg:col-span-5 lg:sticky lg:top-6 bg-[#111827] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                Table Seats ({game.players.length}/{game.maxPlayers})
              </h2>
              <span className="text-xs text-slate-400">2–6 players</span>
            </div>

            <ul className="space-y-2.5" data-testid="lobby-player-list">
              {game.players.map((p) => (
                <li
                  key={p.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                    p.userId === currentUserId
                      ? 'bg-emerald-950/50 border-emerald-500/45'
                      : 'bg-[#0B1120] border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarIcon avatarId={p.avatar} size="sm" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white truncate">
                          {p.username}
                        </span>
                        {p.isHost && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        {p.isBot && <Bot className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {p.isHost
                          ? 'Room Host'
                          : p.isBot
                            ? `AI Bot · ${p.botDifficulty ?? game.botDifficulty}`
                            : p.isReady
                              ? 'Ready to Deal'
                              : 'Not Ready'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-semibold ${
                        p.isReady ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {p.isReady ? 'Ready' : 'Waiting'}
                    </span>

                    {isHost && !p.isHost && (
                      <button
                        type="button"
                        onClick={() => onKickPlayer(p.id)}
                        aria-label={`Remove ${p.username}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Host Bot Controls */}
            {isHost && (
              <div className="p-3.5 rounded-xl bg-[#0B1120] border border-white/10 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-200">
                    AI Bots at Table
                  </span>
                  <select
                    value={game.botCount}
                    onChange={(e) =>
                      onUpdateSettings({ botCount: Number(e.target.value) })
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#111827] border border-white/15 text-xs text-white"
                  >
                    {Array.from(
                      {
                        length: Math.max(
                          1,
                          game.maxPlayers -
                            game.players.filter((p) => !p.isBot).length +
                            1
                        ),
                      },
                      (_, i) => i
                    ).map((n) => (
                      <option key={n} value={n}>
                        {n} Bot{n !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {game.botCount > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">Bot Difficulty</span>
                    <div className="flex gap-1.5">
                      {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => onUpdateSettings({ botDifficulty: diff })}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                            game.botDifficulty === diff
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white/[0.05] text-slate-400'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ready / Start CTA */}
            {isHost ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={!canStart}
                  onClick={onStartGame}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Shuffle &amp; Deal Cards
                </button>
                {game.players.length < 2 && (
                  <p className="text-xs text-amber-300 text-center">
                    Add a bot or share code <span className="font-mono font-bold">{game.roomCode}</span> for friends to join.
                  </p>
                )}
                {unreadyHumans.length > 0 && (
                  <p className="text-xs text-amber-300 text-center">
                    Waiting for {unreadyHumans.map((u) => u.username).join(', ')} to click Ready.
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onToggleReady}
                className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-sm transition-colors cursor-pointer ${
                  me?.isReady
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {me?.isReady ? 'Ready (Click to Cancel)' : 'Mark Ready'}
              </button>
            )}
          </section>

          {/* Right: House Rules Configuration */}
          <section className="lg:col-span-7 bg-[#111827] border border-white/10 rounded-2xl p-5 sm:p-6">
            <GameRulesEditor
              rules={game.rules}
              canEdit={isHost}
              onChange={(rules) => onUpdateSettings({ rules })}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
