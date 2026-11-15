package com.thulla.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {
  @Id
  @Column(length = 36)
  private String id;

  @Column(nullable = false, unique = true, length = 40)
  private String username;

  @Column(unique = true, length = 120)
  private String email;

  @Column(name = "password_hash")
  private String passwordHash;

  @Column(nullable = false, length = 32)
  private String avatar = "ace";

  @Column(name = "is_guest", nullable = false)
  private boolean guest = false;

  @Column(name = "total_games", nullable = false)
  private int totalGames = 0;

  @Column(name = "total_wins", nullable = false)
  private int totalWins = 0;

  @Column(name = "total_losses", nullable = false)
  private int totalLosses = 0;

  @Column(name = "best_streak", nullable = false)
  private int bestStreak = 0;

  @Column(name = "current_streak", nullable = false)
  private int currentStreak = 0;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUsername() { return username; }
  public void setUsername(String username) { this.username = username; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
  public String getAvatar() { return avatar; }
  public void setAvatar(String avatar) { this.avatar = avatar; }
  public boolean isGuest() { return guest; }
  public void setGuest(boolean guest) { this.guest = guest; }
  public int getTotalGames() { return totalGames; }
  public void setTotalGames(int totalGames) { this.totalGames = totalGames; }
  public int getTotalWins() { return totalWins; }
  public void setTotalWins(int totalWins) { this.totalWins = totalWins; }
  public int getTotalLosses() { return totalLosses; }
  public void setTotalLosses(int totalLosses) { this.totalLosses = totalLosses; }
  public int getBestStreak() { return bestStreak; }
  public void setBestStreak(int bestStreak) { this.bestStreak = bestStreak; }
  public int getCurrentStreak() { return currentStreak; }
  public void setCurrentStreak(int currentStreak) { this.currentStreak = currentStreak; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
