import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  LogOut,
  Music,
  Play,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { PublicGameState } from '../game/types';
import { soundFx } from '../utils/sound';
import { AvatarIcon } from '../components/AvatarIcon';
import { CardBack, PlayingCard, SUIT_SYMBOL } from '../components/PlayingCard';

interface CardTablePageProps {
  game: PublicGameState;
  currentUserId: string;
  wsConnected: boolean;
  error: string | null;
  onPlayCard: (cardId: string) => void;
  onLeaveRoom: () => void;
}

export function CardTablePage({
  game,
  currentUserId,
  wsConnected,
  error,
  onPlayCard,
  onLeaveRoom,
}: CardTablePageProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [muted, setMuted] = useState(soundFx.isMuted());
  const [musicOn, setMusicOn] = useState(soundFx.isMusicOn());
  const [showLog, setShowLog] = useState(false);

  const me = game.players.find((p) => p.userId === currentUserId);
  const myIndex = game.players.findIndex((p) => p.userId === currentUserId);
  const isMyTurn = Boolean(me && game.currentTurnPlayerId === me.id);
  const playableSet = new Set(game.playableCardIds);

  // Arrange opponents clockwise starting after current player
  const opponents =
    myIndex >= 0
      ? [
          ...game.players.slice(myIndex + 1),
          ...game.players.slice(0, myIndex),
        ]
      : game.players;

  // Clear selection whenever turn changes or card leaves hand
  useEffect(() => {
    if (!isMyTurn || (selectedCardId && !playableSet.has(selectedCardId))) {
      setSelectedCardId(null);
    }
  }, [isMyTurn, game.moveNumber, selectedCardId]);

  // Turn notification chime
  useEffect(() => {
    if (isMyTurn) {
      soundFx.playTurnNotify();
    }
  }, [isMyTurn, game.moveNumber]);

  // Thulla pickup audio cue
  useEffect(() => {
    if (game.lastThullaEvent) {
      soundFx.playThullaAlert();
    }
  }, [game.lastThullaEvent?.timestamp]);

  // Turn countdown timer
  useEffect(() => {
    if (!game.turnDeadlineAt) {
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      const rem = Math.max(
        0,
        Math.ceil((game.turnDeadlineAt! - Date.now()) / 1000)
      );
      setSecondsLeft(rem);
    };
    tick();
    const id = window.setInterval(tick, 400);
    return () => window.clearInterval(id);
  }, [game.turnDeadlineAt]);

  const handleSubmitCard = (cardId?: string) => {
    const target = cardId ?? selectedCardId;
    if (!target || !isMyTurn || !playableSet.has(target)) return;
    soundFx.playCardPlace();
    onPlayCard(target);
    setSelectedCardId(null);
  };

  const toggleMute = () => {
    const next = !muted;
    soundFx.setMuted(next);
    setMuted(next);
    if (next) setMusicOn(false);
  };

  const toggleMusic = () => {
    const next = soundFx.toggleMusic();
    setMusicOn(next);
  };

  const activeTurnPlayer = game.players.find(
    (p) => p.id === game.currentTurnPlayerId
  );

  return (
    <main className="min-h-screen bg-[#080E1A] text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* TOP BAR */}
      <header className="border-b border-white/10 bg-[#0B1324]/95 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <span className="font-display text-base sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
            THULLA
          </span>
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <span>Room</span>
            <span className="font-mono font-bold text-amber-300">
              {game.roomCode}
            </span>
          </div>
          <div className="text-xs text-slate-300 tabular-nums">
            Trick <strong className="font-mono text-white">#{game.trickNumber}</strong>
          </div>
          <div className="hidden sm:block text-xs text-slate-400 tabular-nums">
            Discard: {game.discardCount} cards
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111827] border border-white/10 text-xs">
            {wsConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 hidden sm:inline">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300 hidden sm:inline">Syncing</span>
              </>
            )}
          </span>

          <button
            type="button"
            onClick={toggleMusic}
            aria-label="Toggle ambient music"
            className={`p-2 rounded-lg border cursor-pointer ${
              musicOn
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 cursor-pointer"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-300" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowLog((v) => !v)}
            className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-slate-200 cursor-pointer"
          >
            {showLog ? 'Hide Log' : 'Move Log'}
          </button>

          <button
            type="button"
            onClick={onLeaveRoom}
            aria-label="Leave match"
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 border border-white/10 text-slate-300 hover:text-rose-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="mx-auto mt-3 px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs font-medium text-rose-200"
        >
          {error}
        </div>
      )}

      {/* CENTER: OPPONENTS + GREEN FELT CARD TABLE */}
      <section className="flex-1 w-full max-w-6xl mx-auto px-4 py-4 flex flex-col justify-center gap-4 relative">
        {/* Opponent Seats Around Top/Sides of Table */}
        <div
          className="flex flex-wrap items-center justify-center gap-3"
          data-testid="opponents-row"
        >
          {opponents.map((opp) => {
            const isTurn = opp.id === game.currentTurnPlayerId;
            const escaped = opp.finishedRank !== null;
            return (
              <div
                key={opp.id}
                className={`w-[195px] sm:w-[220px] p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                  isTurn
                    ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-950/30'
                    : escaped
                      ? 'bg-emerald-950/35 border-emerald-500/35 opacity-80'
                      : 'bg-[#111827]/90 border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AvatarIcon avatarId={opp.avatar} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                      {opp.username}
                      {opp.isBot && <Bot className="w-3 h-3 text-sky-400 shrink-0" />}
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      {escaped ? (
                        <span className="text-emerald-300 font-semibold">
                          Escaped #{opp.finishedRank}
                        </span>
                      ) : opp.connectionStatus === 'DISCONNECTED' ? (
                        <span className="text-amber-400">Disconnected</span>
                      ) : isTurn ? (
                        <span className="text-amber-300 font-semibold">
                          Thinking...
                        </span>
                      ) : (
                        <span>{opp.cardCount} cards</span>
                      )}
                    </div>
                  </div>
                </div>

                {!escaped && <CardBack count={opp.cardCount} />}
              </div>
            );
          })}
        </div>

        {/* Physical Oval Green Felt Card Table */}
        <div className="relative mx-auto w-full max-w-4xl rounded-[40px] sm:rounded-[88px] bg-[radial-gradient(ellipse_at_center,#146c43_0%,#0F5132_52%,#08331e_100%)] border-[8px] border-[#3B2314] shadow-[0_20px_60px_rgba(0,0,0,0.7),inset_0_0_0_2px_rgba(245,158,11,0.35)] px-6 py-8 sm:py-10 min-h-[250px] sm:min-h-[290px] flex flex-col items-center justify-between gap-5">
          {/* Trick Metadata Strip */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="px-3 py-1 rounded-lg bg-black/30 text-amber-200 font-medium">
              {game.leadingSuit ? (
                <span>
                  Lead Suit:{' '}
                  <strong className="text-white">
                    {SUIT_SYMBOL[game.leadingSuit]} {game.leadingSuit}
                  </strong>
                </span>
              ) : (
                <span>Fresh Trick — Leader Plays Any Card</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {secondsLeft !== null && (
                <span
                  className={`px-3 py-1 rounded-lg bg-black/35 font-mono font-bold tabular-nums ${
                    secondsLeft <= 7 ? 'text-rose-300' : 'text-amber-300'
                  }`}
                >
                  {secondsLeft}s
                </span>
              )}
              <span className="px-3 py-1 rounded-lg bg-black/30 text-emerald-100">
                Turn:{' '}
                <strong className="text-white">
                  {activeTurnPlayer?.username ?? '—'}
                </strong>
              </span>
            </div>
          </div>

          {/* Center Trick Cards */}
          <div
            data-testid="trick-pile"
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 min-h-[115px]"
          >
            <AnimatePresence>
              {game.currentTrick.length === 0 ? (
                <motion.div
                  key="empty-trick"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-1 text-emerald-100/75"
                >
                  <div className="text-sm font-semibold">
                    {isMyTurn
                      ? 'Your lead! Pick a card below to start the trick.'
                      : `Waiting for ${activeTurnPlayer?.username ?? 'leader'} to lead...`}
                  </div>
                  <div className="text-xs text-emerald-200/60">
                    {game.rules.firstTrickSafe && game.trickNumber === 1
                      ? 'Trick 1 is safe (no Thulla pickup on Trick 1).'
                      : 'Match the lead suit or drop an off-suit Thulla!'}
                  </div>
                </motion.div>
              ) : (
                game.currentTrick.map((play) => (
                  <motion.div
                    key={`${play.moveNumber}-${play.card.id}`}
                    initial={{ opacity: 0, y: 24, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <PlayingCard card={play.card} compact={true} />
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded bg-black/45 ${
                        play.isOffSuit ? 'text-rose-300' : 'text-emerald-100'
                      }`}
                    >
                      {play.username}
                      {play.isOffSuit ? ' · THULLA!' : ''}
                    </span>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Live Event / Thulla Alert Footer */}
          <div className="w-full text-center">
            {game.lastThullaEvent &&
            Date.now() - game.lastThullaEvent.timestamp < 5000 ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-950/80 border border-rose-400/50 text-xs font-bold text-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                {game.lastEventMessage}
              </div>
            ) : (
              <p
                data-testid="table-status-message"
                className="text-xs font-medium text-emerald-100/90"
              >
                {game.lastEventMessage}
              </p>
            )}
          </div>
        </div>

        {/* Collapsible Move History Drawer */}
        {showLog && (
          <div className="max-w-4xl w-full mx-auto bg-[#111827] border border-white/10 rounded-xl p-4">
            <h3 className="text-xs font-bold text-white mb-2">Recent Trick Moves</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto text-xs text-slate-300">
              {game.recentMoves.map((m) => (
                <div key={m.moveNumber} className="font-mono text-[11px]">
                  #{m.moveNumber} (T{m.trickNumber}) {m.username}: {m.note}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* BOTTOM: CURRENT PLAYER HAND & PLAY ACTION */}
      <footer className="border-t border-white/10 bg-[#0B1324]/95 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto space-y-3">
          {/* Player Identity & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {me && <AvatarIcon avatarId={me.avatar} size="sm" />}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {me?.username ?? 'Spectator'}
                  </span>
                  {me?.finishedRank !== null && me?.finishedRank !== undefined ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Escaped #{me.finishedRank}
                    </span>
                  ) : isMyTurn ? (
                    <span
                      data-testid="your-turn-indicator"
                      className="text-xs font-bold text-amber-300"
                    >
                      · YOUR TURN
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      · Waiting for {activeTurnPlayer?.username}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 tabular-nums">
                  Your Hand: {game.myHand.length} cards
                  {isMyTurn && game.playableCardIds.length > 0 && (
                    <> · {game.playableCardIds.length} legal cards highlighted</>
                  )}
                </div>
              </div>
            </div>

            {isMyTurn && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {selectedCardId
                    ? `Selected: ${selectedCardId}`
                    : 'Tap a highlighted card, then Play Card'}
                </span>
                <button
                  type="button"
                  disabled={!selectedCardId}
                  onClick={() => handleSubmitCard()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Play Card
                </button>
              </div>
            )}
          </div>

          {/* Horizontal Playable Hand */}
          {game.myHand.length > 0 && (
            <div
              data-testid="player-hand"
              className={`flex items-end overflow-x-auto pb-2 pt-5 px-2 ${
                game.myHand.length > 10
                  ? 'gap-1 sm:gap-1.5 md:justify-center'
                  : 'gap-1.5 sm:gap-2 md:justify-center'
              }`}
            >
              {game.myHand.map((card) => {
                const isLegal = isMyTurn && playableSet.has(card.id);
                const isDisabled = !isMyTurn || !isLegal;
                return (
                  <div key={card.id} className="shrink-0">
                    <PlayingCard
                      card={card}
                      playable={isLegal}
                      selected={selectedCardId === card.id}
                      disabled={isDisabled}
                      onClick={() => {
                        soundFx.playCardSelect();
                        setSelectedCardId((prev) =>
                          prev === card.id ? null : card.id
                        );
                      }}
                      onDoubleClick={() => handleSubmitCard(card.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}
