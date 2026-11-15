package com.thulla.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "game_rules")
public class GameRules {
  public enum FirstPlayerSelection { STARTING_CARD, HOST, RANDOM }
  public enum TurnDirection { CLOCKWISE, COUNTER_CLOCKWISE }
  public enum OffSuitBehavior { IMMEDIATE_THULLA_PICKUP, COMPLETE_TRICK_THEN_PICKUP, DISCARD_WITHOUT_PICKUP }
  public enum TrickCollectionBehavior { DISCARD_PILE, HOLDER_KEEPS_COUNT }
  public enum EliminationRule { IMMEDIATE_ESCAPE, END_OF_TRICK_ESCAPE }
  public enum GameEndingCondition { LAST_PLAYER_STANDING, FIRST_WINNER }
  public enum TieHandling { FEWEST_CARDS, LOWEST_HIGH_CARD }

  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "preset_name", nullable = false, length = 64)
  private String presetName = "Traditional Thulla (Bhabhi)";

  @Enumerated(EnumType.STRING)
  @Column(name = "first_player_selection", nullable = false)
  private FirstPlayerSelection firstPlayerSelection = FirstPlayerSelection.STARTING_CARD;

  @Column(name = "starting_card_id", nullable = false, length = 4)
  private String startingCardId = "AS";

  @Column(name = "must_play_starting_card_on_first_turn", nullable = false)
  private boolean mustPlayStartingCardOnFirstTurn = true;

  @Enumerated(EnumType.STRING)
  @Column(name = "turn_direction", nullable = false)
  private TurnDirection turnDirection = TurnDirection.CLOCKWISE;

  @Column(name = "follow_suit_required", nullable = false)
  private boolean followSuitRequired = true;

  @Enumerated(EnumType.STRING)
  @Column(name = "off_suit_behavior", nullable = false)
  private OffSuitBehavior offSuitBehavior = OffSuitBehavior.IMMEDIATE_THULLA_PICKUP;

  @Column(name = "first_trick_safe", nullable = false)
  private boolean firstTrickSafe = true;

  @Enumerated(EnumType.STRING)
  @Column(name = "trick_collection_behavior", nullable = false)
  private TrickCollectionBehavior trickCollectionBehavior = TrickCollectionBehavior.DISCARD_PILE;

  @Enumerated(EnumType.STRING)
  @Column(name = "elimination_rule", nullable = false)
  private EliminationRule eliminationRule = EliminationRule.IMMEDIATE_ESCAPE;

  @Enumerated(EnumType.STRING)
  @Column(name = "game_ending_condition", nullable = false)
  private GameEndingCondition gameEndingCondition = GameEndingCondition.LAST_PLAYER_STANDING;

  @Enumerated(EnumType.STRING)
  @Column(name = "tie_handling", nullable = false)
  private TieHandling tieHandling = TieHandling.FEWEST_CARDS;

  @Column(name = "turn_timer_seconds", nullable = false)
  private int turnTimerSeconds = 30;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getPresetName() { return presetName; }
  public void setPresetName(String presetName) { this.presetName = presetName; }
  public FirstPlayerSelection getFirstPlayerSelection() { return firstPlayerSelection; }
  public void setFirstPlayerSelection(FirstPlayerSelection v) { this.firstPlayerSelection = v; }
  public String getStartingCardId() { return startingCardId; }
  public void setStartingCardId(String startingCardId) { this.startingCardId = startingCardId; }
  public boolean isMustPlayStartingCardOnFirstTurn() { return mustPlayStartingCardOnFirstTurn; }
  public void setMustPlayStartingCardOnFirstTurn(boolean v) { this.mustPlayStartingCardOnFirstTurn = v; }
  public TurnDirection getTurnDirection() { return turnDirection; }
  public void setTurnDirection(TurnDirection v) { this.turnDirection = v; }
  public boolean isFollowSuitRequired() { return followSuitRequired; }
  public void setFollowSuitRequired(boolean v) { this.followSuitRequired = v; }
  public OffSuitBehavior getOffSuitBehavior() { return offSuitBehavior; }
  public void setOffSuitBehavior(OffSuitBehavior v) { this.offSuitBehavior = v; }
  public boolean isFirstTrickSafe() { return firstTrickSafe; }
  public void setFirstTrickSafe(boolean v) { this.firstTrickSafe = v; }
  public TrickCollectionBehavior getTrickCollectionBehavior() { return trickCollectionBehavior; }
  public void setTrickCollectionBehavior(TrickCollectionBehavior v) { this.trickCollectionBehavior = v; }
  public EliminationRule getEliminationRule() { return eliminationRule; }
  public void setEliminationRule(EliminationRule v) { this.eliminationRule = v; }
  public GameEndingCondition getGameEndingCondition() { return gameEndingCondition; }
  public void setGameEndingCondition(GameEndingCondition v) { this.gameEndingCondition = v; }
  public TieHandling getTieHandling() { return tieHandling; }
  public void setTieHandling(TieHandling v) { this.tieHandling = v; }
  public int getTurnTimerSeconds() { return turnTimerSeconds; }
  public void setTurnTimerSeconds(int turnTimerSeconds) { this.turnTimerSeconds = turnTimerSeconds; }
}
