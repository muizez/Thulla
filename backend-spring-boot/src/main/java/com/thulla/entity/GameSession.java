package com.thulla.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "game_sessions")
public class GameSession {
  public enum SessionStatus { PLAYING, FINISHED }
  public enum Suit { SPADES, HEARTS, DIAMONDS, CLUBS }

  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "room_id", nullable = false, length = 36)
  private String roomId;

  @Column(name = "room_code", nullable = false, length = 8)
  private String roomCode;

  @Column(name = "room_name", nullable = false, length = 80)
  private String roomName;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private GameRoom.GameMode mode;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SessionStatus status = SessionStatus.PLAYING;

  @Column(name = "round_number", nullable = false)
  private int roundNumber = 1;

  @Column(name = "trick_number", nullable = false)
  private int trickNumber = 1;

  @Column(name = "move_number", nullable = false)
  private int moveNumber = 0;

  @Column(name = "current_turn_player_id", length = 36)
  private String currentTurnPlayerId;

  @Enumerated(EnumType.STRING)
  @Column(name = "leading_suit")
  private Suit leadingSuit;

  @Column(name = "winner_name", length = 40)
  private String winnerName;

  @Column(name = "thulla_loser_name", length = 40)
  private String thullaLoserName;

  @Column(name = "started_at", nullable = false)
  private Instant startedAt = Instant.now();

  @Column(name = "ended_at")
  private Instant endedAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getRoomId() { return roomId; }
  public void setRoomId(String roomId) { this.roomId = roomId; }
  public String getRoomCode() { return roomCode; }
  public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
  public String getRoomName() { return roomName; }
  public void setRoomName(String roomName) { this.roomName = roomName; }
  public GameRoom.GameMode getMode() { return mode; }
  public void setMode(GameRoom.GameMode mode) { this.mode = mode; }
  public SessionStatus getStatus() { return status; }
  public void setStatus(SessionStatus status) { this.status = status; }
  public int getRoundNumber() { return roundNumber; }
  public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }
  public int getTrickNumber() { return trickNumber; }
  public void setTrickNumber(int trickNumber) { this.trickNumber = trickNumber; }
  public int getMoveNumber() { return moveNumber; }
  public void setMoveNumber(int moveNumber) { this.moveNumber = moveNumber; }
  public String getCurrentTurnPlayerId() { return currentTurnPlayerId; }
  public void setCurrentTurnPlayerId(String currentTurnPlayerId) { this.currentTurnPlayerId = currentTurnPlayerId; }
  public Suit getLeadingSuit() { return leadingSuit; }
  public void setLeadingSuit(Suit leadingSuit) { this.leadingSuit = leadingSuit; }
  public String getWinnerName() { return winnerName; }
  public void setWinnerName(String winnerName) { this.winnerName = winnerName; }
  public String getThullaLoserName() { return thullaLoserName; }
  public void setThullaLoserName(String thullaLoserName) { this.thullaLoserName = thullaLoserName; }
  public Instant getStartedAt() { return startedAt; }
  public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
  public Instant getEndedAt() { return endedAt; }
  public void setEndedAt(Instant endedAt) { this.endedAt = endedAt; }
}
