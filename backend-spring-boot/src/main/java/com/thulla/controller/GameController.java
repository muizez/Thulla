package com.thulla.controller;

import com.thulla.entity.GameMove;
import com.thulla.service.ThullaRoomService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/games")
@CrossOrigin(origins = "*")
public class GameController {
  private final ThullaRoomService rooms;

  public GameController(ThullaRoomService rooms) {
    this.rooms = rooms;
  }

  @GetMapping("/{gameId}/history")
  public ResponseEntity<Map<String, List<GameMove>>> history(@PathVariable String gameId) {
    return ResponseEntity.ok(Map.of("moves", rooms.getMoveHistory(gameId)));
  }
}
