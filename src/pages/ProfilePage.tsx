import { useEffect, useState } from 'react';
import { ArrowLeft, Award, Flame, ShieldCheck, Skull, Trophy } from 'lucide-react';
import type { MatchHistoryItem, UserProfile } from '../game/types';
import { apiFetch } from '../hooks/useThullaSocket';
import { AvatarIcon } from '../components/AvatarIcon';

interface ProfilePageProps {
  user: UserProfile;
  onBack: () => void;
  onOpenSettings: () => void;
}

export function ProfilePage({
  user,
  onBack,
  onOpenSettings,
}: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile>(user);
  const [recentMatches, setRecentMatches] = useState<MatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiFetch<{ player: UserProfile; recentMatches: MatchHistoryItem[] }>(
      `/api/players/${encodeURIComponent(user.id)}/statistics`
    )
      .then((res) => {
        if (!active) return;
        setProfile(res.player);
        setRecentMatches(res.recentMatches);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user.id]);

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
            onClick={onOpenSettings}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer"
          >
            Edit Profile &amp; Avatar
          </button>
        </div>

        {/* Profile Header Card */}
        <section className="bg-gradient-to-r from-[#0F5132]/60 to-[#111827] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <AvatarIcon avatarId={profile.avatar} size="lg" />
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                {profile.isGuest ? 'Guest Session' : 'Registered Account'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                {profile.username}
              </h1>
              {profile.email && (
                <p className="text-xs text-slate-300 mt-0.5">{profile.email}</p>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">Global Rank</div>
            <div className="font-display text-3xl font-extrabold text-amber-300 tabular-nums">
              #{profile.rank}
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Games', value: profile.totalGames, icon: Award, accent: 'text-white' },
            { label: 'Escapes (Wins)', value: profile.totalWins, icon: Trophy, accent: 'text-emerald-300' },
            { label: 'Thullas (Losses)', value: profile.totalLosses, icon: Skull, accent: 'text-rose-300' },
            { label: 'Win Rate', value: `${profile.winPercentage}%`, icon: Award, accent: 'text-amber-300' },
            { label: 'Current Streak', value: profile.currentStreak, icon: Flame, accent: 'text-sky-300' },
            { label: 'Best Streak', value: profile.bestStreak, icon: Flame, accent: 'text-amber-400' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-[#111827] border border-white/10 rounded-xl p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{stat.label}</span>
                  <Icon className={`w-3.5 h-3.5 ${stat.accent}`} />
                </div>
                <div className={`text-xl font-extrabold tabular-nums ${stat.accent}`}>
                  {stat.value}
                </div>
              </div>
            );
          })}
        </section>

        {/* Recent Match Performance */}
        <section className="bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Your Recent Matches</h2>

          {loading ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Loading match statistics...
            </p>
          ) : recentMatches.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No completed matches yet. Play a table against bots or friends to build your record.
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentMatches.map((m) => {
                const mine = m.results.find((r) => r.userId === profile.id);
                return (
                  <div
                    key={m.sessionId}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#0B1120] border border-white/10"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {m.roomName}{' '}
                        <span className="font-mono text-xs text-amber-300">
                          ({m.roomCode})
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 tabular-nums">
                        {m.mode} · {m.playerCount} Players · {m.totalMoves} cards played ·{' '}
                        {new Date(m.endedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-right">
                      {mine ? (
                        <span
                          className={`text-xs font-bold ${
                            mine.result === 'WINNER'
                              ? 'text-amber-300'
                              : mine.result === 'THULLA'
                                ? 'text-rose-400'
                                : 'text-emerald-300'
                          }`}
                        >
                          {mine.result} (#{mine.finalPosition}) · {mine.score} pts
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Winner: {m.winnerName}
                        </span>
                      )}
                    </div>
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
