import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_GAME_RULES,
  type BotDifficulty,
  type GameMode,
  type GameRulesConfig,
  type PublicGameState,
  type ServerEventType,
  type UserProfile,
} from './game/types';
import {
  apiFetch,
  loadStoredAuth,
  saveStoredAuth,
  useThullaSocket,
  type StoredAuth,
} from './hooks/useThullaSocket';
import { AuthPage } from './pages/AuthPage';
import { CardTablePage } from './pages/CardTablePage';
import { CreateRoomPage } from './pages/CreateRoomPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { LandingPage } from './pages/LandingPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { LobbyPage } from './pages/LobbyPage';
import { ProfilePage } from './pages/ProfilePage';
import { ResultsPage } from './pages/ResultsPage';
import { RulesGuidePage } from './pages/RulesGuidePage';
import { SettingsPage } from './pages/SettingsPage';
import { soundFx } from './utils/sound';

type AppPage =
  | 'LANDING'
  | 'AUTH'
  | 'DASHBOARD'
  | 'CREATE_ROOM'
  | 'JOIN_ROOM'
  | 'ROOM'
  | 'PROFILE'
  | 'LEADERBOARD'
  | 'HISTORY'
  | 'RULES'
  | 'SETTINGS';

export default function App() {
  const [auth, setAuth] = useState<StoredAuth | null>(() => loadStoredAuth());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [page, setPage] = useState<AppPage>('LANDING');
  const [authMode, setAuthMode] = useState<'guest' | 'login' | 'register'>('guest');
  const [returnPageAfterRules, setReturnPageAfterRules] =
    useState<AppPage>('LANDING');
  const [room, setRoom] = useState<PublicGameState | null>(null);
  const [pendingRoomCode, setPendingRoomCode] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<boolean>(() => Boolean(loadStoredAuth()));

  const autostartTriggeredRef = useRef(false);

  const persistAuth = useCallback((next: StoredAuth | null) => {
    saveStoredAuth(next);
    setAuth(next);
  }, []);

  const refreshMe = useCallback(async (token: string) => {
    try {
      const res = await apiFetch<{ user: UserProfile }>('/api/auth/me', {}, token);
      setUser(res.user);
      return res.user;
    } catch {
      return null;
    }
  }, []);

  // Restore stored session & active room on boot/reload
  useEffect(() => {
    let active = true;
    const stored = loadStoredAuth();
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('room')?.trim().toUpperCase() ?? '';
    const autostart = params.get('autostart') === '1';

    if (inviteCode) {
      setPendingRoomCode(inviteCode);
    }

    if (stored) {
      setRestoring(true);
      apiFetch<{ user: UserProfile }>('/api/auth/me', {}, stored.token)
        .then(async (res) => {
          if (!active) return;
          setUser(res.user);

          const codeToJoin = inviteCode || stored.activeRoomCode;
          if (codeToJoin) {
            try {
              const r = await apiFetch<{ room: PublicGameState }>(
                `/api/rooms/${encodeURIComponent(codeToJoin)}/join`,
                { method: 'POST' },
                stored.token
              );
              if (!active) return;
              setRoom(r.room);
              persistAuth({
                token: stored.token,
                activeRoomCode: r.room.roomCode,
              });
              setPage('ROOM');
              return;
            } catch {
              persistAuth({ token: stored.token });
            }
          }

          setPage(inviteCode ? 'JOIN_ROOM' : 'DASHBOARD');
        })
        .catch(() => {
          if (!active) return;
          persistAuth(null);
          setUser(null);
          setPage(inviteCode ? 'AUTH' : 'LANDING');
        })
        .finally(() => {
          if (active) setRestoring(false);
        });
    } else if (autostart && !autostartTriggeredRef.current) {
      autostartTriggeredRef.current = true;
      setRestoring(true);
      apiFetch<{ user: UserProfile; token: string }>('/api/auth/guest', {
        method: 'POST',
        body: JSON.stringify({
          username: `Player${Math.floor(100 + Math.random() * 899)}`,
          avatar: 'ace',
        }),
      })
        .then(async (authRes) => {
          if (!active) return;
          setUser(authRes.user);
          if (inviteCode) {
            persistAuth({ token: authRes.token });
            setPage('JOIN_ROOM');
            return;
          }
          const created = await apiFetch<{ room: PublicGameState }>(
            '/api/rooms',
            {
              method: 'POST',
              body: JSON.stringify({
                mode: 'BOTS',
                roomName: 'Quick Hostel Table',
                maxPlayers: 4,
                botCount: 3,
                botDifficulty: 'MEDIUM',
                rules: DEFAULT_GAME_RULES,
                autoStartBots: true,
              }),
            },
            authRes.token
          );
          if (!active) return;
          setRoom(created.room);
          persistAuth({
            token: authRes.token,
            activeRoomCode: created.room.roomCode,
          });
          setPage('ROOM');
        })
        .catch(() => {
          if (active) setPage('LANDING');
        })
        .finally(() => {
          if (active) setRestoring(false);
        });
    } else if (inviteCode) {
      setAuthMode('guest');
      setPage('AUTH');
    }

    return () => {
      active = false;
    };
  }, [persistAuth]);

  // Keep body data-state synced for accessibility & automation
  useEffect(() => {
    if (page === 'ROOM' && room) {
      document.body.dataset.state = room.status.toLowerCase();
    } else {
      document.body.dataset.state = page.toLowerCase();
    }
  }, [page, room]);

  // Keyboard Enter/Space on Landing Screen
  useEffect(() => {
    if (page !== 'LANDING') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT') return;
        e.preventDefault();
        soundFx.playCardSelect();
        setAuthMode('guest');
        setError(null);
        setPage('AUTH');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [page]);

  const handleGameEvent = useCallback(
    (eventType: ServerEventType, nextState: PublicGameState) => {
      setRoom(nextState);
      setError(null);
      if (eventType === 'GAME_FINISHED' && auth?.token) {
        refreshMe(auth.token);
      }
    },
    [auth?.token, refreshMe]
  );

  const handleRoomClosed = useCallback(() => {
    setRoom(null);
    if (auth?.token) {
      persistAuth({ token: auth.token });
    }
    setPage('DASHBOARD');
    setError('Room was closed by the host.');
  }, [auth?.token, persistAuth]);

  const handleSocketError = useCallback((msg: string) => {
    setError(msg);
  }, []);

  const activeRoomCode = page === 'ROOM' && room ? room.roomCode : null;

  const { wsConnected, sendAction } = useThullaSocket(
    activeRoomCode,
    auth?.token ?? null,
    handleGameEvent,
    handleRoomClosed,
    handleSocketError
  );

  const enterAfterAuth = async (nextUser: UserProfile, token: string) => {
    setUser(nextUser);
    persistAuth({ token });
    setError(null);

    if (pendingRoomCode) {
      try {
        const res = await apiFetch<{ room: PublicGameState }>(
          `/api/rooms/${encodeURIComponent(pendingRoomCode)}/join`,
          { method: 'POST' },
          token
        );
        setRoom(res.room);
        persistAuth({ token, activeRoomCode: res.room.roomCode });
        setPendingRoomCode('');
        setPage('ROOM');
        return;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not join room.');
        setPage('JOIN_ROOM');
        return;
      }
    }

    setPage('DASHBOARD');
  };

  const handleLoginSubmit = async (data: {
    identifier: string;
    password: string;
  }) => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ user: UserProfile; token: string }>(
        '/api/auth/login',
        { method: 'POST', body: JSON.stringify(data) }
      );
      await enterAfterAuth(res.user, res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterSubmit = async (data: {
    username: string;
    email: string;
    password: string;
    avatar: string;
  }) => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ user: UserProfile; token: string }>(
        '/api/auth/register',
        { method: 'POST', body: JSON.stringify(data) }
      );
      await enterAfterAuth(res.user, res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleGuestSubmit = async (data: {
    username: string;
    avatar: string;
  }) => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ user: UserProfile; token: string }>(
        '/api/auth/guest',
        { method: 'POST', body: JSON.stringify(data) }
      );
      await enterAfterAuth(res.user, res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start guest session.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    if (auth?.token) {
      await apiFetch('/api/auth/logout', { method: 'POST' }, auth.token).catch(
        () => {}
      );
    }
    persistAuth(null);
    setUser(null);
    setRoom(null);
    setError(null);
    setPage('LANDING');
  };

  const handleCreateRoom = async (input: {
    roomName: string;
    mode: GameMode;
    maxPlayers: number;
    botCount: number;
    botDifficulty: BotDifficulty;
    rules: GameRulesConfig;
    autoStartBots?: boolean;
  }) => {
    if (!auth?.token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ room: PublicGameState }>(
        '/api/rooms',
        { method: 'POST', body: JSON.stringify(input) },
        auth.token
      );
      setRoom(res.room);
      persistAuth({ token: auth.token, activeRoomCode: res.room.roomCode });
      setPage('ROOM');
      soundFx.playShuffle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create room.');
    } finally {
      setBusy(false);
    }
  };

  const handleQuickPlayBots = async () => {
    await handleCreateRoom({
      roomName: `${user?.username ?? 'Host'} vs AI Table`,
      mode: 'BOTS',
      maxPlayers: 4,
      botCount: 3,
      botDifficulty: 'MEDIUM',
      rules: DEFAULT_GAME_RULES,
      autoStartBots: true,
    });
  };

  const handleOnlineMatchmake = async () => {
    if (!auth?.token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ room: PublicGameState }>(
        '/api/rooms/matchmake',
        { method: 'POST' },
        auth.token
      );
      setRoom(res.room);
      persistAuth({ token: auth.token, activeRoomCode: res.room.roomCode });
      setPage('ROOM');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Matchmaking failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleJoinCode = async (code: string) => {
    if (!auth?.token) return;
    setBusy(true);
    setError(null);
    try {
      const clean = code.trim().toUpperCase();
      const res = await apiFetch<{ room: PublicGameState }>(
        `/api/rooms/${encodeURIComponent(clean)}/join`,
        { method: 'POST' },
        auth.token
      );
      setRoom(res.room);
      persistAuth({ token: auth.token, activeRoomCode: res.room.roomCode });
      setPage('ROOM');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join room.');
    } finally {
      setBusy(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (auth?.token && room) {
      await apiFetch(
        `/api/rooms/${encodeURIComponent(room.roomCode)}/leave`,
        { method: 'POST' },
        auth.token
      ).catch(() => {});
      persistAuth({ token: auth.token });
      refreshMe(auth.token);
    }
    setRoom(null);
    setError(null);
    setPage(user ? 'DASHBOARD' : 'LANDING');
  };

  const handleCloseRoom = async () => {
    if (!auth?.token || !room) return;
    try {
      await apiFetch(
        `/api/rooms/${encodeURIComponent(room.roomCode)}/close`,
        { method: 'POST' },
        auth.token
      );
      persistAuth({ token: auth.token });
      setRoom(null);
      setPage('DASHBOARD');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not close room.');
    }
  };

  const handleToggleReady = async () => {
    if (!auth?.token || !room) return;
    try {
      const res = await apiFetch<{ room: PublicGameState }>(
        `/api/rooms/${encodeURIComponent(room.roomCode)}/ready`,
        { method: 'POST' },
        auth.token
      );
      setRoom(res.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not toggle ready.');
    }
  };

  const handleStartGame = async () => {
    if (!auth?.token || !room) return;
    soundFx.playShuffle();
    try {
      const res = await apiFetch<{ room: PublicGameState }>(
        `/api/rooms/${encodeURIComponent(room.roomCode)}/start`,
        { method: 'POST' },
        auth.token
      );
      setRoom(res.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start match.');
    }
  };

  const handleUpdateSettings = async (patch: {
    rules?: GameRulesConfig;
    botCount?: number;
    botDifficulty?: BotDifficulty;
  }) => {
    if (!auth?.token || !room) return;
    try {
      const res = await apiFetch<{ room: PublicGameState }>(
        `/api/rooms/${encodeURIComponent(room.roomCode)}/rules`,
        { method: 'POST', body: JSON.stringify(patch) },
        auth.token
      );
      setRoom(res.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update settings.');
    }
  };

  const handleKickPlayer = async (playerId: string) => {
    if (!auth?.token || !room) return;
    try {
      const res = await apiFetch<{ room: PublicGameState }>(
        `/api/rooms/${encodeURIComponent(room.roomCode)}/kick`,
        { method: 'POST', body: JSON.stringify({ playerId }) },
        auth.token
      );
      setRoom(res.room);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove player.');
    }
  };

  const handlePlayCard = async (cardId: string) => {
    if (!room || !auth?.token) return;
    if (wsConnected) {
      const sent = sendAction('PLAY_CARD', { cardId });
      if (sent) return;
    }
    try {
      const res = await apiFetch<{ state: PublicGameState }>(
        `/api/games/${encodeURIComponent(room.gameId)}/play-card`,
        { method: 'POST', body: JSON.stringify({ cardId }) },
        auth.token
      );
      setRoom(res.state);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid card play.');
    }
  };

  const handlePlayAgain = async () => {
    if (!room || !auth?.token) return;
    try {
      const res = await apiFetch<{ room: PublicGameState }>(
        `/api/games/${encodeURIComponent(room.gameId)}/play-again`,
        { method: 'POST' },
        auth.token
      );
      setRoom(res.room);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset room.');
    }
  };

  const handleSaveProfile = async (input: {
    username: string;
    avatar: string;
  }) => {
    if (!auth?.token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ user: UserProfile }>(
        '/api/auth/profile',
        { method: 'PATCH', body: JSON.stringify(input) },
        auth.token
      );
      setUser(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setBusy(false);
    }
  };

  if (restoring) {
    return (
      <main className="min-h-screen bg-[#0B1120] text-slate-200 flex items-center justify-center">
        <div className="text-sm font-medium text-slate-400">
          Setting up the card table...
        </div>
      </main>
    );
  }

  if (page === 'RULES') {
    return (
      <RulesGuidePage
        onBack={() => setPage(user ? returnPageAfterRules : 'LANDING')}
      />
    );
  }

  if (!user || page === 'LANDING') {
    if (page === 'AUTH') {
      return (
        <AuthPage
          initialMode={authMode}
          onBack={() => {
            setError(null);
            setPage('LANDING');
          }}
          onLoginSubmit={handleLoginSubmit}
          onRegisterSubmit={handleRegisterSubmit}
          onGuestSubmit={handleGuestSubmit}
          error={error}
          loading={busy}
        />
      );
    }
    return (
      <LandingPage
        onQuickGuest={() => {
          soundFx.playCardSelect();
          setError(null);
          setAuthMode('guest');
          setPage('AUTH');
        }}
        onLogin={() => {
          soundFx.playCardSelect();
          setError(null);
          setAuthMode('login');
          setPage('AUTH');
        }}
        onRegister={() => {
          soundFx.playCardSelect();
          setError(null);
          setAuthMode('register');
          setPage('AUTH');
        }}
        onRules={() => {
          soundFx.playCardSelect();
          setReturnPageAfterRules('LANDING');
          setPage('RULES');
        }}
      />
    );
  }

  if (page === 'ROOM' && room) {
    if (room.status === 'LOBBY') {
      return (
        <LobbyPage
          game={room}
          currentUserId={user.id}
          wsConnected={wsConnected}
          error={error}
          onToggleReady={handleToggleReady}
          onStartGame={handleStartGame}
          onUpdateSettings={handleUpdateSettings}
          onKickPlayer={handleKickPlayer}
          onCloseRoom={handleCloseRoom}
          onLeaveRoom={handleLeaveRoom}
        />
      );
    }

    if (room.status === 'PLAYING') {
      return (
        <CardTablePage
          game={room}
          currentUserId={user.id}
          wsConnected={wsConnected}
          error={error}
          onPlayCard={handlePlayCard}
          onLeaveRoom={handleLeaveRoom}
        />
      );
    }

    if (room.status === 'FINISHED') {
      return (
        <ResultsPage
          game={room}
          currentUserId={user.id}
          onPlayAgain={handlePlayAgain}
          onBackDashboard={handleLeaveRoom}
        />
      );
    }
  }

  if (page === 'CREATE_ROOM') {
    return (
      <CreateRoomPage
        onBack={() => {
          setError(null);
          setPage('DASHBOARD');
        }}
        onCreate={(data) => handleCreateRoom(data)}
        loading={busy}
        error={error}
      />
    );
  }

  if (page === 'JOIN_ROOM') {
    return (
      <JoinRoomPage
        initialCode={pendingRoomCode}
        onBack={() => {
          setError(null);
          setPage('DASHBOARD');
        }}
        onJoinCode={handleJoinCode}
        onQuickMatch={handleOnlineMatchmake}
        loading={busy}
        error={error}
      />
    );
  }

  if (page === 'PROFILE') {
    return (
      <ProfilePage
        user={user}
        onBack={() => setPage('DASHBOARD')}
        onOpenSettings={() => setPage('SETTINGS')}
      />
    );
  }

  if (page === 'LEADERBOARD') {
    return (
      <LeaderboardPage
        currentUserId={user.id}
        onBack={() => setPage('DASHBOARD')}
      />
    );
  }

  if (page === 'HISTORY') {
    return <HistoryPage onBack={() => setPage('DASHBOARD')} />;
  }

  if (page === 'SETTINGS') {
    return (
      <SettingsPage
        user={user}
        onBack={() => setPage('DASHBOARD')}
        onSaveProfile={handleSaveProfile}
        loading={busy}
        error={error}
      />
    );
  }

  return (
    <DashboardPage
      user={user}
      onNavigate={(target) => {
        setError(null);
        if (target === 'RULES') {
          setReturnPageAfterRules('DASHBOARD');
        }
        setPage(target);
      }}
      onQuickPlayBots={handleQuickPlayBots}
      onOnlineMatchmake={handleOnlineMatchmake}
      onJoinPublicRoom={handleJoinCode}
      onLogout={handleLogout}
      busy={busy}
      error={error}
    />
  );
}
