import { useEffect, useRef, useState, useCallback } from 'react';

interface WSMessage {
  [key: string]: unknown;
}

export function useWebSocket(url: string | null) {
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!url) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const fullUrl = `${protocol}//${window.location.host}${url}`;
    const socket = new WebSocket(fullUrl);

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch {
        // ignore non-JSON messages
      }
    };

    ws.current = socket;

    return () => {
      socket.close();
    };
  }, [url]);

  const send = useCallback((data: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  return { messages, connected, send };
}
