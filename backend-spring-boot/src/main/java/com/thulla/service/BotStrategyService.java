package com.thulla.service;

import com.thulla.dto.ThullaDtos.CardDto;
import com.thulla.dto.ThullaDtos.TrickPlayDto;
import com.thulla.entity.GameRoom;
import com.thulla.entity.GameRules;
import com.thulla.entity.GameSession;
import java.security.SecureRandom;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class BotStrategyService {
  private final ThullaGameEngineService engine;
  private final SecureRandom random = new SecureRandom();

  public BotStrategyService(ThullaGameEngineService engine) {
    this.engine = engine;
  }

  public CardDto chooseCard(
      List<CardDto> hand,
      GameSession.Suit leadingSuit,
      List<TrickPlayDto> currentTrick,
      GameRules rules,
      GameRoom.BotDifficulty difficulty,
      boolean isFirstMoveOfMatch) {
    List<CardDto> legal = engine.getLegalCards(hand, leadingSuit, rules, isFirstMoveOfMatch);
    if (legal.size() == 1 || difficulty == GameRoom.BotDifficulty.EASY) {
      return legal.get(random.nextInt(legal.size()));
    }

    List<CardDto> sortedAsc = legal.stream()
        .sorted(Comparator.comparingInt(CardDto::value))
        .toList();

    if (leadingSuit == null) {
      return difficulty == GameRoom.BotDifficulty.HARD
          ? sortedAsc.get(0)
          : sortedAsc.get(Math.min(1, sortedAsc.size() - 1));
    }

    boolean isOffSuit = legal.stream().noneMatch(c -> c.suit() == leadingSuit);
    if (isOffSuit) {
      return sortedAsc.get(sortedAsc.size() - 1);
    }

    int highestOnTable = currentTrick.stream()
        .filter(t -> t.card().suit() == leadingSuit)
        .mapToInt(t -> t.card().value())
        .max()
        .orElse(0);

    List<CardDto> safeUnder = sortedAsc.stream()
        .filter(c -> c.value() < highestOnTable)
        .toList();
    if (difficulty == GameRoom.BotDifficulty.HARD && !safeUnder.isEmpty()) {
      return safeUnder.get(safeUnder.size() - 1);
    }
    return sortedAsc.get(0);
  }
}
