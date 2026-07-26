// STOMP client cho React Native — port từ web (src/websocket/stompClient.ts + chatSocket.ts).
// RN không có TextEncoder/TextDecoder sẵn nên cần polyfill trước khi import stompjs.
import 'text-encoding';
import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import { AUTH_TOKEN_NAME, WS_URL } from '@/lib/constants';
import { storage } from '@/lib/storage';

let client: Client | null = null;
let connectHandler: (() => void) | null = null;
let disconnectHandler: (() => void) | null = null;

// Lưu các subscription mong muốn để tự đăng ký lại mỗi khi (re)connect.
// Đây là điểm mấu chốt: trên mobile, thời điểm connect và thời điểm component
// yêu cầu subscribe thường lệch nhau → cần re-apply khi STOMP báo connected.
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
        // RN dùng global WebSocket.
        webSocketFactory: () => new WebSocket(WS_URL),
        // Tương thích React Native: RN WebSocket xử lý frame text không chuẩn khiến
        // frame STOMP CONNECT/CONNECTED bị treo. Ép gửi frame nhị phân và tự bù
        // ký tự NULL kết khung cho frame nhận vào để handshake hoàn tất.
        forceBinaryWSFrames: true,
        appendMissingNULLonIncoming: true,
        // Bật heartbeat để giữ kết nối ổn định.
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
        onWebSocketClose: (e: any) => log('WS CLOSE', e?.code, e?.reason),
    });

    return client;
}

export function connectSocket(handlers?: {
    onConnect?: () => void;
    onDisconnect?: () => void;
}): void {
    const c = getClient();
    connectHandler = handlers?.onConnect ?? null;
    disconnectHandler = handlers?.onDisconnect ?? null;
    // Nếu đã kết nối sẵn, báo ngay cho caller.
    if (c.connected) {
        connectHandler?.();
        return;
    }
    if (!c.active) {
        log('activate');
        c.activate();
    }
}

// Không ngắt socket khi rời một màn lẻ — giữ kết nối sống cho toàn app.
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
    callback: (message: any) => void,
): StompSubscription | null {
    const destination = `/topic/conversation/${conversationId}`;
    const key = destination;
    // Đăng ký "mong muốn" — sẽ được áp dụng ngay nếu đã connect, hoặc khi connect sau.
    desiredTopics.set(key, { destination, callback });
    log('want subscribe', destination, 'connected=', client?.connected ?? false);
    getClient();
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


export function sendTypingIndicator(payload: {
    conversationId: number;
    isTyping: boolean;
}): void {
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
    log('want subscribe', destination, 'connected=', client?.connected ?? false);
    getClient();
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
