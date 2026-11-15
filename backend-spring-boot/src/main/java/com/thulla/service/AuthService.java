package com.thulla.service;

import com.thulla.dto.ThullaDtos.GuestRequest;
import com.thulla.dto.ThullaDtos.LoginRequest;
import com.thulla.dto.ThullaDtos.RegisterRequest;
import com.thulla.entity.User;
import com.thulla.repository.UserRepository;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private final UserRepository users;
  private final PasswordEncoder encoder;
  private final Map<String, String> activeTokens = new ConcurrentHashMap<>();

  public AuthService(UserRepository users, PasswordEncoder encoder) {
    this.users = users;
    this.encoder = encoder;
  }

  public Map<String, Object> register(RegisterRequest req) {
    if (users.existsByUsernameIgnoreCase(req.username())) {
      throw new IllegalArgumentException("Username is already registered.");
    }
    if (users.existsByEmailIgnoreCase(req.email())) {
      throw new IllegalArgumentException("Email is already registered.");
    }
    User user = new User();
    user.setId(UUID.randomUUID().toString());
    user.setUsername(req.username().trim());
    user.setEmail(req.email().trim().toLowerCase());
    user.setPasswordHash(encoder.encode(req.password()));
    user.setAvatar(req.avatar() != null ? req.avatar() : "ace");
    user.setGuest(false);
    users.save(user);

    String token = UUID.randomUUID().toString();
    activeTokens.put(token, user.getId());
    return Map.of("user", user, "token", token);
  }

  public Map<String, Object> login(LoginRequest req) {
    String ident = req.identifier().trim();
    User user = users.findByUsernameIgnoreCase(ident)
        .or(() -> users.findByEmailIgnoreCase(ident))
        .orElseThrow(() -> new IllegalArgumentException("Invalid credentials."));
    if (user.getPasswordHash() == null || !encoder.matches(req.password(), user.getPasswordHash())) {
      throw new IllegalArgumentException("Invalid credentials.");
    }
    String token = UUID.randomUUID().toString();
    activeTokens.put(token, user.getId());
    return Map.of("user", user, "token", token);
  }

  public Map<String, Object> createGuest(GuestRequest req) {
    User user = new User();
    user.setId(UUID.randomUUID().toString());
    user.setUsername(req.username().trim() + "_" + UUID.randomUUID().toString().substring(0, 4));
    user.setAvatar(req.avatar() != null ? req.avatar() : "chai");
    user.setGuest(true);
    users.save(user);
    String token = UUID.randomUUID().toString();
    activeTokens.put(token, user.getId());
    return Map.of("user", user, "token", token);
  }

  public User requireUser(String authHeader) {
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      throw new IllegalArgumentException("Authentication required.");
    }
    String token = authHeader.substring(7).trim();
    String userId = activeTokens.get(token);
    if (userId == null) {
      throw new IllegalArgumentException("Invalid or expired token.");
    }
    return users.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("User not found."));
  }
}
