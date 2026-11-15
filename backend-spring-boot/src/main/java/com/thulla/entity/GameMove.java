package com.thulla.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "game_moves")
public class GameMove {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "session_id", nullable = false, length = 36)
  private String sessionId;

  @Column(name = "move_number", nullable = false)
  private int moveNumber;

  @Column(name = "trick_number", nullable = false)
  private int trickNumber;

  @Column(name = "player_id", nullable = false, length = 36)
  private String playerId;

  @Column(name = "player_name", nullable = false, length = 40)
  private String playerName;

  @Column(name = "card_id", nullable = false, length = 4)
  private String cardId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private GameSession.Suit suit;

  @Column(name = "card_rank", nullable = false, length = 3)
  private String cardRank;

  @Column(name = "is_off_suit", nullable = false)
  private boolean offSuit = false;

  @Column(nullable = false, length = 255)
  private String note;

  @Column(name = "played_at", nullable = false)
  private Instant playedAt = Instant.now();

  public Long getId() { return id; }
  public String getSessionId() { return sessionId; }
  public void setSessionId(String sessionId) { this.sessionId = sessionId; }
  public int getMoveNumber() { return moveNumber; }
  public void setMoveNumber(int moveNumber) { this.moveNumber = moveNumber; }
  public int getTrickNumber() { return trickNumber; }
  public void setTrickNumber(int trickNumber) { this.trickNumber = trickNumber; }
  public String getPlayerId() { return playerId; }
  public void setPlayerId(String playerId) { this.playerId = playerId; }
  public String getPlayerName() { return playerName; }
  public void setPlayerName(String playerName) { this.playerName = playerName; }
  public String getCardId() { return cardId; }
  public void setCardId(String cardId) { this.cardId = cardId; }
  public GameSession.Suit getSuit() { return suit; }
  public void setSuit(GameSession.Suit suit) { this.suit = suit; }
  public String getCardRank() { return cardRank; }
  public void setCardRank(String cardRank) { this.cardRank = cardRank; }
  public boolean isOffSuit() { return offSuit; }
  public void setOffSuit(boolean offSuit) { this.offSuit = offSuit; }
  public String getNote() { return note; }
  public void setNote(String note) { this.note = note; }
  public Instant getPlayedAt() { return playedAt; }
  public void setPlayedAt(Instant playedAt) { this.playedAt = playedAt; }
}
