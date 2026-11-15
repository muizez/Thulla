package com.thulla.controller;

import com.thulla.dto.ThullaDtos.GuestRequest;
import com.thulla.dto.ThullaDtos.LoginRequest;
import com.thulla.dto.ThullaDtos.RegisterRequest;
import com.thulla.service.AuthService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
  private final AuthService auth;

  public AuthController(AuthService auth) {
    this.auth = auth;
  }

  @PostMapping("/register")
  public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest req) {
    return ResponseEntity.ok(auth.register(req));
  }

  @PostMapping("/login")
  public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
    return ResponseEntity.ok(auth.login(req));
  }

  @PostMapping("/guest")
  public ResponseEntity<Map<String, Object>> guest(@Valid @RequestBody GuestRequest req) {
    return ResponseEntity.ok(auth.createGuest(req));
  }

  @GetMapping("/me")
  public ResponseEntity<Map<String, Object>> me(@RequestHeader("Authorization") String header) {
    return ResponseEntity.ok(Map.of("user", auth.requireUser(header)));
  }
}
