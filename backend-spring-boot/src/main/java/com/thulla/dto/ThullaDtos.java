package com.thulla.dto;

import com.thulla.entity.GameRoom;
import com.thulla.entity.GameRules;
import com.thulla.entity.GameSession;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class ThullaDtos {
  public record CardDto(String id, GameSession.Suit suit, String rank, int value) {}

  public record RegisterRequest(
      @NotBlank String username,
      @NotBlank String email,
      @NotBlank String password,
      String avatar
  ) {}

  public record LoginRequest(@NotBlank String identifier, @NotBlank String password) {}
  public record GuestRequest(@NotBlank String username, String avatar) {}

  public record CreateRoomRequest(
      String roomName,
      GameRoom.GameMode mode,
      @Min(2) @Max(6) Integer maxPlayers,
      @Min(0) @Max(5) Integer botCount,
      GameRoom.BotDifficulty botDifficulty,
      GameRules rules
  ) {}

  public record PlayCardRequest(@NotBlank String cardId, String actionId) {}

  public record PublicPlayerDto(
      String id,
      String userId,
      String username,
      String avatar,
      int position,
      boolean isHost,
      boolean isBot,
      GameRoom.BotDifficulty botDifficulty,
      boolean isReady,
      String connectionStatus,
      int cardCount,
      Integer finishedRank,
      boolean isThullaLoser
  ) {}

  public record TrickPlayDto(
      String playerId,
      String username,
      CardDto card,
      boolean isOffSuit,
      int moveNumber
  ) {}

  public record GameStateDto(
      String gameId,
      String roomCode,
      String roomName,
      GameRoom.GameMode mode,
      GameRoom.RoomStatus status,
      String hostId,
      int maxPlayers,
      int botCount,
      GameRoom.BotDifficulty botDifficulty,
      GameRules rules,
      List<PublicPlayerDto> players,
      List<CardDto> myHand,
      List<String> playableCardIds,
      int roundNumber,
      int trickNumber,
      int moveNumber,
      String currentTurnPlayerId,
      GameSession.Suit leadingSuit,
      List<TrickPlayDto> currentTrick,
      int discardCount,
      String lastEventMessage
  ) {}
}
