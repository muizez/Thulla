package com.thulla.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "game_rooms")
public class GameRoom {
  public enum GameMode { FRIENDS, BOTS, ONLINE }
  public enum RoomStatus { LOBBY, PLAYING, FINISHED }
  public enum BotDifficulty { EASY, MEDIUM, HARD }

  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "room_code", nullable = false, unique = true, length = 8)
  private String roomCode;

  @Column(name = "room_name", nullable = false, length = 80)
  private String roomName;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private GameMode mode = GameMode.FRIENDS;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private RoomStatus status = RoomStatus.LOBBY;

  @Column(name = "host_user_id", nullable = false, length = 36)
  private String hostUserId;

  @Column(name = "max_players", nullable = false)
  private int maxPlayers = 4;

  @Column(name = "bot_count", nullable = false)
  private int botCount = 0;

  @Enumerated(EnumType.STRING)
  @Column(name = "bot_difficulty", nullable = false)
  private BotDifficulty botDifficulty = BotDifficulty.MEDIUM;

  @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
  @JoinColumn(name = "rules_id", nullable = false)
  private GameRules rules;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getRoomCode() { return roomCode; }
  public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
  public String getRoomName() { return roomName; }
  public void setRoomName(String roomName) { this.roomName = roomName; }
  public GameMode getMode() { return mode; }
  public void setMode(GameMode mode) { this.mode = mode; }
  public RoomStatus getStatus() { return status; }
  public void setStatus(RoomStatus status) { this.status = status; }
  public String getHostUserId() { return hostUserId; }
  public void setHostUserId(String hostUserId) { this.hostUserId = hostUserId; }
  public int getMaxPlayers() { return maxPlayers; }
  public void setMaxPlayers(int maxPlayers) { this.maxPlayers = maxPlayers; }
  public int getBotCount() { return botCount; }
  public void setBotCount(int botCount) { this.botCount = botCount; }
  public BotDifficulty getBotDifficulty() { return botDifficulty; }
  public void setBotDifficulty(BotDifficulty botDifficulty) { this.botDifficulty = botDifficulty; }
  public GameRules getRules() { return rules; }
  public void setRules(GameRules rules) { this.rules = rules; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
