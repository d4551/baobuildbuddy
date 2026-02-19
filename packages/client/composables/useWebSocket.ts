import { STATE_KEYS } from "@bao/shared";

/**
 * WebSocket connection manager with auto-reconnect, timeout, and keep-alive.
 */
export function useWebSocket() {
  const config = useRuntimeConfig();
  const connected = useState(STATE_KEYS.WS_CONNECTED, () => false);
  const lastMessage = useState<Record<string, unknown> | null>(STATE_KEYS.WS_LAST_MESSAGE, () => null);
  const requestUrl = useRequestURL();

  let socket: WebSocket | null = null;
  let reconnectAttempts = 0;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  let pingInterval: ReturnType<typeof setInterval> | null = null;
  let messageHandlers: Array<(data: Record<string, unknown>) => void> = [];
  let disconnectHandlers: Array<() => void> = [];
  let currentPath: string | null = null;

  const MAX_RECONNECT_ATTEMPTS = 10;
  const MAX_RECONNECT_DELAY = 30_000;
  const BASE_RECONNECT_DELAY = 1_000;
  const CONNECTION_TIMEOUT = 10_000;
  const PING_INTERVAL = 30_000;

  function getReconnectDelay(): number {
    return Math.min(BASE_RECONNECT_DELAY * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY);
  }

  function resolveWebSocketBase(): string {
    const configuredBase = (config.public.wsBase || config.public.apiBase || "/").toString();
    const resolved = new URL(configuredBase, requestUrl).toString().replace(/\/$/, "");

    if (/^wss?:\/\//i.test(resolved)) {
      return resolved;
    }

    return requestUrl.protocol === "https:"
      ? resolved.replace(/^https:/, "wss:").replace(/^http:/, "wss:")
      : resolved.replace(/^https:/, "ws:").replace(/^http:/, "ws:");
  }

  function clearTimers() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
  }

  function startPingInterval() {
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ type: "ping" }));
        } catch {
          // Connection lost, will be handled by onclose
        }
      }
    }, PING_INTERVAL);
  }

  function connect(path: string) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      return;
    }

    currentPath = path;
    const wsBase = resolveWebSocketBase();
    const normalizedBase = wsBase.endsWith("/") ? wsBase.slice(0, -1) : wsBase;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const wsUrl = `${normalizedBase}${normalizedPath}`;

    try {
      socket = new WebSocket(wsUrl);

      // Connection timeout — if socket doesn't open in 10s, abort
      connectionTimeout = setTimeout(() => {
        if (socket && socket.readyState !== WebSocket.OPEN) {
          console.warn("WebSocket connection timeout, closing");
          socket.close();
        }
      }, CONNECTION_TIMEOUT);

      socket.onopen = () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        connected.value = true;
        reconnectAttempts = 0;
        startPingInterval();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as Record<string, unknown>;
          if (data.type === "pong") return; // Ignore keep-alive responses
          lastMessage.value = data;
          for (const handler of messageHandlers) {
            try {
              handler(data);
            } catch (err) {
              console.error("Error in WebSocket message handler:", err);
            }
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = () => {
        connected.value = false;
        clearTimers();

        // Notify disconnect handlers
        for (const handler of disconnectHandlers) {
          try {
            handler();
          } catch (err) {
            console.error("Error in disconnect handler:", err);
          }
        }

        // Auto-reconnect with exponential backoff (up to max attempts)
        if (currentPath && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = getReconnectDelay();
          reconnectAttempts++;
          console.log(
            `WebSocket reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
          );

          reconnectTimeout = setTimeout(() => {
            if (currentPath) connect(currentPath);
          }, delay);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error(`WebSocket gave up after ${MAX_RECONNECT_ATTEMPTS} reconnection attempts`);
        }
      };
    } catch (err) {
      console.error("Failed to create WebSocket connection:", err);
      connected.value = false;
    }
  }

  function send(data: Record<string, unknown> | string): boolean {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return false;
    }

    try {
      const message = typeof data === "string" ? data : JSON.stringify(data);
      socket.send(message);
      return true;
    } catch (err) {
      console.error("Failed to send WebSocket message:", err);
      return false;
    }
  }

  function onMessage(callback: (data: Record<string, unknown>) => void): () => void {
    messageHandlers.push(callback);
    return () => {
      messageHandlers = messageHandlers.filter((h) => h !== callback);
    };
  }

  function onDisconnect(callback: () => void): () => void {
    disconnectHandlers.push(callback);
    return () => {
      disconnectHandlers = disconnectHandlers.filter((h) => h !== callback);
    };
  }

  function disconnect() {
    currentPath = null;
    clearTimers();

    if (socket) {
      socket.onclose = null; // Prevent auto-reconnect on intentional disconnect
      socket.close();
      socket = null;
    }

    connected.value = false;
    reconnectAttempts = 0;
    messageHandlers = [];
    disconnectHandlers = [];
  }

  // Cleanup on component unmount
  if (import.meta.client) {
    onUnmounted(() => {
      disconnect();
    });
  }

  return {
    connected: readonly(connected),
    lastMessage: readonly(lastMessage),
    reconnectAttempts,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    connect,
    send,
    onMessage,
    onDisconnect,
    disconnect,
  };
}
