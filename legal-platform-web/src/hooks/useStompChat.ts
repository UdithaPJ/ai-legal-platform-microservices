"use client";

import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import type { Message } from "@/types/message";

// The API gateway handles /ws-chat/** via lb:ws://messaging-service.
// Derive the WebSocket base URL from the public gateway URL so it works in
// any environment (ws:// in dev, wss:// in prod behind HTTPS).
const GW_HTTP = (process.env.NEXT_PUBLIC_API_GATEWAY_URL ?? "http://localhost:8080").replace(/\/$/, "");
const GW_WS   = GW_HTTP.replace(/^http/, "ws");   // http→ws  https→wss

interface Options {
  conversationId: string | undefined;
  accessToken:    string | undefined;
  /** Called for every inbound message on the subscribed topic. */
  onMessage: (msg: Message) => void;
}

/**
 * Connects to the messaging-service STOMP broker, subscribes to
 * `/topic/conversations/{conversationId}`, and calls `onMessage` for
 * every frame received.
 *
 * Returns `{ connected }` so callers can show a live indicator.
 *
 * The hook reconnects automatically when `conversationId` or
 * `accessToken` changes, and disconnects cleanly on unmount.
 */
export function useStompChat({ conversationId, accessToken, onMessage }: Options) {
  const [connected, setConnected] = useState(false);

  // Keep the latest callback in a ref so changing `onMessage` doesn't
  // force a full reconnect.
  const onMessageRef = useRef(onMessage);
  useEffect(() => { onMessageRef.current = onMessage; });

  useEffect(() => {
    if (!conversationId || !accessToken) return;

    const client = new Client({
      brokerURL: `${GW_WS}/ws-chat`,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,

      onConnect: () => {
        setConnected(true);
        client.subscribe(
          `/topic/conversations/${conversationId}`,
          (frame) => {
            try {
              const msg = JSON.parse(frame.body) as Message;
              onMessageRef.current(msg);
            } catch {
              // ignore malformed frames
            }
          }
        );
      },

      onDisconnect: () => setConnected(false),
      onStompError:  () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();

    return () => {
      setConnected(false);
      void client.deactivate();
    };
  }, [conversationId, accessToken]);

  return { connected };
}
