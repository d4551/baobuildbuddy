import { type JsonObject, type JsonValue, STATE_KEYS, safeParseJson } from "@bao/shared";
import { onUnmounted, readonly, useRequestURL, useRuntimeConfig, useState } from "#imports";
import { settlePromise } from "~/composables/async-flow";
import { createClientLogger } from "~/utils/client-logger";

const TRAILING_SLASH_PATTERN = /\/$/;
const WS_PROTOCOL_PATTERN = /^wss?:\/\//i;
const HTTPS_PROTOCOL_PATTERN = /^https:/;
const HTTP_PROTOCOL_PATTERN = /^http:/;

const MAX_RECONNECT_ATTEMPTS = 10;
const MAX_RECONNECT_DELAY = 30_000;
const BASE_RECONNECT_DELAY = 1_000;
const CONNECTION_TIMEOUT = 10_000;
const PING_INTERVAL = 30_000;

const isJsonObject = (value: JsonValue): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPongMessage = (value: Record<string, unknown>): boolean => value.type === "pong";

type MessageHandler = (data: Record<string, unknown>) => void;
type DisconnectHandler = () => void;

type WebSocketRuntimeState = {
  socket: WebSocket | null;
  reconnectAttempts: number;
  reconnectTimeout: ReturnType<typeof setTimeout> | null;
  connectionTimeout: ReturnType<typeof setTimeout> | null;
  pingInterval: ReturnType<typeof setInterval> | null;
  messageHandlers: MessageHandler[];
  disconnectHandlers: DisconnectHandler[];
  currentPath: string | null;
};

type WebSocketBindings = {
  readonly connected: ReturnType<typeof useState<boolean>>;
  readonly lastMessage: ReturnType<typeof useState<Record<string, unknown> | null>>;
};

type WebSocketEnvironment = {
  readonly config: ReturnType<typeof useRuntimeConfig>;
  readonly requestUrl: ReturnType<typeof useRequestURL>;
  readonly logger: ReturnType<typeof createClientLogger>;
};

type WebSocketContext = WebSocketEnvironment & WebSocketBindings & { state: WebSocketRuntimeState };

function createRuntimeState(): WebSocketRuntimeState {
  return {
    socket: null,
    reconnectAttempts: 0,
    reconnectTimeout: null,
    connectionTimeout: null,
    pingInterval: null,
    messageHandlers: [],
    disconnectHandlers: [],
    currentPath: null,
  };
}

function getReconnectDelay(reconnectAttempts: number): number {
  return Math.min(BASE_RECONNECT_DELAY * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY);
}

function resolveWebSocketBase(environment: WebSocketEnvironment): string {
  const configuredBase = (
    environment.config.public.wsBase ||
    environment.config.public.apiBase ||
    "/"
  ).toString();
  const resolved = new URL(configuredBase, environment.requestUrl)
    .toString()
    .replace(TRAILING_SLASH_PATTERN, "");

  if (WS_PROTOCOL_PATTERN.test(resolved)) {
    return resolved;
  }

  if (environment.requestUrl.protocol === "https:") {
    return resolved.replace(HTTPS_PROTOCOL_PATTERN, "wss:").replace(HTTP_PROTOCOL_PATTERN, "wss:");
  }

  return resolved.replace(HTTPS_PROTOCOL_PATTERN, "ws:").replace(HTTP_PROTOCOL_PATTERN, "ws:");
}

function clearTimers(state: WebSocketRuntimeState): void {
  if (state.reconnectTimeout) {
    clearTimeout(state.reconnectTimeout);
    state.reconnectTimeout = null;
  }
  if (state.connectionTimeout) {
    clearTimeout(state.connectionTimeout);
    state.connectionTimeout = null;
  }
  if (state.pingInterval) {
    clearInterval(state.pingInterval);
    state.pingInterval = null;
  }
}

