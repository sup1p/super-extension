import { ChatService, ChatEvent, ChatSession, ChatMessage } from "../../services/chat";
import { AuthService } from "../../services/auth";

export class ChatComponent {
    static initChat(doc: Document): void {
        const chatContainer = doc.getElementById('chat-container');
        const chatForm = doc.getElementById('chat-form') as HTMLFormElement;
        const chatInput = doc.getElementById('chat-input') as HTMLTextAreaElement;
        const chatNewBtn = doc.getElementById('chat-new') as HTMLButtonElement;
        const chatHistoryBtn = doc.getElementById('chat-history') as HTMLButtonElement;

        if (!chatContainer || !chatForm || !chatInput) return;

        // Получаем токен через AuthService
        AuthService.getToken().then(token => {
            console.log('[ChatComponent] Используемый токен для WebSocket:', token);
            if (!token) {
                alert('Требуется авторизация для чата!');
                return;
            }
            // Подключаем WebSocket
            ChatService.connect(token, (event: ChatEvent) => {
                if ('text' in event) {
                    // Удалить последний 'ai' с текстом '...'
                    const lastMsg = chatContainer.querySelector('.chat-message.ai:last-child');
                    if (lastMsg && lastMsg.textContent === '...') {
                        lastMsg.remove();
                    }
                    ChatComponent.appendMessage(chatContainer, event.text, 'ai');
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                } else if ('error' in event) {
                    alert('Ошибка чата: ' + event.error);
                }
            });
        });

        if (chatNewBtn) {
            chatNewBtn.addEventListener('click', () => {
                chatContainer.innerHTML = '';
                ChatService.resetSession();
            });
        }
        if (chatHistoryBtn) {
            chatHistoryBtn.addEventListener('click', async () => {
                // Модальное окно истории чатов
                let modal = doc.getElementById('chat-history-modal');
                if (modal) modal.remove();
                modal = doc.createElement('div');
                modal.id = 'chat-history-modal';
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100vw';
                modal.style.height = '100vh';
                modal.style.background = 'rgba(0,0,0,0.7)';
                modal.style.zIndex = '99999';
                modal.style.display = 'flex';
                modal.style.justifyContent = 'center';
                modal.style.alignItems = 'center';

                const inner = doc.createElement('div');
                inner.style.background = '#151515';
                inner.style.borderRadius = '12px';
                inner.style.padding = '32px 24px';
                inner.style.minWidth = '340px';
                inner.style.maxHeight = '80vh';
                inner.style.overflowY = 'auto';
                inner.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';

                const closeBtn = doc.createElement('button');
                closeBtn.textContent = '×';
                closeBtn.style.position = 'absolute';
                closeBtn.style.top = '24px';
                closeBtn.style.right = '36px';
                closeBtn.style.background = 'none';
                closeBtn.style.border = 'none';
                closeBtn.style.fontSize = '28px';
                closeBtn.style.color = '#fff';
                closeBtn.style.cursor = 'pointer';
                closeBtn.onclick = () => modal.remove();
                inner.appendChild(closeBtn);

                const title = doc.createElement('h2');
                title.textContent = 'История чатов';
                title.style.color = '#fff';
                title.style.marginBottom = '18px';
                inner.appendChild(title);

                // Получаем токен и чаты
                const token = await AuthService.getToken();
                if (!token) {
                    alert('Требуется авторизация для истории чатов!');
                    return;
                }
                let sessions: ChatSession[] = [];
                try {
                    sessions = await ChatService.getChatSessions(token);
                } catch (e) {
                    inner.appendChild(doc.createTextNode('Ошибка загрузки истории чатов.'));
                }

                if (sessions.length === 0) {
                    const empty = doc.createElement('div');
                    empty.textContent = 'Нет чатов.';
                    empty.style.color = '#aaa';
                    inner.appendChild(empty);
                } else {
                    const list = doc.createElement('ul');
                    list.style.listStyle = 'none';
                    list.style.padding = '0';
                    list.style.margin = '0';
                    sessions.forEach(session => {
                        const item = doc.createElement('li');
                        item.style.padding = '12px 0';
                        item.style.borderBottom = '1px solid #232323';
                        item.style.cursor = 'pointer';
                        item.style.color = '#fff';
                        item.textContent = `${session.name}  (${new Date(session.created_at).toLocaleString()})`;
                        item.onclick = async () => {
                            // Загрузить сообщения чата
                            let messages: ChatMessage[] = [];
                            try {
                                messages = await ChatService.getChatMessages(session.id, token);
                            } catch (e) {
                                alert('Ошибка загрузки сообщений чата');
                                return;
                            }
                            // Показать сообщения в основном окне чата
                            chatContainer.innerHTML = '';
                            messages.forEach(msg => {
                                const role = msg.role === 'assistant' ? 'ai' : 'user';
                                ChatComponent.appendMessage(chatContainer, msg.content, role);
                            });
                            modal.remove();
                        };
                        list.appendChild(item);
                    });
                    inner.appendChild(list);
                }

                modal.appendChild(inner);
                doc.body.appendChild(modal);
            });
        }

        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userMessage = chatInput.value.trim();
            if (!userMessage) return;

            // Add user message to chat
            ChatComponent.appendMessage(chatContainer, userMessage, 'user');
            chatInput.value = '';
            chatInput.style.height = 'auto';

            // Показать placeholder "..." от ИИ
            ChatComponent.appendMessage(chatContainer, '...', 'ai');
            chatContainer.scrollTop = chatContainer.scrollHeight;

            // Отправить сообщение через WebSocket
            ChatService.sendMessage(userMessage);
        });

        // Auto-resize textarea
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = chatInput.scrollHeight + 'px';
        });
    }

    static appendMessage(container: HTMLElement, text: string, role: 'user' | 'ai') {
        const msg = document.createElement('div');
        msg.className = 'chat-message ' + role;
        msg.textContent = text;
        msg.style.alignSelf = role === 'user' ? 'flex-end' : 'flex-start';
        msg.style.background = role === 'user' ? '#1F1D1D' : '#000000';
        msg.style.color = '#fff';
        msg.style.padding = '10px 16px';
        msg.style.borderRadius = role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px';
        msg.style.maxWidth = '70%';
        msg.style.marginTop = '2px';
        container.appendChild(msg);
    }
} 