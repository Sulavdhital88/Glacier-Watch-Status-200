import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket(onMessageCallback) {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const backoffRef = useRef(1000);

  const connect = useCallback(() => {
    // Clean up previous socket if any
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (_) {}
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        backoffRef.current = 1000;
        // Clear fallback polling if active
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (onMessageCallback) {
            onMessageCallback(msg);
          }

          // Invalidate relevant React Query caches based on message type
          if (msg.type === 'capture') {
            queryClient.invalidateQueries({ queryKey: ['captures'] });
            queryClient.invalidateQueries({ queryKey: ['latest_capture'] });
            queryClient.invalidateQueries({ queryKey: ['situation'] });
          } else if (msg.type === 'sensor') {
            queryClient.invalidateQueries({ queryKey: ['sensors_latest'] });
            queryClient.invalidateQueries({ queryKey: ['sensors_history'] });
            queryClient.invalidateQueries({ queryKey: ['sensors_events'] });
            queryClient.invalidateQueries({ queryKey: ['situation'] });
          } else if (msg.type === 'situation') {
            queryClient.invalidateQueries({ queryKey: ['situation'] });
          } else if (msg.type === 'status') {
            queryClient.invalidateQueries({ queryKey: ['status'] });
          }
        } catch (_) {}
      };

      socket.onclose = () => {
        setIsConnected(false);
        scheduleReconnect();
      };

      socket.onerror = () => {
        setIsConnected(false);
        try {
          socket.close();
        } catch (_) {}
      };
    } catch (_) {
      setIsConnected(false);
      scheduleReconnect();
    }
  }, [queryClient, onMessageCallback]);

  const scheduleReconnect = useCallback(() => {
    // Start fallback polling if not already started
    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['status'] });
        queryClient.invalidateQueries({ queryKey: ['latest_capture'] });
        queryClient.invalidateQueries({ queryKey: ['sensors_latest'] });
        queryClient.invalidateQueries({ queryKey: ['situation'] });
      }, 3000);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    const delay = Math.min(backoffRef.current, 10000);
    backoffRef.current = Math.min(backoffRef.current * 1.5, 10000);
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect, queryClient]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [connect]);

  return { isConnected };
}
