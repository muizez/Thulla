-- THULLA (Bhabhi) Traditional 52-Card Multiplayer Game - MySQL 8+ Schema

CREATE DATABASE IF NOT EXISTS thulla_cards_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE thulla_cards_db;

-- 1. Users & Statistics
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(40) NOT NULL UNIQUE,
  email VARCHAR(120) UNIQUE,
  password_hash VARCHAR(255),
  avatar VARCHAR(32) NOT NULL DEFAULT 'ace',
  is_guest BOOLEAN NOT NULL DEFAULT FALSE,
  total_games INT NOT NULL DEFAULT 0,
  total_wins INT NOT NULL DEFAULT 0,
  total_losses INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_wins (total_wins DESC, best_streak DESC)
) ENGINE=InnoDB;

-- 2. Configurable Regional House Rules
CREATE TABLE IF NOT EXISTS game_rules (
  id VARCHAR(36) PRIMARY KEY,
  preset_name VARCHAR(64) NOT NULL DEFAULT 'Traditional Thulla (Bhabhi)',
  first_player_selection ENUM('STARTING_CARD', 'HOST', 'RANDOM') NOT NULL DEFAULT 'STARTING_CARD',
  starting_card_id VARCHAR(4) NOT NULL DEFAULT 'AS',
  must_play_starting_card_on_first_turn BOOLEAN NOT NULL DEFAULT TRUE,
  turn_direction ENUM('CLOCKWISE', 'COUNTER_CLOCKWISE') NOT NULL DEFAULT 'CLOCKWISE',
  follow_suit_required BOOLEAN NOT NULL DEFAULT TRUE,
  off_suit_behavior ENUM('IMMEDIATE_THULLA_PICKUP', 'COMPLETE_TRICK_THEN_PICKUP', 'DISCARD_WITHOUT_PICKUP') NOT NULL DEFAULT 'IMMEDIATE_THULLA_PICKUP',
  first_trick_safe BOOLEAN NOT NULL DEFAULT TRUE,
  trick_collection_behavior ENUM('DISCARD_PILE', 'HOLDER_KEEPS_COUNT') NOT NULL DEFAULT 'DISCARD_PILE',
  elimination_rule ENUM('IMMEDIATE_ESCAPE', 'END_OF_TRICK_ESCAPE') NOT NULL DEFAULT 'IMMEDIATE_ESCAPE',
  game_ending_condition ENUM('LAST_PLAYER_STANDING', 'FIRST_WINNER') NOT NULL DEFAULT 'LAST_PLAYER_STANDING',
  tie_handling ENUM('FEWEST_CARDS', 'LOWEST_HIGH_CARD') NOT NULL DEFAULT 'FEWEST_CARDS',
  turn_timer_seconds INT NOT NULL DEFAULT 30
) ENGINE=InnoDB;

-- 3. Multiplayer Rooms
CREATE TABLE IF NOT EXISTS game_rooms (
  id VARCHAR(36) PRIMARY KEY,
  room_code VARCHAR(8) NOT NULL UNIQUE,
  room_name VARCHAR(80) NOT NULL,
  mode ENUM('FRIENDS', 'BOTS', 'ONLINE') NOT NULL DEFAULT 'FRIENDS',
  status ENUM('LOBBY', 'PLAYING', 'FINISHED') NOT NULL DEFAULT 'LOBBY',
  host_user_id VARCHAR(36) NOT NULL,
  max_players TINYINT NOT NULL DEFAULT 4,
  bot_count TINYINT NOT NULL DEFAULT 0,
  bot_difficulty ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM',
  rules_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_room_host FOREIGN KEY (host_user_id) REFERENCES users(id),
  CONSTRAINT fk_room_rules FOREIGN KEY (rules_id) REFERENCES game_rules(id),
  INDEX idx_room_code (room_code),
  INDEX idx_room_status_mode (status, mode)
) ENGINE=InnoDB;

-- 4. Seated Players inside a Room (Humans & AI Bots)
CREATE TABLE IF NOT EXISTS game_players (
  id VARCHAR(36) PRIMARY KEY,
  room_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36),
  display_name VARCHAR(40) NOT NULL,
  avatar VARCHAR(32) NOT NULL DEFAULT 'ace',
  seat_position TINYINT NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT FALSE,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  bot_difficulty ENUM('EASY', 'MEDIUM', 'HARD'),
  is_ready BOOLEAN NOT NULL DEFAULT FALSE,
  connection_status ENUM('CONNECTED', 'DISCONNECTED') NOT NULL DEFAULT 'CONNECTED',
  hand_json TEXT NOT NULL,
  finished_rank TINYINT,
  is_thulla_loser BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_gp_room FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_gp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_gp_room_pos (room_id, seat_position)
) ENGINE=InnoDB;

-- 5. Match Sessions (Active or Completed)
CREATE TABLE IF NOT EXISTS game_sessions (
  id VARCHAR(36) PRIMARY KEY,
  room_id VARCHAR(36) NOT NULL,
  room_code VARCHAR(8) NOT NULL,
  room_name VARCHAR(80) NOT NULL,
  mode ENUM('FRIENDS', 'BOTS', 'ONLINE') NOT NULL,
  status ENUM('PLAYING', 'FINISHED') NOT NULL DEFAULT 'PLAYING',
  round_number INT NOT NULL DEFAULT 1,
  trick_number INT NOT NULL DEFAULT 1,
  move_number INT NOT NULL DEFAULT 0,
  current_turn_player_id VARCHAR(36),
  leading_suit ENUM('SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS'),
  winner_name VARCHAR(40),
  thulla_loser_name VARCHAR(40),
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  CONSTRAINT fk_gs_room FOREIGN KEY (room_id) REFERENCES game_rooms(id) ON DELETE CASCADE,
  INDEX idx_gs_ended (ended_at DESC)
) ENGINE=InnoDB;

-- 6. Card-by-Card Move Audit & Replay Log
CREATE TABLE IF NOT EXISTS game_moves (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  move_number INT NOT NULL,
  trick_number INT NOT NULL,
  player_id VARCHAR(36) NOT NULL,
  player_name VARCHAR(40) NOT NULL,
  card_id VARCHAR(4) NOT NULL,
  suit ENUM('SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS') NOT NULL,
  card_rank VARCHAR(3) NOT NULL,
  is_off_suit BOOLEAN NOT NULL DEFAULT FALSE,
  note VARCHAR(255) NOT NULL,
  played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_gm_session FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  INDEX idx_gm_session_move (session_id, move_number)
) ENGINE=InnoDB;

-- 7. Final Match Results per Player
CREATE TABLE IF NOT EXISTS game_results (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36),
  player_name VARCHAR(40) NOT NULL,
  avatar VARCHAR(32) NOT NULL,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  final_position TINYINT NOT NULL,
  outcome ENUM('WINNER', 'ESCAPED', 'THULLA') NOT NULL,
  cards_remaining INT NOT NULL DEFAULT 0,
  score INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_gr_session FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_gr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_gr_session (session_id, final_position)
) ENGINE=InnoDB;
