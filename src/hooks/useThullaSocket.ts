import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicGameState, ServerEventType } from '../game/types';

export interface StoredAuth {
  token: string;
  activeRoomCode?: string;
}

const AUTH_KEY = 'thulla_auth_v2';

export function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    return parsed.token ? parsed : null;
  } catch {
    return null;
  }
}

export function saveStoredAuth(auth: StoredAuth | null) {
  try {
    if (!auth) {
      sessionStorage.removeItem(AUTH_KEY);
    } else {
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    }
  } catch {
    // ignore storage failures
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function useThullaSocket(
  roomCode: string | null,
  token: string | null,
  onGameEvent: (eventType: ServerEventType, state: PublicGameState) => void,
  onRoomClosed: () => void,
  onError: (msg: string) => void
) {
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const heartbeatRef = useRef<number | null>(null);

  const onEventRef = useRef(onGameEvent);
  const onClosedRef = useRef(onRoomClosed);
  const onErrorRef = useRef(onError);
  onEventRef.current = onGameEvent;
  onClosedRef.current = onRoomClosed;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!roomCode || !token) {
      setWsConnected(false);
      return;
    }

    let unmounted = false;

    const connect = () => {
      if (unmounted) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${proto}//${window.location.host}/ws?roomCode=${encodeURIComponent(
        roomCode
      )}&token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmounted) return;
        setWsConnected(true);
        if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
        heartbeatRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 18000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as {
            type: ServerEventType | 'PONG';
            payload?: { state?: PublicGameState; error?: string };
          };
          if (msg.type === 'PONG') return;
          if (msg.type === 'ROOM_CLOSED') {
            onClosedRef.current();
            return;
          }
          if (msg.type === 'ERROR') {
            onErrorRef.current(msg.payload?.error ?? 'Action rejected.');
            return;
          }
          if (msg.payload?.state) {
            onEventRef.current(msg.type, msg.payload.state);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (unmounted) return;
        setWsConnected(false);
        if (heartbeatRef.current) {
          window.clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
        reconnectTimerRef.current = window.setTimeout(connect, 1400);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [roomCode, token]);

  const sendAction = useCallback(
    (type: string, payload?: Record<string, unknown>) => {
      const ws = wsRef.current;
      const actionId = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, payload, actionId }));
        return true;
      }
      onErrorRef.current('Connection interrupted. Reconnecting...');
      return false;
    },
    []
  );

  return { wsConnected, sendAction };
}
