import { useEffect, useRef, useState } from 'react';

let sharedSocket: WebSocket | null = null;
let subscriberCount = 0;

export function useSharedSocket(url: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!url) return;

    subscriberCount++;

    if (!sharedSocket || sharedSocket.readyState === WebSocket.CLOSED) {
      sharedSocket = new WebSocket(url);

      sharedSocket.onopen = () => setIsConnected(true);
      sharedSocket.onclose = () => {
        setIsConnected(false);
        if (subscriberCount > 0) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (subscriberCount > 0) {
              sharedSocket = new WebSocket(url);
            }
          }, 5000);
        }
      };
    } else if (sharedSocket.readyState === WebSocket.OPEN) {
      setIsConnected(true);
    }

    return () => {
      subscriberCount--;
      if (subscriberCount === 0 && sharedSocket) {
        sharedSocket.close();
        sharedSocket = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [url]);

  return { socket: sharedSocket, isConnected };
}