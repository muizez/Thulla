package com.thulla.controller;

import com.thulla.dto.ThullaDtos.CreateRoomRequest;
import com.thulla.dto.ThullaDtos.GameStateDto;
import com.thulla.entity.User;
import com.thulla.service.AuthService;
import com.thulla.service.ThullaRoomService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class RoomController {
  private final AuthService auth;
  private final ThullaRoomService rooms;

  public RoomController(AuthService auth, ThullaRoomService rooms) {
    this.auth = auth;
    this.rooms = rooms;
  }

  @PostMapping
  public ResponseEntity<Map<String, GameStateDto>> createRoom(
      @RequestHeader("Authorization") String header,
      @Valid @RequestBody CreateRoomRequest req) {
    User user = auth.requireUser(header);
    return ResponseEntity.ok(Map.of("room", rooms.createRoom(user, req)));
  }

  @GetMapping("/{roomCode}")
  public ResponseEntity<Map<String, GameStateDto>> getRoom(
      @RequestHeader("Authorization") String header,
      @PathVariable String roomCode) {
    User user = auth.requireUser(header);
    return ResponseEntity.ok(Map.of("room", rooms.getState(roomCode, user.getId())));
  }

  @PostMapping("/{roomCode}/start")
  public ResponseEntity<Map<String, GameStateDto>> startMatch(
      @RequestHeader("Authorization") String header,
      @PathVariable String roomCode) {
    User user = auth.requireUser(header);
    return ResponseEntity.ok(Map.of("room", rooms.startMatch(roomCode, user)));
  }
}
