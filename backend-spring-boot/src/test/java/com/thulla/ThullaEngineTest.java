package com.thulla;

import static org.junit.jupiter.api.Assertions.*;

import com.thulla.dto.ThullaDtos.CardDto;
import com.thulla.entity.GameRoom;
import com.thulla.entity.GameRules;
import com.thulla.entity.GameSession;
import com.thulla.service.BotStrategyService;
import com.thulla.service.ThullaGameEngineService;
import java.util.List;
import org.junit.jupiter.api.Test;

class ThullaEngineTest {
  private final ThullaGameEngineService engine = new ThullaGameEngineService();
  private final BotStrategyService bot = new BotStrategyService(engine);

  @Test
  void standardDeckHas52UniqueCardsAndDealsEvenly() {
    List<CardDto> deck = engine.createStandardDeck();
    assertEquals(52, deck.size());
    List<List<CardDto>> hands = engine.dealCards(engine.shuffleDeck(deck), 4);
    assertEquals(4, hands.size());
    hands.forEach(h -> assertEquals(13, h.size()));
  }

  @Test
  void startingPlayerHoldsAceOfSpades() {
    List<List<CardDto>> hands = engine.dealCards(engine.createStandardDeck(), 4);
    GameRules rules = new GameRules();
    int starter = engine.determineStartingPlayerIndex(hands, rules);
    assertTrue(hands.get(starter).stream().anyMatch(c -> c.id().equals("AS")));
  }

  @Test
  void legalCardsEnforceLeadingSuitAndBotPicksLegalMove() {
    List<CardDto> hand = List.of(
        new CardDto("AS", GameSession.Suit.SPADES, "A", 14),
        new CardDto("7H", GameSession.Suit.HEARTS, "7", 7),
        new CardDto("KC", GameSession.Suit.CLUBS, "K", 13));
    GameRules rules = new GameRules();
    List<CardDto> legal = engine.getLegalCards(hand, GameSession.Suit.HEARTS, rules, false);
    assertEquals(1, legal.size());
    assertEquals("7H", legal.get(0).id());

    CardDto chosen = bot.chooseCard(
        hand, GameSession.Suit.HEARTS, List.of(), rules, GameRoom.BotDifficulty.HARD, false);
    assertEquals("7H", chosen.id());
  }
}
