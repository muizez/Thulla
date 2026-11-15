import { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  Bot,
  Globe,
  History,
  LogOut,
  PlusCircle,
  Settings,
  User,
  Users,
  Zap,
} from 'lucide-react';
import type { PublicRoomSummary, UserProfile } from '../game/types';
import { apiFetch } from '../hooks/useThullaSocket';
import { AvatarIcon } from '../components/AvatarIcon';

interface DashboardPageProps {
  user: UserProfile;
  onNavigate: (
    page:
      | 'CREATE_ROOM'
      | 'JOIN_ROOM'
      | 'PROFILE'
      | 'LEADERBOARD'
      | 'HISTORY'
      | 'RULES'
      | 'SETTINGS'
  ) => void;
  onQuickPlayBots: () => Promise<void>;
  onOnlineMatchmake: () => Promise<void>;
  onJoinPublicRoom: (code: string) => Promise<void>;
  onLogout: () => void;
  busy: boolean;
  error: string | null;
}

export function DashboardPage({
  user,
  onNavigate,
  onQuickPlayBots,
  onOnlineMatchmake,
  onJoinPublicRoom,
  onLogout,
  busy,
  error,
}: DashboardPageProps) {
  const [publicRooms, setPublicRooms] = useState<PublicRoomSummary[]>([]);

  useEffect(() => {
    apiFetch<{ rooms: PublicRoomSummary[] }>('/api/rooms')
      .then((d) => setPublicRooms(d.rooms))
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-100">
      {/* Top 3-zone Game Header */}
      <header className="border-b border-white/10 bg-[#0F172A]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-8">
          <span className="font-display text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0">
            THULLA · ٹھلہ
          </span>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <button
              type="button"
              onClick={() => onNavigate('LEADERBOARD')}
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Leaderboard
            </button>
            <button
              type="button"
              onClick={() => onNavigate('HISTORY')}
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Match History
            </button>
            <button
              type="button"
              onClick={() => onNavigate('RULES')}
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Card Rules
            </button>
            <button
              type="button"
              onClick={() => onNavigate('PROFILE')}
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => onNavigate('SETTINGS')}
              className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Settings
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('CREATE_ROOM')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Create Table
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Player Welcome & Stats Strip */}
        <section className="bg-gradient-to-r from-[#0F5132]/65 to-[#111827] border border-emerald-500/30 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <AvatarIcon avatarId={user.avatar} size="lg" />
            <div>
              <div className="text-xs font-semibold text-amber-300">
                {user.isGuest ? 'Guest Player' : `Rank #${user.rank} · Registered`}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {user.username}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1 tabular-nums">
                <span>{user.totalGames} Games</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-300">{user.totalWins} Escapes</span>
                <span aria-hidden="true">·</span>
                <span className="text-rose-300">{user.totalLosses} Thullas</span>
                <span aria-hidden="true">·</span>
                <span>{user.winPercentage}% Win Rate</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('PROFILE')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-amber-300" />
              Profile
            </button>
            <button
              type="button"
              onClick={() => onNavigate('SETTINGS')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 border border-white/10 text-xs font-medium text-slate-300 hover:text-rose-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-sm text-rose-200"
          >
            {error}
          </div>
        )}

        {/* 3 Primary Game Modes */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Mode A: Play with Friends */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Play with Friends</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Open a private room with a 6-character code, tweak house rules, and deal 52 cards to 2–6 friends.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => onNavigate('CREATE_ROOM')}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Create Private Room
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onNavigate('JOIN_ROOM')}
                className="py-2.5 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-semibold text-xs cursor-pointer"
              >
                Join Code
              </button>
            </div>
          </div>

          {/* Mode B: Play with Bots */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Play vs AI Bots</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Start an instant 4-player match against Easy, Medium, or Hard AI card strategists — zero waiting.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={onQuickPlayBots}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                Quick Solo Match
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onNavigate('CREATE_ROOM')}
                className="py-2.5 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-semibold text-xs cursor-pointer"
              >
                Configure
              </button>
            </div>
          </div>

          {/* Mode C: Online Multiplayer */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
                <Globe className="w-5 h-5 text-sky-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Online Multiplayer</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Matchmake into an open public Thulla table or browse live rooms ready for players.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={onOnlineMatchmake}
                className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer"
              >
                Quick Matchmaking
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onNavigate('JOIN_ROOM')}
                className="py-2.5 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white font-semibold text-xs cursor-pointer"
              >
                Browse
              </button>
            </div>
          </div>
        </section>

        {/* Bottom Split: Public Tables & Mobile Quick Links */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                Open Public Tables
              </h2>
              <span className="text-xs text-slate-400 tabular-nums">
                {publicRooms.length} available
              </span>
            </div>

            {publicRooms.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#0B1120] border border-white/10 text-center text-xs text-slate-400">
                No public lobbies open right now — click Quick Matchmaking or Create Table to open one.
              </div>
            ) : (
              <div className="space-y-2.5">
                {publicRooms.map((r) => (
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
                        <span className="font-mono text-amber-300">
                          {r.roomCode}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-300 tabular-nums">
                        {r.playerCount}/{r.maxPlayers}
                      </span>
                      <button
                        type="button"
                        onClick={() => onJoinPublicRoom(r.roomCode)}
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-white">Campus Hub</h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigate('LEADERBOARD')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0B1120] hover:bg-white/[0.04] border border-white/10 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Global Leaderboard
                </span>
                <span className="text-slate-500">→</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('HISTORY')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0B1120] hover:bg-white/[0.04] border border-white/10 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <History className="w-4 h-4 text-sky-400" />
                  Match History &amp; Replays
                </span>
                <span className="text-slate-500">→</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('RULES')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0B1120] hover:bg-white/[0.04] border border-white/10 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  How to Play Thulla
                </span>
                <span className="text-slate-500">→</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