function logSettledTask(
  logger: ReturnType<typeof createClientLogger>,
  task: Promise<unknown>,
  errorPrefix: string,
): void {
  const settleTask = settlePromise(task, errorPrefix).then((result) => {
    if (!result.ok) {
      logger.error(errorPrefix, result.error);
    }
  });
  settleTask.catch((error: unknown) => {
    logger.error(errorPrefix, error);
  });
}

function runHandlerTask(
  logger: ReturnType<typeof createClientLogger>,
  task: () => void,
  errorPrefix: string,
): void {
  logSettledTask(logger, Promise.resolve().then(task), errorPrefix);
}

function containsCircularOrBigInt(value: unknown, seen: WeakSet<object>): boolean {
  if (typeof value === "bigint") {
    return true;
  }
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (seen.has(value)) {
    return true;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.some((entry) => containsCircularOrBigInt(entry, seen));
  }

  return Object.values(value).some((entry) => containsCircularOrBigInt(entry, seen));
}

function startPingInterval(context: WebSocketContext): void {
  if (context.state.pingInterval) {
    clearInterval(context.state.pingInterval);
  }

  context.state.pingInterval = setInterval(() => {
    if (!context.state.socket || context.state.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    logSettledTask(
      context.logger,
      Promise.resolve().then(() => {
        context.state.socket?.send(JSON.stringify({ type: "ping" }));
      }),
      "WebSocket ping failed",
    );
  }, PING_INTERVAL);
}

function parseSocketMessage(
  logger: ReturnType<typeof createClientLogger>,
  rawData: unknown,
): Record<string, unknown> | null {
  if (typeof rawData !== "string") {
    return null;
  }

  const parsed = safeParseJson(rawData);
  if (!(parsed && isJsonObject(parsed))) {
    logger.error("Failed to parse WebSocket message");
    return null;
  }

  return parsed;
}

function notifyDisconnectHandlers(context: WebSocketContext): void {
  for (const handler of context.state.disconnectHandlers) {
    runHandlerTask(context.logger, handler, "Error in disconnect handler");
  }
}

function dispatchSocketMessage(context: WebSocketContext, payload: Record<string, unknown>): void {
  if (isPongMessage(payload)) {
    return;
  }

  context.lastMessage.value = payload;
  for (const handler of context.state.messageHandlers) {
    runHandlerTask(
      context.logger,
      () => {
        handler(payload);
      },
      "Error in WebSocket message handler",
    );
  }
}

function scheduleReconnect(context: WebSocketContext, connect: (path: string) => void): void {
  if (!context.state.currentPath || context.state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    if (context.state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      context.logger.error(
        `WebSocket gave up after ${MAX_RECONNECT_ATTEMPTS} reconnection attempts`,
      );
    }
    return;
  }

  const delay = getReconnectDelay(context.state.reconnectAttempts);
  context.state.reconnectAttempts += 1;
  context.logger.debug(
    `WebSocket reconnecting in ${delay}ms (attempt ${context.state.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`,
  );

  context.state.reconnectTimeout = setTimeout(() => {
    if (context.state.currentPath) {
      connect(context.state.currentPath);
    }
  }, delay);
}

function attachSocketHandlers(
  context: WebSocketContext,
  socket: WebSocket,
  connect: (path: string) => void,
): void {
  socket.onopen = () => {
    if (context.state.connectionTimeout) {
      clearTimeout(context.state.connectionTimeout);
      context.state.connectionTimeout = null;
    }
    context.connected.value = true;
    context.state.reconnectAttempts = 0;
    startPingInterval(context);
  };

  socket.onmessage = (event) => {
    const payload = parseSocketMessage(context.logger, event.data);
    if (payload) {
      dispatchSocketMessage(context, payload);
    }
  };

  socket.onerror = (error) => {
    context.logger.error("WebSocket error:", error);
  };

  socket.onclose = () => {
    context.connected.value = false;
    clearTimers(context.state);
    notifyDisconnectHandlers(context);
    scheduleReconnect(context, connect);
  };
}

function buildWebSocketUrl(path: string, wsBase: string): string {
  const normalizedBase = wsBase.endsWith("/") ? wsBase.slice(0, -1) : wsBase;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function setConnectionTimeout(context: WebSocketContext, socket: WebSocket): void {
  context.state.connectionTimeout = setTimeout(() => {
    if (socket.readyState !== WebSocket.OPEN) {
      context.logger.warn("WebSocket connection timeout, closing");
      socket.close();
    }
  }, CONNECTION_TIMEOUT);
}

function createConnect(context: WebSocketContext) {
  const connect = (path: string): void => {
    if (context.state.socket && context.state.socket.readyState === WebSocket.OPEN) {
      return;
    }

    context.state.currentPath = path;
    const wsUrl = buildWebSocketUrl(path, resolveWebSocketBase(context));

    const connectionTask = settlePromise(
      Promise.resolve().then(() => new WebSocket(wsUrl)),
      "Failed to create WebSocket connection",
    ).then((connectionResult) => {
      if (!connectionResult.ok) {
        context.logger.error("Failed to create WebSocket connection:", connectionResult.error);
        context.connected.value = false;
        return;
      }

      context.state.socket = connectionResult.value;
      setConnectionTimeout(context, connectionResult.value);
      attachSocketHandlers(context, connectionResult.value, connect);
    });
    connectionTask.catch((error: unknown) => {
      context.logger.error("WebSocket connection task failed:", error);
    });
  };

  return connect;
}

function sendMessage(context: WebSocketContext, data: Record<string, unknown> | string): boolean {
  if (!context.state.socket || context.state.socket.readyState !== WebSocket.OPEN) {
    context.logger.error("WebSocket not connected");
    return false;
  }

  if (typeof data !== "string" && containsCircularOrBigInt(data, new WeakSet<object>())) {
    context.logger.error("WebSocket message contains unsupported JSON payload");
    return false;
  }

  const message = typeof data === "string" ? data : JSON.stringify(data);
  context.state.socket.send(message);
  return true;
}

function subscribeMessageHandler(context: WebSocketContext, callback: MessageHandler): () => void {
  context.state.messageHandlers.push(callback);
  return () => {
    context.state.messageHandlers = context.state.messageHandlers.filter(
      (handler) => handler !== callback,
    );
  };
}

function subscribeDisconnectHandler(
  context: WebSocketContext,
  callback: DisconnectHandler,
): () => void {
  context.state.disconnectHandlers.push(callback);
  return () => {
    context.state.disconnectHandlers = context.state.disconnectHandlers.filter(
      (handler) => handler !== callback,
    );
  };
}

function disconnectSocket(context: WebSocketContext): void {
  context.state.currentPath = null;
  clearTimers(context.state);

  if (context.state.socket) {
    context.state.socket.onclose = null;
    context.state.socket.close();
    context.state.socket = null;
  }

  context.connected.value = false;
  context.state.reconnectAttempts = 0;
  context.state.messageHandlers = [];
  context.state.disconnectHandlers = [];
}

/**
 * WebSocket connection manager with auto-reconnect, timeout, and keep-alive.
 */
export function useWebSocket() {
  const context: WebSocketContext = {
    config: useRuntimeConfig(),
    requestUrl: useRequestURL(),
    logger: createClientLogger("use-web-socket"),
    connected: useState(STATE_KEYS.WS_CONNECTED, () => false),
    lastMessage: useState<Record<string, unknown> | null>(STATE_KEYS.WS_LAST_MESSAGE, () => null),
    state: createRuntimeState(),
  };

  const connect = createConnect(context);
  const disconnect = () => disconnectSocket(context);

  if (import.meta.client) {
    onUnmounted(() => {
      disconnect();
    });
  }

  return {
    connected: readonly(context.connected),
    lastMessage: readonly(context.lastMessage),
    reconnectAttempts: context.state.reconnectAttempts,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
    connect,
    send: (data: Record<string, unknown> | string) => sendMessage(context, data),
    onMessage: (callback: MessageHandler) => subscribeMessageHandler(context, callback),
    onDisconnect: (callback: DisconnectHandler) => subscribeDisconnectHandler(context, callback),
    disconnect,
  };
}
