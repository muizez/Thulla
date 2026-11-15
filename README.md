# THULLA (ٹھلہ) — Traditional South Asian Multiplayer Card Game

**"Play Your Cards. Escape the Thulla."**

A full-stack digital adaptation of the traditional 52-card Subcontinent shedding game **Thulla** (also known as **Bhabhi**), supporting private multiplayer friend rooms, AI bots (Easy / Medium / Hard), public online matchmaking, player statistics, match replays, and customizable regional house rules.

## Live Preview Stack (Port 3000)

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Motion + Lucide React (`src/`)
- **Game Engine**: Pure TypeScript 52-card rules & AI engine (`src/game/engine.ts`) verified via `node:test`
- **Backend Server**: Node.js + Express + native `ws` WebSockets + SQLite (`server.ts`, `server/gameManager.ts`, `server/db.ts`)
- **Privacy & Integrity**: All card dealing, suit-following validation, and trick/Thulla resolution run server-side. Other players' hands are never leaked; clients only receive `myHand` and opponent `cardCount`.

## Spring Boot + MySQL Reference Backend (`backend-spring-boot/`)

A full layered Java 21 / Spring Boot 3 implementation alongside the MySQL 8+ schema (`database/schema.sql`) is included under `backend-spring-boot/`:
- **Entities**: `User`, `GameRoom`, `GamePlayer`, `GameSession`, `GameMove`, `GameResult`, `GameRules`
- **Services**: `ThullaGameEngineService`, `BotStrategyService`, `ThullaRoomService`, `AuthService` (BCrypt)
- **Controllers**: `AuthController`, `RoomController`, `GameController`, `PlayerController`, `GameWebSocketController`
- **Database**: `database/schema.sql` (`users`, `game_rules`, `game_rooms`, `game_players`, `game_sessions`, `game_moves`, `game_results`)

## Commands

```bash
npm install
npm run test    # Runs 52-card Thulla engine & bot unit tests
npm run build   # Production Vite build
npm run dev     # Starts full-stack Express + WebSocket + Vite server on port 3000
```
