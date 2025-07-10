import { showAuthModal } from "../sidebar/components/auth";

export type ChatEvent = { text: string } | { error: string };
export type ChatSession = { id: number; name: string; created_at: string; };
export type ChatMessage = { id: number; role: 'user' | 'assistant'; content: string; created_at: string; };

const API_URL = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL || API_URL.replace(/^http(s?):\/\//, 'wss://');

async function fetchViaBackground(url: string, options: RequestInit): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                type: "CHAT_SYSTEM",
                url,
                options,
            },
            (response) => {
                if (!response) {
                    reject("No response from background");
                } else if (!response.ok) {
                    reject(response);
                } else {
                    resolve(response.data);
                }
            }
        );
    });
}

export class ChatService {
    private static ws: WebSocket | null = null;
    private static token: string | null = null;
    private static onMessageCallback: ((event: ChatEvent) => void) | null = null;
    private static wsUrl = (token: string, chatId?: number) =>
        chatId ? `${WS_URL}/chat/websocket?token=${token}&chat_id=${chatId}` : `${WS_URL}/chat/websocket?token=${token}`;

    static connect(token: string, onMessage: (event: ChatEvent) => void, chatId?: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.disconnect();
            this.token = token;
            this.onMessageCallback = onMessage;
            this.ws = new WebSocket(this.wsUrl(token, chatId));

            this.ws.onopen = () => {
                console.log("WebSocket connection established");
                resolve();
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
                console.log("WebSocket connection closed");
            };

            this.ws.onerror = (event) => {
                console.error("WebSocket error:", event);
                onMessage({ error: "WebSocket error" });
                reject(new Error("WebSocket error"));
            };
        });
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

    static async getChatSessions(token: string, doc: Document): Promise<ChatSession[]> {
        try {
            const data = await fetchViaBackground(
                `${API_URL}/chat/all`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            return data;
        } catch (res: any) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            throw new Error('Ошибка получения истории чатов');
        }
    }

    static async getChatMessages(sessionId: number, token: string): Promise<ChatMessage[]> {
        try {
            const data = await fetchViaBackground(
                `${API_URL}/chat/messages/${sessionId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            return data;
        } catch (res: any) {
            throw new Error('Ошибка получения сообщений чата');
        }
    }

    static async deleteChatSession(sessionId: number, token: string, doc: Document): Promise<void> {
        try {
            await fetchViaBackground(
                `${API_URL}/chat/delete?chat_id=${sessionId}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
        } catch (res: any) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            console.log(res);
            return;
        }
    }
} 