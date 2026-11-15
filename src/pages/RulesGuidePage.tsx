import { ArrowLeft, BookOpen, ShieldAlert, SlidersHorizontal, Sparkles } from 'lucide-react';

interface RulesGuidePageProps {
  onBack: () => void;
}

export function RulesGuidePage({ onBack }: RulesGuidePageProps) {
  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-100 px-4 sm:px-8 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <article className="bg-[#111827] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-7">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/35 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                How to Play Thulla (ٹھلہ / Bhabhi)
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Traditional South Asian 52-card shedding game — Play your cards and escape before you’re left holding the pile.
              </p>
            </div>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0B1120] border border-white/10 space-y-1.5">
              <h2 className="text-sm font-bold text-amber-300">
                1. Deal &amp; Starting Card
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                All 52 standard cards (2 to Ace across Spades, Hearts, Diamonds, and Clubs) are shuffled and dealt across 2–6 seated players. By default, whoever holds the <strong>Ace of Spades (A♠)</strong> opens Trick 1 by playing it.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1120] border border-white/10 space-y-1.5">
              <h2 className="text-sm font-bold text-emerald-300">
                2. Following Suit
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Each trick starts with the leader playing any card, establishing the <strong>leading suit</strong>. Every active player in turn order must play a card of that same suit if they hold one.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1120] border border-white/10 space-y-1.5">
              <h2 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                3. Off-Suit &ldquo;Thulla!&rdquo; Pickup
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                If you have none of the leading suit, you play any card from another suit (calling <strong>Thulla</strong>!). Under traditional rules, the player who currently holds the <strong>highest card in the leading suit</strong> must pick up all cards on the table into their hand and lead the next trick.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1120] border border-white/10 space-y-1.5">
              <h2 className="text-sm font-bold text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                4. Winning &amp; Escaping
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                If everyone follows suit, the trick is cleared to the discard pile and the highest card’s player leads next. Running out of cards lets you <strong>escape</strong>! The final player still holding cards receives the <strong>THULLA</strong>.
              </p>
            </div>
          </section>

          <section className="p-5 rounded-xl bg-[#0B1120] border border-white/10 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              Configurable Regional House Rules
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Because every hostel, city, and family plays slightly different variations, the room host can customize every rule in the lobby before dealing:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <li>• First Player Selection: A♠ holder, Host, or Random</li>
              <li>• First Trick Safety: Clear Trick 1 safely or allow immediate Thullas</li>
              <li>• Off-Suit Mode: Immediate Pickup, Finish Trick Then Pickup, or Discard</li>
              <li>• Turn Direction: Clockwise or Counter-Clockwise</li>
              <li>• Elimination: Immediate Escape at 0 cards or End-of-Trick</li>
              <li>• End Condition: Last Player Standing (Thulla) or First Winner</li>
            </ul>
          </section>
        </article>
      </div>
    </main>
  );
}
