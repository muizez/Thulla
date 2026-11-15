package com.thulla.repository;

import com.thulla.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, String> {
  Optional<User> findByUsernameIgnoreCase(String username);
  Optional<User> findByEmailIgnoreCase(String email);
  boolean existsByUsernameIgnoreCase(String username);
  boolean existsByEmailIgnoreCase(String email);

  @Query("SELECT u FROM User u WHERE u.totalGames > 0 ORDER BY u.totalWins DESC, u.bestStreak DESC")
  List<User> findLeaderboardUsers();
}
