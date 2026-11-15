package com.thulla.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "game_results")
public class GameResult {
  public enum Outcome { WINNER, ESCAPED, THULLA }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "session_id", nullable = false, length = 36)
  private String sessionId;

  @Column(name = "user_id", length = 36)
  private String userId;

  @Column(name = "player_name", nullable = false, length = 40)
  private String playerName;

  @Column(nullable = false, length = 32)
  private String avatar = "ace";

  @Column(name = "is_bot", nullable = false)
  private boolean bot = false;

  @Column(name = "final_position", nullable = false)
  private int finalPosition;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Outcome outcome;

  @Column(name = "cards_remaining", nullable = false)
  private int cardsRemaining = 0;

  @Column(nullable = false)
  private int score = 0;

  public Long getId() { return id; }
  public String getSessionId() { return sessionId; }
  public void setSessionId(String sessionId) { this.sessionId = sessionId; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getPlayerName() { return playerName; }
  public void setPlayerName(String playerName) { this.playerName = playerName; }
  public String getAvatar() { return avatar; }
  public void setAvatar(String avatar) { this.avatar = avatar; }
  public boolean isBot() { return bot; }
  public void setBot(boolean bot) { this.bot = bot; }
  public int getFinalPosition() { return finalPosition; }
  public void setFinalPosition(int finalPosition) { this.finalPosition = finalPosition; }
  public Outcome getOutcome() { return outcome; }
  public void setOutcome(Outcome outcome) { this.outcome = outcome; }
  public int getCardsRemaining() { return cardsRemaining; }
  public void setCardsRemaining(int cardsRemaining) { this.cardsRemaining = cardsRemaining; }
  public int getScore() { return score; }
  public void setScore(int score) { this.score = score; }
}
