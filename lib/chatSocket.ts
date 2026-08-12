import 'text-encoding';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { AUTH_TOKEN_NAME, WS_URL } from '@/lib/constants';
import { storage } from '@/lib/storage';

let client: Client | null = null;
let connectHandler: (() => void) | null = null;
let disconnectHandler: (() => void) | null = null;

type Topic = { destination: string; callback: (msg: any) => void };
const desiredTopics = new Map<string, Topic>();
const liveSubs = new Map<string, StompSubscription>();

function log(...args: any[]) {
  console.log('[chatSocket]', ...args);
}

function applySubscriptions() {
  if (!client?.connected) return;
  desiredTopics.forEach((topic, key) => {
    if (liveSubs.has(key)) return;
    log('subscribe →', topic.destination);
    const sub = client!.subscribe(topic.destination, (message: IMessage) => {
      try {
        topic.callback(JSON.parse(message.body));
      } catch (e) {
        log('parse error', e);
      }
    });
    liveSubs.set(key, sub);
  });
}

function getClient(): Client {
  if (client) return client;

  log('creating client →', WS_URL);
  client = new Client({
    reconnectDelay: 5000,

    webSocketFactory: () => new WebSocket(WS_URL),

    forceBinaryWSFrames: true,
    appendMissingNULLonIncoming: true,

    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    beforeConnect: async () => {
      const token = await storage.get(AUTH_TOKEN_NAME);
      client!.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      log('beforeConnect, hasToken=', !!token);
    },
    onConnect: () => {
      log('CONNECTED');
      applySubscriptions();
      connectHandler?.();
    },
    onDisconnect: () => {
      log('DISCONNECTED');
      liveSubs.clear();
      disconnectHandler?.();
    },
    onStompError: (frame) => log('STOMP ERROR', frame.headers?.message, frame.body),
    onWebSocketError: (e: any) => log('WS ERROR', e?.message ?? String(e)),

    onWebSocketClose: (e: any) => {
      log('WS CLOSE', e?.code, e?.reason);
      liveSubs.clear();
    },
  });

  return client;
}

function ensureActive(): void {
  const c = getClient();
  if (c.active || c.connected) return;
  storage.get(AUTH_TOKEN_NAME).then((token) => {
    if (!token) return;
    if (c.active || c.connected) return;
    log('activate (ensureActive)');
    c.activate();
  });
}

export function connectSocket(handlers?: {
  onConnect?: () => void;
  onDisconnect?: () => void;
}): void {
  const c = getClient();
  connectHandler = handlers?.onConnect ?? null;
  disconnectHandler = handlers?.onDisconnect ?? null;

  if (c.connected) {
    connectHandler?.();
    return;
  }
  if (!c.active) {
    log('activate');
    c.activate();
  }
}

export function disconnectSocket(): void {
  if (client?.active) {
    log('deactivate');
    client.deactivate();
  }
  liveSubs.clear();
  desiredTopics.clear();
}

export function isConnected(): boolean {
  return client?.connected ?? false;
}

export function subscribeConversation(
  conversationId: number,
  callback: (message: any) => void
): StompSubscription | null {
  const destination = `/topic/conversation/${conversationId}`;
  const key = destination;

  desiredTopics.set(key, { destination, callback });
  log('queue subscribe', destination, '(connected=', client?.connected ?? false, ')');
  ensureActive();
  applySubscriptions();
  return liveSubs.get(key) ?? null;
}

export function unsubscribeConversation(conversationId: number): void {
  const key = `/topic/conversation/${conversationId}`;
  desiredTopics.delete(key);
  const sub = liveSubs.get(key);
  if (sub) {
    sub.unsubscribe();
    liveSubs.delete(key);
  }
}

export function sendMessage(message: {
  conversationId: number;
  content: string;
  messageType?: string;
}): void {
  if (!client?.connected) {
    log('sendMessage skipped — not connected');
    return;
  }
  client.publish({
    destination: '/app/chat.send',
    body: JSON.stringify(message),
  });
}

export function sendTypingIndicator(payload: { conversationId: number; isTyping: boolean }): void {
  if (!client?.connected) return;
  client.publish({
    destination: '/app/chat.typing',
    body: JSON.stringify(payload),
  });
}

export function sendCallSignal(type: string, payload: any): void {
  if (!client?.connected) {
    log('sendCallSignal skipped — not connected');
    return;
  }
  client.publish({
    destination: '/app/call.signal',
    body: JSON.stringify({ type, payload }),
  });
}

export function subscribeCallSignals(callback: (signal: any) => void): StompSubscription | null {
  const destination = '/user/queue/call';
  const key = destination;
  desiredTopics.set(key, { destination, callback });
  log('queue subscribe', destination, '(connected=', client?.connected ?? false, ')');
  ensureActive();
  applySubscriptions();
  return liveSubs.get(key) ?? null;
}

export function unsubscribeCallSignals(): void {
  const key = '/user/queue/call';
  desiredTopics.delete(key);
  const sub = liveSubs.get(key);
  if (sub) {
    sub.unsubscribe();
    liveSubs.delete(key);
  }
}

export function subscribeMessageNotifications(
  callback: (notification: any) => void
): StompSubscription | null {
  const destination = '/user/queue/messages';
  const key = destination;
  desiredTopics.set(key, { destination, callback });
  log('queue subscribe', destination, '(connected=', client?.connected ?? false, ')');
  ensureActive();
  applySubscriptions();
  return liveSubs.get(key) ?? null;
}

export function unsubscribeMessageNotifications(): void {
  const key = '/user/queue/messages';
  desiredTopics.delete(key);
  const sub = liveSubs.get(key);
  if (sub) {
    sub.unsubscribe();
    liveSubs.delete(key);
  }
}
