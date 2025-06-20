export type ChatEvent = { text: string } | { error: string };
export type ChatSession = { id: number; name: string; created_at: string; };
export type ChatMessage = { id: number; role: 'user' | 'assistant'; content: string; created_at: string; };

export class ChatService {
    private static ws: WebSocket | null = null;
    private static token: string | null = null;
    private static onMessageCallback: ((event: ChatEvent) => void) | null = null;
    private static wsUrl = (token: string) => `${process.env.BACKEND_WS_URL || "ws://localhost:8000"}/chat/websocket?token=${token}`;

    static connect(token: string, onMessage: (event: ChatEvent) => void) {
        this.disconnect();
        this.token = token;
        this.onMessageCallback = onMessage;
        this.ws = new WebSocket(this.wsUrl(token));
        this.ws.onopen = () => {
            // соединение установлено
        };
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.error) {
                    onMessage({ error: data.error });
                } else if (data.text) {
                    onMessage({ text: data.text });
                }
            } catch (e) {
                onMessage({ error: "Invalid message format" });
            }
        };
        this.ws.onclose = () => {
            // соединение закрыто
        };
        this.ws.onerror = () => {
            onMessage({ error: "WebSocket error" });
        };
    }

    static sendMessage(message: string) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            if (this.onMessageCallback) {
                this.onMessageCallback({ error: "WebSocket не подключён" });
            }
        }
    }

    static resetSession() {
        if (this.token && this.onMessageCallback) {
            this.connect(this.token, this.onMessageCallback);
        } else {
            this.disconnect();
        }
    }

    static disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    // Старый мок-метод для fallback (если нет WebSocket)
    static async sendMessageMock(message: string): Promise<string> {
        await new Promise(r => setTimeout(r, 800));
        if (message.toLowerCase().includes('анекдот')) {
            return 'Почему программисты путают Хэллоуин и Рождество? Потому что 31 OCT = 25 DEC! 🎃🎄';
        }
        return 'AI: ' + message.split('').reverse().join('');
    }

    static async getChatSessions(token: string): Promise<ChatSession[]> {
        const res = await fetch('http://localhost:8000/chat/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Ошибка получения истории чатов');
        return await res.json();
    }

    static async getChatMessages(sessionId: number, token: string): Promise<ChatMessage[]> {
        const res = await fetch(`http://localhost:8000/chat/messages/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Ошибка получения сообщений чата');
        return await res.json();
    }
} 