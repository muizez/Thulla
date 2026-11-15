package com.thulla.repository;

import com.thulla.entity.GameResult;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameResultRepository extends JpaRepository<GameResult, Long> {
  List<GameResult> findBySessionIdOrderByFinalPositionAsc(String sessionId);
  List<GameResult> findByUserIdOrderByIdDesc(String userId);
}
