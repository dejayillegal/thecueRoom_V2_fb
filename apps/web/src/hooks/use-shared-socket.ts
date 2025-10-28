
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
