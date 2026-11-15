package com.thulla.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "game_players")
public class GamePlayer {
  public enum ConnectionStatus { CONNECTED, DISCONNECTED }

  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "room_id", nullable = false, length = 36)
  private String roomId;

  @Column(name = "user_id", length = 36)
  private String userId;

  @Column(name = "display_name", nullable = false, length = 40)
  private String displayName;

  @Column(nullable = false, length = 32)
  private String avatar = "ace";

  @Column(name = "seat_position", nullable = false)
  private int seatPosition;

  @Column(name = "is_host", nullable = false)
  private boolean host = false;

  @Column(name = "is_bot", nullable = false)
  private boolean bot = false;

  @Enumerated(EnumType.STRING)
  @Column(name = "bot_difficulty")
  private GameRoom.BotDifficulty botDifficulty;

  @Column(name = "is_ready", nullable = false)
  private boolean ready = false;

  @Enumerated(EnumType.STRING)
  @Column(name = "connection_status", nullable = false)
  private ConnectionStatus connectionStatus = ConnectionStatus.CONNECTED;

  @Lob
  @Column(name = "hand_json", nullable = false)
  private String handJson = "[]";

  @Column(name = "finished_rank")
  private Integer finishedRank;

  @Column(name = "is_thulla_loser", nullable = false)
  private boolean thullaLoser = false;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getRoomId() { return roomId; }
  public void setRoomId(String roomId) { this.roomId = roomId; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getDisplayName() { return displayName; }
  public void setDisplayName(String displayName) { this.displayName = displayName; }
  public String getAvatar() { return avatar; }
  public void setAvatar(String avatar) { this.avatar = avatar; }
  public int getSeatPosition() { return seatPosition; }
  public void setSeatPosition(int seatPosition) { this.seatPosition = seatPosition; }
  public boolean isHost() { return host; }
  public void setHost(boolean host) { this.host = host; }
  public boolean isBot() { return bot; }
  public void setBot(boolean bot) { this.bot = bot; }
  public GameRoom.BotDifficulty getBotDifficulty() { return botDifficulty; }
  public void setBotDifficulty(GameRoom.BotDifficulty botDifficulty) { this.botDifficulty = botDifficulty; }
  public boolean isReady() { return ready; }
  public void setReady(boolean ready) { this.ready = ready; }
  public ConnectionStatus getConnectionStatus() { return connectionStatus; }
  public void setConnectionStatus(ConnectionStatus connectionStatus) { this.connectionStatus = connectionStatus; }
  public String getHandJson() { return handJson; }
  public void setHandJson(String handJson) { this.handJson = handJson; }
  public Integer getFinishedRank() { return finishedRank; }
  public void setFinishedRank(Integer finishedRank) { this.finishedRank = finishedRank; }
  public boolean isThullaLoser() { return thullaLoser; }
  public void setThullaLoser(boolean thullaLoser) { this.thullaLoser = thullaLoser; }
}
