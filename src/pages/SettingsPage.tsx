import { useState } from 'react';
import { ArrowLeft, Check, Music, Volume2, VolumeX } from 'lucide-react';
import type { UserProfile } from '../game/types';
import { soundFx } from '../utils/sound';
import { AvatarPicker } from '../components/AvatarIcon';

interface SettingsPageProps {
  user: UserProfile;
  onBack: () => void;
  onSaveProfile: (input: { username: string; avatar: string }) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function SettingsPage({
  user,
  onBack,
  onSaveProfile,
  loading,
  error,
}: SettingsPageProps) {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar);
  const [muted, setMuted] = useState(soundFx.isMuted());
  const [musicOn, setMusicOn] = useState(soundFx.isMusicOn());
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(false);
    await onSaveProfile({ username, avatar });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2200);
  };

  const toggleSound = () => {
    const next = !muted;
    soundFx.setMuted(next);
    setMuted(next);
    if (next) setMusicOn(false);
  };

  const toggleMusic = () => {
    const next = soundFx.toggleMusic();
    setMusicOn(next);
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

        {/* Audio Preferences */}
        <section className="bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Table Audio &amp; Atmosphere</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={toggleSound}
              className={`flex items-center justify-between p-4 rounded-xl border text-left cursor-pointer ${
                !muted
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-white'
                  : 'bg-[#0B1120] border-white/10 text-slate-400'
              }`}
            >
              <div>
                <div className="text-sm font-semibold">Card Sound Effects</div>
                <div className="text-xs text-slate-400">
                  {muted ? 'Muted' : 'Active (deal, snap, Thulla alert)'}
                </div>
              </div>
              {muted ? (
                <VolumeX className="w-5 h-5 text-slate-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleMusic}
              className={`flex items-center justify-between p-4 rounded-xl border text-left cursor-pointer ${
                musicOn
                  ? 'bg-amber-500/15 border-amber-400/50 text-white'
                  : 'bg-[#0B1120] border-white/10 text-slate-400'
              }`}
            >
              <div>
                <div className="text-sm font-semibold">Ambient Table Synth</div>
                <div className="text-xs text-slate-400">
                  {musicOn ? 'Playing subtle loop' : 'Off'}
                </div>
              </div>
              <Music
                className={`w-5 h-5 ${
                  musicOn ? 'text-amber-400' : 'text-slate-400'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Profile Identity Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-5"
        >
          <div>
            <h1 className="text-xl font-bold text-white">Player Identity</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Update your table display name and card avatar.
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

          {savedNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs font-semibold text-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Profile updated successfully.
            </div>
          )}

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
              className="w-full px-4 py-2.5 rounded-xl bg-[#0B1120] border border-white/15 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </label>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-200 block">
              Card Avatar
            </span>
            <AvatarPicker value={avatar} onChange={setAvatar} />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
