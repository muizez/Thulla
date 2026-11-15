import { SlidersHorizontal } from 'lucide-react';
import {
  RULE_PRESETS,
  type EliminationRule,
  type FirstPlayerSelection,
  type GameEndingCondition,
  type GameRulesConfig,
  type OffSuitBehavior,
  type TieHandling,
  type TrickCollectionBehavior,
  type TurnDirection,
} from '../game/types';

interface GameRulesEditorProps {
  rules: GameRulesConfig;
  canEdit: boolean;
  onChange: (next: GameRulesConfig) => void;
}

export function GameRulesEditor({
  rules,
  canEdit,
  onChange,
}: GameRulesEditorProps) {
  const update = (patch: Partial<GameRulesConfig>) => {
    onChange({ ...rules, ...patch, presetName: 'Custom House Rules' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            Customizable House Rules
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Traditional Thulla rules vary across families and campuses — tailor every rule before dealing.
          </p>
        </div>
        {!canEdit && (
          <span className="text-xs text-slate-400">Host controls rules</span>
        )}
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(RULE_PRESETS).map((key) => {
          const active = rules.presetName === key;
          return (
            <button
              key={key}
              type="button"
              disabled={!canEdit}
              onClick={() => onChange(RULE_PRESETS[key])}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                active
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] border border-white/10'
              }`}
            >
              {key}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-300">
            First Player Selection
          </span>
          <select
            disabled={!canEdit}
            value={rules.firstPlayerSelection}
            onChange={(e) =>
              update({
                firstPlayerSelection: e.target.value as FirstPlayerSelection,
              })
            }
            className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-white/15 text-xs text-white disabled:opacity-60"
          >
            <option value="STARTING_CARD">Holder of Starting Card</option>
            <option value="HOST">Room Host Leads</option>
            <option value="RANDOM">Random Player</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-300">
            Starting Card
          </span>
          <select
            disabled={!canEdit || rules.firstPlayerSelection !== 'STARTING_CARD'}
            value={rules.startingCardId}
            onChange={(e) => update({ startingCardId: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-white/15 text-xs text-white disabled:opacity-50"
          >
            <option value="AS">Ace of Spades (A♠)</option>
            <option value="2C">2 of Clubs (2♣)</option>
            <option value="AH">Ace of Hearts (A♥)</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-300">
            Turn Direction
          </span>
          <select
            disabled={!canEdit}
            value={rules.turnDirection}
            onChange={(e) =>
              update({ turnDirection: e.target.value as TurnDirection })
            }
            className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-white/15 text-xs text-white disabled:opacity-60"
          >
            <option value="CLOCKWISE">Clockwise</option>
            <option value="COUNTER_CLOCKWISE">Counter-Clockwise</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-300">
            Off-Suit (Thulla) Handling
          </span>
          <select
            disabled={!canEdit}
            value={rules.offSuitBehavior}
            onChange={(e) =>
              update({ offSuitBehavior: e.target.value as OffSuitBehavior })
            }
            className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-white/15 text-xs text-white disabled:opacity-60"
          >
            <option value="IMMEDIATE_THULLA_PICKUP">
              Immediate Thulla Pickup
            </option>
            <option value="COMPLETE_TRICK_THEN_PICKUP">
              Finish Trick Then Pickup
            </option>
            <option value="DISCARD_WITHOUT_PICKUP">
              Discard Without Pickup
            </option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-300">
            Trick Collection
          </span>
          <select
            disabled={!canEdit}
            value={rules.trickCollectionBehavior}
            onChange={(e) =>
              update({
                trickCollectionBehavior: e.target
                  .value as TrickCollectionBehavior,
              })
            }
            className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-white/15 text-xs text-white disabled:opacity-60"
          >
            <option value="DISCARD_PILE">Clear to Discard Pile</option>
            <option value="HOLDER_KEEPS_COUNT">Track Trick Winner Pile</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-300">
            Player Escape / Elimination
          </span>
          <select
            disabled={!canEdit}
            value={rules.eliminationRule}
            onChange={(e) =>
              update({ eliminationRule: e.target.value as EliminationRule })
            }
            className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-white/15 text-xs text-white disabled:opacity-60"
          >
            <option value="IMMEDIATE_ESCAPE">Escape at 0 Cards</option>
            <option value="END_OF_TRICK_ESCAPE">Escape After Trick</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-300">
            Game Ending Condition
          </span>
          <select
            disabled={!canEdit}
            value={rules.gameEndingCondition}
            onChange={(e) =>
              update({
                gameEndingCondition: e.target.value as GameEndingCondition,
              })
            }
            className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-white/15 text-xs text-white disabled:opacity-60"
          >
            <option value="LAST_PLAYER_STANDING">
              Last Standing = Thulla
            </option>
            <option value="FIRST_WINNER">First to 0 Cards Wins</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-300">
            Tie Handling
          </span>
          <select
            disabled={!canEdit}
            value={rules.tieHandling}
            onChange={(e) =>
              update({ tieHandling: e.target.value as TieHandling })
            }
            className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-white/15 text-xs text-white disabled:opacity-60"
          >
            <option value="FEWEST_CARDS">Fewest Remaining Cards</option>
            <option value="LOWEST_HIGH_CARD">Lowest Highest-Card Rank</option>
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-slate-300">
            Turn Timer (sec, 0 = off)
          </span>
          <input
            type="number"
            min={0}
            max={120}
            step={5}
            disabled={!canEdit}
            value={rules.turnTimerSeconds}
            onChange={(e) =>
              update({
                turnTimerSeconds: Math.max(0, Number(e.target.value) || 0),
              })
            }
            className="w-full px-3 py-2 rounded-lg bg-[#0B1120] border border-white/15 text-xs text-white tabular-nums disabled:opacity-60"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0B1120] border border-white/10 cursor-pointer">
          <span className="text-xs text-slate-200">Must Follow Suit</span>
          <input
            type="checkbox"
            disabled={!canEdit}
            checked={rules.followSuitRequired}
            onChange={(e) => update({ followSuitRequired: e.target.checked })}
            className="w-4 h-4 accent-amber-500"
          />
        </label>

        <label className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0B1120] border border-white/10 cursor-pointer">
          <span className="text-xs text-slate-200">First Trick Safe (No Pickup)</span>
          <input
            type="checkbox"
            disabled={!canEdit}
            checked={rules.firstTrickSafe}
            onChange={(e) => update({ firstTrickSafe: e.target.checked })}
            className="w-4 h-4 accent-amber-500"
          />
        </label>

        <label className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#0B1120] border border-white/10 cursor-pointer">
          <span className="text-xs text-slate-200">Force A♠ on Trick 1</span>
          <input
            type="checkbox"
            disabled={!canEdit}
            checked={rules.mustPlayStartingCardOnFirstTurn}
            onChange={(e) =>
              update({ mustPlayStartingCardOnFirstTurn: e.target.checked })
            }
            className="w-4 h-4 accent-amber-500"
          />
        </label>
      </div>
    </div>
  );
}
