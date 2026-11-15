package com.thulla.repository;

import com.thulla.entity.GameRoom;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameRoomRepository extends JpaRepository<GameRoom, String> {
  Optional<GameRoom> findByRoomCodeIgnoreCase(String roomCode);
  boolean existsByRoomCodeIgnoreCase(String roomCode);
  List<GameRoom> findByModeAndStatus(GameRoom.GameMode mode, GameRoom.RoomStatus status);
}
