
import { useEffect, useState } from 'react';

type SocketEventCallback = (data: any) => void;

class SharedSocket {
  private static instance: SharedSocket;
  private listeners = new Map<string, Set<SocketEventCallback>>();
  private ws: WebSocket | null = null;

  private constructor() {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  static getInstance(): SharedSocket {
    if (!SharedSocket.instance) {
      SharedSocket.instance = new SharedSocket();
    }
    return SharedSocket.instance;
  }

  subscribe(event: string, callback: SocketEventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  unsubscribe(event: string, callback: SocketEventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  private cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export function useSharedSocket(event: string, callback: SocketEventCallback) {
  const [socket] = useState(() => SharedSocket.getInstance());

  useEffect(() => {
    socket.subscribe(event, callback);
    return () => {
      socket.unsubscribe(event, callback);
    };
  }, [event, callback, socket]);
}
import { useEffect, useState } from 'react';

type SocketEvent = {
  type: string;
  data: unknown;
};

type EventCallback = (event: SocketEvent) => void;

class SharedSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<EventCallback>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(url: string) {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(url);

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.listeners.forEach((cb) => cb(data));
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(url), 2000 * this.reconnectAttempts);
      }
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }

  subscribe(callback: EventCallback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
  }
}

const sharedSocket = new SharedSocket();

export function useSharedSocket(url?: string) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (url) {
      sharedSocket.connect(url);
      setIsConnected(true);
    }

    return () => {
      // Don't disconnect on component unmount, only on app unload
    };
  }, [url]);

  return {
    subscribe: sharedSocket.subscribe.bind(sharedSocket),
    isConnected,
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    sharedSocket.disconnect();
  });
}
