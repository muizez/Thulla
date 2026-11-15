package com.thulla.repository;

import com.thulla.entity.GamePlayer;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GamePlayerRepository extends JpaRepository<GamePlayer, String> {
  List<GamePlayer> findByRoomIdOrderBySeatPositionAsc(String roomId);
  Optional<GamePlayer> findByRoomIdAndUserId(String roomId, String userId);
}
