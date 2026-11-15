package com.thulla.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.thulla.dto.ThullaDtos.*;
import com.thulla.entity.*;
import com.thulla.repository.*;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ThullaRoomService {
  private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  private final GameRoomRepository rooms;
  private final GamePlayerRepository players;
  private final GameSessionRepository sessions;
  private final GameMoveRepository moves;
  private final GameResultRepository results;
  private final UserRepository users;
  private final ThullaGameEngineService engine;
  private final ObjectMapper mapper;
  private final SimpMessagingTemplate messaging;
  private final SecureRandom random = new SecureRandom();

  public ThullaRoomService(
      GameRoomRepository rooms,
      GamePlayerRepository players,
      GameSessionRepository sessions,
      GameMoveRepository moves,
      GameResultRepository results,
      UserRepository users,
      ThullaGameEngineService engine,
      ObjectMapper mapper,
      SimpMessagingTemplate messaging) {
    this.rooms = rooms;
    this.players = players;
    this.sessions = sessions;
    this.moves = moves;
    this.results = results;
    this.users = users;
    this.engine = engine;
    this.mapper = mapper;
    this.messaging = messaging;
  }

  private String generateUniqueRoomCode() {
    String code;
    do {
      StringBuilder sb = new StringBuilder(6);
      for (int i = 0; i < 6; i++) {
        sb.append(CODE_CHARS.charAt(random.nextInt(CODE_CHARS.length())));
      }
      code = sb.toString();
    } while (rooms.existsByRoomCodeIgnoreCase(code));
    return code;
  }

  @Transactional
  public GameStateDto createRoom(User hostUser, CreateRoomRequest req) {
    GameRules rules = req.rules() != null ? req.rules() : new GameRules();
    rules.setId(UUID.randomUUID().toString());

    GameRoom room = new GameRoom();
    room.setId(UUID.randomUUID().toString());
    room.setRoomCode(generateUniqueRoomCode());
    room.setRoomName(req.roomName() != null && !req.roomName().isBlank()
        ? req.roomName().trim()
        : hostUser.getUsername() + "'s Thulla Table");
    room.setMode(req.mode() != null ? req.mode() : GameRoom.GameMode.FRIENDS);
    room.setStatus(GameRoom.RoomStatus.LOBBY);
    room.setHostUserId(hostUser.getId());
    room.setMaxPlayers(req.maxPlayers() != null ? req.maxPlayers() : 4);
    room.setBotCount(req.botCount() != null ? req.botCount() : 0);
    room.setBotDifficulty(req.botDifficulty() != null ? req.botDifficulty() : GameRoom.BotDifficulty.MEDIUM);
    room.setRules(rules);
    rooms.save(room);

    GamePlayer host = new GamePlayer();
    host.setId(UUID.randomUUID().toString());
    host.setRoomId(room.getId());
    host.setUserId(hostUser.getId());
    host.setDisplayName(hostUser.getUsername());
    host.setAvatar(hostUser.getAvatar());
    host.setSeatPosition(0);
    host.setHost(true);
    host.setReady(true);
    players.save(host);

    return buildState(room, hostUser.getId(), hostUser.getUsername() + " opened table.");
  }

  @Transactional
  public GameStateDto startMatch(String roomCode, User caller) {
    GameRoom room = rooms.findByRoomCodeIgnoreCase(roomCode)
        .orElseThrow(() -> new IllegalArgumentException("Room not found."));
    if (!room.getHostUserId().equals(caller.getId())) {
      throw new IllegalArgumentException("Only host can start the match.");
    }
    List<GamePlayer> seats = players.findByRoomIdOrderBySeatPositionAsc(room.getId());
    if (seats.size() < 2) {
      throw new IllegalArgumentException("At least 2 players are required.");
    }

    List<CardDto> shuffled = engine.shuffleDeck(engine.createStandardDeck());
    List<List<CardDto>> hands = engine.dealCards(shuffled, seats.size());
    int starterIndex = engine.determineStartingPlayerIndex(hands, room.getRules());

    for (int i = 0; i < seats.size(); i++) {
      GamePlayer gp = seats.get(i);
      gp.setFinishedRank(null);
      gp.setThullaLoser(false);
      gp.setHandJson(writeHand(hands.get(i)));
      players.save(gp);
    }

    room.setStatus(GameRoom.RoomStatus.PLAYING);
    rooms.save(room);

    GameSession session = new GameSession();
    session.setId(UUID.randomUUID().toString());
    session.setRoomId(room.getId());
    session.setRoomCode(room.getRoomCode());
    session.setRoomName(room.getRoomName());
    session.setMode(room.getMode());
    session.setStatus(GameSession.SessionStatus.PLAYING);
    session.setCurrentTurnPlayerId(seats.get(starterIndex).getId());
    sessions.save(session);

    GameStateDto state = buildState(room, caller.getId(), "Cards dealt! Match started.");
    messaging.convertAndSend("/topic/room/" + room.getRoomCode(), Map.of("type", "GAME_STARTED", "state", state));
    return state;
  }

  public GameStateDto getState(String roomCode, String viewerUserId) {
    GameRoom room = rooms.findByRoomCodeIgnoreCase(roomCode)
        .orElseThrow(() -> new IllegalArgumentException("Room not found."));
    return buildState(room, viewerUserId, "");
  }

  public List<GameMove> getMoveHistory(String gameId) {
    return moves.findBySessionIdOrderByMoveNumberAsc(gameId);
  }

  public List<User> getLeaderboard() {
    return users.findLeaderboardUsers();
  }

  public List<GameResult> getPlayerResults(String userId) {
    return results.findByUserIdOrderByIdDesc(userId);
  }

  private String writeHand(List<CardDto> hand) {
    try {
      return mapper.writeValueAsString(hand);
    } catch (Exception e) {
      throw new IllegalStateException("Failed to serialize hand", e);
    }
  }

  private List<CardDto> readHand(String json) {
    try {
      return mapper.readValue(json, new TypeReference<>() {});
    } catch (Exception e) {
      return List.of();
    }
  }

  private GameStateDto buildState(GameRoom room, String viewerUserId, String message) {
    List<GamePlayer> seats = players.findByRoomIdOrderBySeatPositionAsc(room.getId());
    Optional<GameSession> sessionOpt = sessions.findTopByRoomIdOrderByStartedAtDesc(room.getId());

    GamePlayer viewer = seats.stream()
        .filter(p -> Objects.equals(p.getUserId(), viewerUserId))
        .findFirst()
        .orElse(null);

    List<CardDto> myHand = viewer != null ? readHand(viewer.getHandJson()) : List.of();
    GameSession session = sessionOpt.orElse(null);
    List<String> playableIds = (session != null && viewer != null
        && Objects.equals(session.getCurrentTurnPlayerId(), viewer.getId()))
        ? engine.getLegalCards(myHand, session.getLeadingSuit(), room.getRules(), session.getMoveNumber() == 0)
            .stream().map(CardDto::id).toList()
        : List.of();

    List<PublicPlayerDto> publicPlayers = seats.stream().map(p -> new PublicPlayerDto(
        p.getId(),
        p.getUserId(),
        p.getDisplayName(),
        p.getAvatar(),
        p.getSeatPosition(),
        p.isHost(),
        p.isBot(),
        p.getBotDifficulty(),
        p.isReady(),
        p.getConnectionStatus().name(),
        readHand(p.getHandJson()).size(),
        p.getFinishedRank(),
        p.isThullaLoser()
    )).toList();

    return new GameStateDto(
        session != null ? session.getId() : room.getId(),
        room.getRoomCode(),
        room.getRoomName(),
        room.getMode(),
        room.getStatus(),
        seats.stream().filter(GamePlayer::isHost).map(GamePlayer::getId).findFirst().orElse(""),
        room.getMaxPlayers(),
        room.getBotCount(),
        room.getBotDifficulty(),
        room.getRules(),
        publicPlayers,
        myHand,
        playableIds,
        session != null ? session.getRoundNumber() : 1,
        session != null ? session.getTrickNumber() : 0,
        session != null ? session.getMoveNumber() : 0,
        session != null ? session.getCurrentTurnPlayerId() : null,
        session != null ? session.getLeadingSuit() : null,
        List.of(),
        0,
        message
    );
  }
}
