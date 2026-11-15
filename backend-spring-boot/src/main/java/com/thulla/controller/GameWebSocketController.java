package com.thulla.controller;

import com.thulla.dto.ThullaDtos.PlayCardRequest;
import java.util.Map;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class GameWebSocketController {
  private final SimpMessagingTemplate messaging;

  public GameWebSocketController(SimpMessagingTemplate messaging) {
    this.messaging = messaging;
  }

  @MessageMapping("/room/{roomCode}/play-card")
  public void handlePlayCard(
      @DestinationVariable String roomCode,
      @Payload PlayCardRequest req) {
    messaging.convertAndSend(
        "/topic/room/" + roomCode,
        Map.of("type", "CARD_PLAYED", "cardId", req.cardId()));
  }
}
