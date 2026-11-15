package com.thulla.repository;

import com.thulla.entity.GameSession;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameSessionRepository extends JpaRepository<GameSession, String> {
  Optional<GameSession> findTopByRoomIdOrderByStartedAtDesc(String roomId);
  List<GameSession> findTop25ByStatusOrderByEndedAtDesc(GameSession.SessionStatus status);
}
