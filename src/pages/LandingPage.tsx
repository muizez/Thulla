import { BookOpen, Bot, Globe, LogIn, Play, Users } from 'lucide-react';
import { motion } from 'motion/react';
import heroBackdrop from '../assets/images/thulla_hero_backdrop_1794737940680.jpg';

interface LandingPageProps {
  onQuickGuest: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onRules: () => void;
}

export function LandingPage({
  onQuickGuest,
  onLogin,
  onRegister,
  onRules,
}: LandingPageProps) {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#0B1120] flex flex-col justify-between">
      {/* Hostel card-night backdrop with rich emerald-navy scrim */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_40%,rgba(15,81,50,0.45),transparent_55%),radial-gradient(circle_at_25%_80%,rgba(245,158,11,0.12),transparent_48%)]" />
        <img
          src={heroBackdrop}
          alt="University hostel card table at night"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-right opacity-65"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120] via-[#0B1120]/90 to-[#0B1120]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-[#0B1120]/65" />
      </div>

      {/* Top minimal game bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 pt-6 flex items-center justify-between gap-4">
        <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
          THULLA · ٹھلہ
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onRules}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            Rules
          </button>
          <button
            type="button"
            onClick={onLogin}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-700/70 hover:bg-emerald-600 border border-emerald-500/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
        </div>
      </header>

      {/* Main Hero */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 py-10 flex-1 flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl space-y-7"
        >
          {/* Custom Card Table Emblem SVG */}
          <svg
            viewBox="0 0 470 96"
            className="w-full max-w-[440px] h-auto"
            role="img"
            aria-label="THULLA"
          >
            <rect
              x="6"
              y="18"
              width="42"
              height="58"
              rx="7"
              transform="rotate(-10 27 47)"
              fill="#0F5132"
              stroke="#F59E0B"
              strokeWidth="2"
            />
            <rect
              x="24"
              y="12"
              width="44"
              height="60"
              rx="7"
              fill="#FAF8F2"
              stroke="#E2E8F0"
              strokeWidth="1.5"
            />
            <path
              d="M46 27c-3.5 4.5-8 8-8 12.5a4.5 4.5 0 0 0 8 2.8 4.5 4.5 0 0 0 8-2.8C54 35 49.5 31.5 46 27z"
              fill="#111827"
            />
            <rect x="44.5" y="42" width="3" height="7" fill="#111827" />
            <text
              x="86"
              y="58"
              fill="#FFFFFF"
              fontFamily="Bricolage Grotesque, sans-serif"
              fontWeight="800"
              fontSize="52"
              letterSpacing="-1.5"
            >
              THULLA
            </text>
            <text
              x="88"
              y="82"
              fill="#FCD34D"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="600"
              fontSize="15"
              letterSpacing="1.4"
            >
              ٹھلہ · TRADITIONAL BHABHI CARD GAME
            </text>
          </svg>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight text-balance">
              Play Your Cards. Escape the Thulla.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              The Subcontinent’s classic 52-card shedding battle — rebuilt for late-night
              university hostel tables, private friend rooms, public matchmaking, and smart AI bots.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              data-start="true"
              onClick={onQuickGuest}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-950/50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Play Now as Guest
            </button>

            <button
              type="button"
              onClick={onRegister}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-400/40 text-white font-semibold text-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              Create Account
            </button>

            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-slate-100 font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          </div>

          {/* 3 Modes Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#111827]/80 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Users className="w-4 h-4" />
                Play with Friends
              </div>
              <p className="text-xs text-slate-400">
                Private 6-char room codes for 2–6 players with custom house rules.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#111827]/80 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <Bot className="w-4 h-4" />
                Play with AI Bots
              </div>
              <p className="text-xs text-slate-400">
                Solo practice vs Easy, Medium, or Hard strategic card bots.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#111827]/80 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
                <Globe className="w-4 h-4" />
                Online Multiplayer
              </div>
              <p className="text-xs text-slate-400">
                Join public campus tables or instant matchmaking in real time.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 pb-6">
        <p className="text-xs text-slate-500">
          Standard 52-card deck · Server-validated turns &amp; private hands · Press Enter to enter Guest Mode
        </p>
      </footer>
    </main>
  );
}
