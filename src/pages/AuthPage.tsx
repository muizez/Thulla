import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { AvatarPicker } from '../components/AvatarIcon';

interface AuthPageProps {
  initialMode: 'login' | 'register' | 'guest';
  onBack: () => void;
  onLoginSubmit: (data: { identifier: string; password: string }) => Promise<void>;
  onRegisterSubmit: (data: {
    username: string;
    email: string;
    password: string;
    avatar: string;
  }) => Promise<void>;
  onGuestSubmit: (data: { username: string; avatar: string }) => Promise<void>;
  error: string | null;
  loading: boolean;
}

export function AuthPage({
  initialMode,
  onBack,
  onLoginSubmit,
  onRegisterSubmit,
  onGuestSubmit,
  error,
  loading,
}: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('ace');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await onLoginSubmit({ identifier, password });
    } else if (mode === 'register') {
      await onRegisterSubmit({ username, email, password, avatar });
    } else {
      await onGuestSubmit({ username, avatar });
    }
  };

  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-100 px-4 sm:px-8 py-8 flex flex-col">
      <div className="max-w-xl w-full mx-auto space-y-6 my-auto">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111827] border border-white/10">
            {(['guest', 'login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap shrink-0 cursor-pointer ${
                  mode === m
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'guest' ? 'Guest Play' : m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#111827] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">
              {mode === 'login'
                ? 'Welcome Back to the Table'
                : mode === 'register'
                  ? 'Create Your Thulla Account'
                  : 'Quick Hostel Guest Entry'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'login'
                ? 'Sign in to access your stats, match history, and leaderboard rank.'
                : mode === 'register'
                  ? 'Track wins, streaks, and climb the campus Thulla leaderboard.'
                  : 'Pick a display name and avatar to jump straight into a table.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs font-medium text-rose-200"
            >
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-200">
                  Username or Email
                </span>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. hamza_cs or hamza@uni.edu.pk"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0B1120] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-200">
                  Password
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0B1120] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </label>
            </>
          ) : (
            <>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-200">
                  Display Name / Username
                </span>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={20}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Hamza, Zara, Bilal"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0B1120] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </label>

              {mode === 'register' && (
                <>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-slate-200">
                      Email Address
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@university.edu"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0B1120] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold text-slate-200">
                      Password (6+ characters)
                    </span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0B1120] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </label>
                </>
              )}

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-200 block">
                  Select Card Avatar
                </span>
                <AvatarPicker value={avatar} onChange={setAvatar} />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading
              ? 'Authenticating...'
              : mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                  ? 'Create Account & Enter Lobby'
                  : 'Enter as Guest'}
          </button>
        </form>
      </div>
    </main>
  );
}
