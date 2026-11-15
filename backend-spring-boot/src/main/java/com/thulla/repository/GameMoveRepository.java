package com.thulla.repository;

import com.thulla.entity.GameMove;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameMoveRepository extends JpaRepository<GameMove, Long> {
  List<GameMove> findBySessionIdOrderByMoveNumberAsc(String sessionId);
}
