import { useEffect, useRef, useState } from "react";

type SocketEventHandler = (data: any) => void;

class SharedSocket {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<SocketEventHandler>> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;

  connect(url: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.socket = new WebSocket(url);

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handlers = this.listeners.get(data.type);
        handlers?.forEach((handler) => handler(data));
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    this.socket.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connect(url), 5000);
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  on(event: string, handler: SocketEventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off(event: string, handler: SocketEventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.listeners.clear();
  }
}

const sharedSocket = new SharedSocket();

/**
 * Hook to use shared WebSocket connection
 * @param event - Event name to listen to
 * @param handler - Event handler
 * @param url - WebSocket URL
 */
export function useSharedSocket(
  event: string,
  handler: SocketEventHandler,
  url: string = "ws://localhost:5000/ws",
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const wrappedHandler = (data: any) => handlerRef.current(data);

    sharedSocket.connect(url);
    sharedSocket.on(event, wrappedHandler);

    return () => {
      sharedSocket.off(event, wrappedHandler);
    };
  }, [event, url]);
}
