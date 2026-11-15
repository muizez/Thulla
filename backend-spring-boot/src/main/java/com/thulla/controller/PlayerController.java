package com.thulla.controller;

import com.thulla.entity.GameResult;
import com.thulla.entity.User;
import com.thulla.service.ThullaRoomService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/players")
@CrossOrigin(origins = "*")
public class PlayerController {
  private final ThullaRoomService rooms;

  public PlayerController(ThullaRoomService rooms) {
    this.rooms = rooms;
  }

  @GetMapping("/leaderboard")
  public ResponseEntity<Map<String, List<User>>> leaderboard() {
    return ResponseEntity.ok(Map.of("leaderboard", rooms.getLeaderboard()));
  }

  @GetMapping("/{id}/statistics")
  public ResponseEntity<Map<String, List<GameResult>>> stats(@PathVariable String id) {
    return ResponseEntity.ok(Map.of("results", rooms.getPlayerResults(id)));
  }
}
