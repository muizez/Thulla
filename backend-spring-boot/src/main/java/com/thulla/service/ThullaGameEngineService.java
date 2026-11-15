package com.thulla.service;

import com.thulla.dto.ThullaDtos.CardDto;
import com.thulla.dto.ThullaDtos.TrickPlayDto;
import com.thulla.entity.GameRules;
import com.thulla.entity.GameSession;
import java.security.SecureRandom;
import java.util.*;
import org.springframework.stereotype.Service;

@Service
public class ThullaGameEngineService {
  private static final List<String> RANKS = List.of(
      "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A");
  private static final Map<GameSession.Suit, String> SUIT_CODE = Map.of(
      GameSession.Suit.SPADES, "S",
      GameSession.Suit.HEARTS, "H",
      GameSession.Suit.DIAMONDS, "D",
      GameSession.Suit.CLUBS, "C");

  private final SecureRandom random = new SecureRandom();

  public List<CardDto> createStandardDeck() {
    List<CardDto> deck = new ArrayList<>(52);
    for (GameSession.Suit suit : GameSession.Suit.values()) {
      for (int i = 0; i < RANKS.size(); i++) {
        String rank = RANKS.get(i);
        deck.add(new CardDto(rank + SUIT_CODE.get(suit), suit, rank, i + 2));
      }
    }
    return deck;
  }

  public List<CardDto> shuffleDeck(List<CardDto> source) {
    List<CardDto> copy = new ArrayList<>(source);
    Collections.shuffle(copy, random);
    return copy;
  }

  public List<List<CardDto>> dealCards(List<CardDto> deck, int playerCount) {
    if (playerCount < 2 || playerCount > 6) {
      throw new IllegalArgumentException("Thulla supports 2 to 6 players.");
    }
    List<List<CardDto>> hands = new ArrayList<>(playerCount);
    for (int i = 0; i < playerCount; i++) hands.add(new ArrayList<>());
    for (int i = 0; i < deck.size(); i++) {
      hands.get(i % playerCount).add(deck.get(i));
    }
    hands.forEach(this::sortHand);
    return hands;
  }

  public void sortHand(List<CardDto> hand) {
    hand.sort(Comparator.comparing(CardDto::suit).thenComparingInt(CardDto::value));
  }

  public int determineStartingPlayerIndex(List<List<CardDto>> hands, GameRules rules) {
    if (rules.getFirstPlayerSelection() == GameRules.FirstPlayerSelection.HOST) return 0;
    if (rules.getFirstPlayerSelection() == GameRules.FirstPlayerSelection.RANDOM) {
      return random.nextInt(hands.size());
    }
    String targetId = rules.getStartingCardId() != null ? rules.getStartingCardId() : "AS";
    for (int i = 0; i < hands.size(); i++) {
      if (hands.get(i).stream().anyMatch(c -> c.id().equals(targetId))) {
        return i;
      }
    }
    return 0;
  }

  public List<CardDto> getLegalCards(
      List<CardDto> hand,
      GameSession.Suit leadingSuit,
      GameRules rules,
      boolean isFirstMoveOfMatch) {
    if (hand.isEmpty()) return List.of();
    if (isFirstMoveOfMatch
        && rules.getFirstPlayerSelection() == GameRules.FirstPlayerSelection.STARTING_CARD
        && rules.isMustPlayStartingCardOnFirstTurn()) {
      Optional<CardDto> starter = hand.stream()
          .filter(c -> c.id().equals(rules.getStartingCardId()))
          .findFirst();
      if (starter.isPresent()) return List.of(starter.get());
    }
    if (leadingSuit == null || !rules.isFollowSuitRequired()) return List.copyOf(hand);
    List<CardDto> matching = hand.stream().filter(c -> c.suit() == leadingSuit).toList();
    return matching.isEmpty() ? List.copyOf(hand) : matching;
  }

  public void validateCardPlay(
      List<CardDto> hand,
      String cardId,
      GameSession.Suit leadingSuit,
      GameRules rules,
      boolean isFirstMoveOfMatch) {
    CardDto card = hand.stream()
        .filter(c -> c.id().equals(cardId))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Card is not in your hand."));
    List<CardDto> legal = getLegalCards(hand, leadingSuit, rules, isFirstMoveOfMatch);
    boolean allowed = legal.stream().anyMatch(c -> c.id().equals(card.id()));
    if (!allowed) {
      throw new IllegalArgumentException("You must follow the leading suit when holding it.");
    }
  }

  public String findHighestLeadingPlayerId(List<TrickPlayDto> trick, GameSession.Suit leadingSuit) {
    return trick.stream()
        .filter(t -> t.card().suit() == leadingSuit)
        .max(Comparator.comparingInt(t -> t.card().value()))
        .map(TrickPlayDto::playerId)
        .orElse(trick.isEmpty() ? null : trick.get(0).playerId());
  }
}
