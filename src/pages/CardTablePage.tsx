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
import {
  getOrderedTableSeats,
  type OrderedTableSeat,
  type SeatRelation,
} from '../game/tableLayout';
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

function relationLabel(
  relation: SeatRelation,
  stepIndex: number,
  playerCount: number
): string {
  if (relation === 'AFTER_YOU') return 'Plays After You';
  if (relation === 'BEFORE_YOU') return 'Played Before';
  if (playerCount === 2) return 'Across Table';
  return `Turn #${stepIndex + 1}`;
}

function SeatCard({
  seat,
  isTurn,
  playerCount,
  compact = false,
}: {
  seat: OrderedTableSeat;
  isTurn: boolean;
  playerCount: number;
  compact?: boolean;
}) {
  const opp = seat.player;
  const escaped = opp.finishedRank !== null;
  const relText = relationLabel(seat.relation, seat.stepIndex, playerCount);

  return (
    <div
      data-seat-relation={compact ? undefined : seat.relation}
      data-seat-step={compact ? undefined : seat.stepIndex}
      className={`${
        compact ? 'w-full' : 'w-[172px] lg:w-[196px]'
      } p-2.5 rounded-xl border backdrop-blur-sm transition-all flex items-center justify-between gap-2 ${
        isTurn
          ? 'bg-[#1a2234]/95 border-amber-400 shadow-lg shadow-amber-950/45'
          : escaped
            ? 'bg-emerald-950/60 border-emerald-500/40 opacity-85'
            : 'bg-[#111827]/95 border-white/15 shadow-md shadow-black/40'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <AvatarIcon avatarId={opp.avatar} size="sm" />
        <div className="min-w-0">
          <div className="text-xs font-bold text-white truncate flex items-center gap-1">
            <span className="truncate">{opp.username}</span>
            {opp.isBot && <Bot className="w-3 h-3 text-sky-400 shrink-0" />}
          </div>
          <div className="text-[10px] font-semibold tracking-tight text-slate-400">
            <span
              className={
                seat.relation === 'AFTER_YOU'
                  ? 'text-sky-300'
                  : seat.relation === 'BEFORE_YOU'
                    ? 'text-emerald-300'
                    : 'text-slate-400'
              }
            >
              {relText}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 tabular-nums">
            {escaped ? (
              <span className="text-emerald-300 font-semibold">
                Escaped #{opp.finishedRank}
              </span>
            ) : opp.connectionStatus === 'DISCONNECTED' ? (
              <span className="text-amber-400">Disconnected</span>
            ) : isTurn ? (
              <span className="text-amber-300 font-semibold">Thinking...</span>
            ) : (
              <span>{opp.cardCount} cards</span>
            )}
          </div>
        </div>
      </div>

      {!escaped && <CardBack count={opp.cardCount} />}
    </div>
  );
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
  const isMyTurn = Boolean(me && game.currentTurnPlayerId === me.id);
  const playableSet = new Set(game.playableCardIds);

  const { geometry, seats } = getOrderedTableSeats(
    game.players,
    currentUserId,
    game.rules.turnDirection
  );
  const opponentSeats = seats.filter((s) => s.stepIndex > 0);
  const selfSeat = seats.find((s) => s.stepIndex === 0);

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

  // Mobile ordering: Left column starts with AFTER_YOU (bottom-to-top flow), Right column ends with BEFORE_YOU
  const leftSplitCount = Math.ceil(opponentSeats.length / 2);
  const mobileLeftSeats = opponentSeats.slice(0, leftSplitCount);
  const mobileRightSeats = opponentSeats.slice(leftSplitCount).reverse();

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
          <div className="hidden sm:block text-xs text-slate-400">
            {geometry.shapeName} Table ({geometry.playerCount} Players)
          </div>
          <div className="hidden lg:block text-xs text-slate-400 tabular-nums">
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

      {/* CENTER: POLYGONAL FELT TABLE & CORNER SEATS */}
      <section className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-3 flex flex-col justify-center gap-3 relative">
        {/* Mobile Ordered Opponents Strip (< md): Left = Plays After You, Right = Played Before */}
        <div className="md:hidden space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>← Plays After You</span>
            <span className="font-semibold text-amber-300">
              {geometry.shapeName} ({geometry.playerCount} Corners)
            </span>
            <span>Played Before →</span>
          </div>
          <div className="grid grid-cols-2 gap-2 items-start">
            <div className="space-y-2">
              {mobileLeftSeats.map((seat) => (
                <SeatCard
                  key={`m-${seat.player.id}`}
                  seat={seat}
                  isTurn={seat.player.id === game.currentTurnPlayerId}
                  playerCount={geometry.playerCount}
                  compact={true}
                />
              ))}
            </div>
            <div className="space-y-2">
              {mobileRightSeats.map((seat) => (
                <SeatCard
                  key={`m-${seat.player.id}`}
                  seat={seat}
                  isTurn={seat.player.id === game.currentTurnPlayerId}
                  playerCount={geometry.playerCount}
                  compact={true}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Polygonal Table Stage */}
        <div
          data-testid="table-arena"
          data-table-shape={geometry.shapeName}
          data-table-corners={geometry.playerCount}
          className="relative mx-auto w-full max-w-[880px] md:aspect-[5/3] flex items-center justify-center"
        >
          {/* Desktop Polygonal Felt SVG (Triangle / Square / Pentagon / Hexagon) */}
          <svg
            viewBox={`0 0 ${geometry.svgViewBoxWidth} ${geometry.svgViewBoxHeight}`}
            className="hidden md:block absolute inset-0 w-full h-full pointer-events-none select-none overflow-visible drop-shadow-[0_22px_50px_rgba(0,0,0,0.72)]"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="thullaFelt" cx="50%" cy="50%" r="58%">
                <stop offset="0%" stopColor="#17784b" />
                <stop offset="55%" stopColor="#0F5132" />
                <stop offset="100%" stopColor="#072c1a" />
              </radialGradient>
              <marker
                id="turnFlowArrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 1 1.5 L 8.5 5 L 1 8.5 z" fill="#F59E0B" fillOpacity="0.65" />
              </marker>
            </defs>

            {/* Wooden Rim + Felt Surface */}
            <path
              d={geometry.outerPath}
              fill="url(#thullaFelt)"
              stroke="#3B2314"
              strokeWidth="16"
              strokeLinejoin="round"
            />

            {/* Gold Table Trim */}
            <path
              d={geometry.innerTrimPath}
              fill="none"
              stroke="#F59E0B"
              strokeOpacity="0.36"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Clockwise Turn-Flow Arrows Around Inner Felt */}
            {geometry.turnArcPaths.map((d, idx) => (
              <path
                key={idx}
                d={d}
                fill="none"
                stroke="#F59E0B"
                strokeOpacity="0.38"
                strokeWidth="2"
                strokeDasharray="5 5"
                markerEnd="url(#turnFlowArrow)"
              />
            ))}

            {/* Corner Brass Markers at Each Polygon Vertex */}
            {geometry.vertices.map((v, idx) => (
              <circle
                key={idx}
                cx={v.x}
                cy={v.y}
                r="5"
                fill="#F59E0B"
                fillOpacity="0.65"
                stroke="#3B2314"
                strokeWidth="2"
              />
            ))}
          </svg>

          {/* Desktop Corner Seats Positioned on Each Polygon Vertex */}
          <div
            className="hidden md:block absolute inset-0 pointer-events-none"
            data-testid="opponents-row"
          >
            {opponentSeats.map((seat) => (
              <div
                key={seat.player.id}
                style={{
                  left: `${seat.xPercent}%`,
                  top: `${seat.yPercent}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-20"
              >
                <SeatCard
                  seat={seat}
                  isTurn={seat.player.id === game.currentTurnPlayerId}
                  playerCount={geometry.playerCount}
                />
              </div>
            ))}

            {/* Bottom Corner Anchor for Current Player ("YOU") */}
            {selfSeat && (
              <div
                style={{
                  left: `${selfSeat.xPercent}%`,
                  top: `${selfSeat.yPercent}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-20 flex items-center gap-2"
              >
                {geometry.playerCount >= 3 && (
                  <span className="px-2 py-1 rounded-md bg-[#0B1324]/90 border border-sky-400/30 text-[10px] font-semibold text-sky-300 whitespace-nowrap">
                    ← Next (Left)
                  </span>
                )}
                <div
                  data-seat-relation="SELF"
                  data-seat-step={0}
                  className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap shadow-md ${
                    isMyTurn
                      ? 'bg-amber-500 border-amber-300 text-slate-950'
                      : 'bg-[#111827]/95 border-emerald-400/45 text-emerald-200'
                  }`}
                >
                  YOU · {selfSeat.player.username}
                </div>
                {geometry.playerCount >= 3 && (
                  <span className="px-2 py-1 rounded-md bg-[#0B1324]/90 border border-emerald-400/30 text-[10px] font-semibold text-emerald-300 whitespace-nowrap">
                    Prev (Right) →
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Center Felt Interior (Single Trick Pile & Metadata for Both Mobile & Desktop) */}
          <div className="relative z-10 w-full md:w-auto rounded-[32px] md:rounded-none bg-[radial-gradient(ellipse_at_center,#146c43_0%,#0F5132_55%,#08331e_100%)] md:bg-none border-[6px] md:border-0 border-[#3B2314] px-5 py-6 md:p-0 min-h-[235px] md:min-h-0 md:absolute md:inset-x-[30%] md:inset-y-[24%] flex flex-col items-center justify-between gap-2">
            {/* Trick Metadata Strip */}
            <div className="w-full flex flex-wrap items-center justify-center gap-1.5 text-xs">
              <div className="px-2.5 py-1 rounded-lg bg-black/45 text-amber-200 font-medium whitespace-nowrap">
                {game.leadingSuit ? (
                  <span>
                    Lead:{' '}
                    <strong className="text-white">
                      {SUIT_SYMBOL[game.leadingSuit]} {game.leadingSuit}
                    </strong>
                  </span>
                ) : (
                  <span>Fresh Trick — Lead Any Card</span>
                )}
              </div>

              {secondsLeft !== null && (
                <span
                  className={`px-2 py-1 rounded-lg bg-black/50 font-mono font-bold tabular-nums whitespace-nowrap ${
                    secondsLeft <= 7 ? 'text-rose-300' : 'text-amber-300'
                  }`}
                >
                  {secondsLeft}s
                </span>
              )}
              <span className="px-2.5 py-1 rounded-lg bg-black/45 text-emerald-100 whitespace-nowrap max-w-[190px] truncate">
                Turn:{' '}
                <strong className="text-white">
                  {activeTurnPlayer?.username ?? '—'}
                </strong>
              </span>
            </div>

            {/* Center Trick Cards */}
            <div
              data-testid="trick-pile"
              className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 min-h-[105px]"
            >
              <AnimatePresence>
                {game.currentTrick.length === 0 ? (
                  <motion.div
                    key="empty-trick"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center space-y-1 text-emerald-100/80 px-2"
                  >
                    <div className="text-sm font-semibold">
                      {isMyTurn
                        ? 'Your lead! Pick a card below to start the trick.'
                        : `Waiting for ${activeTurnPlayer?.username ?? 'leader'} to lead...`}
                    </div>
                    <div className="text-xs text-emerald-200/65">
                      {game.rules.firstTrickSafe && game.trickNumber === 1
                        ? 'Trick 1 is safe (no Thulla pickup on Trick 1).'
                        : 'Match the lead suit or drop an off-suit Thulla!'}
                    </div>
                  </motion.div>
                ) : (
                  game.currentTrick.map((play) => (
                    <motion.div
                      key={`${play.moveNumber}-${play.card.id}`}
                      initial={{ opacity: 0, y: 20, scale: 0.85 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="flex flex-col items-center gap-1"
                    >
                      <PlayingCard card={play.card} compact={true} />
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded bg-black/50 ${
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
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/85 border border-rose-400/50 text-xs font-bold text-rose-200">
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
