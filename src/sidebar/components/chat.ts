import { ChatService, ChatEvent, ChatSession, ChatMessage } from "../../services/chat";
import { AuthService } from "../../services/auth";
import { TranslationService } from "../../services/translations";

export class ChatComponent {
    static currentChatId: number | null = null;
    static initChat(doc: Document): void {
        const chatContainer = doc.getElementById('chat-container');
        const chatForm = doc.getElementById('chat-form') as HTMLFormElement;
        const chatInput = doc.getElementById('chat-input') as HTMLTextAreaElement;
        const chatNewBtn = doc.getElementById('chat-new') as HTMLButtonElement;
        const chatHistoryBtn = doc.getElementById('chat-history') as HTMLButtonElement;
        let isConnected = false;

        if (!chatContainer || !chatForm || !chatInput) return;

        // Получаем токен через AuthService
        const connectWebSocket = async () => {
            try {
                const token = await AuthService.getToken();
                if (!token) {
                    console.log("No token, can't connect chat.");
                    isConnected = false;
                    return;
                }
                await ChatService.connect(token, (event: ChatEvent) => {
                    if ('text' in event) {
                        // Удалить "раздумье" если оно есть
                        const thinking = chatContainer.querySelector('.ai-thinking-animation');
                        if (thinking) {
                            if ((thinking as any)._thinkingTimeout) clearTimeout((thinking as any)._thinkingTimeout);
                            thinking.remove();
                        }
                        const lastMsg = chatContainer.querySelector('.chat-message.ai:last-child');
                        if (lastMsg && lastMsg.classList.contains('ai-thinking-animation')) {
                            // уже удалили выше
                        } else if (lastMsg && lastMsg.textContent === '...') {
                            lastMsg.remove();
                        }
                        ChatComponent.appendMessage(chatContainer, event.text, 'ai');
                        chatContainer.scrollTop = chatContainer.scrollHeight;
                    } else if ('error' in event) {
                        console.log('Ошибка чата: ' + event.error);
                        isConnected = false; // Сбросить флаг при ошибке
                    }
                }, ChatComponent.currentChatId ?? undefined);
                isConnected = true;
            } catch (error) {
                console.error("Failed to connect WebSocket:", error);
                isConnected = false;
            }
        };

        connectWebSocket();

        if (chatNewBtn) {
            chatNewBtn.addEventListener('click', () => {
                chatContainer.innerHTML = '';
                ChatComponent.currentChatId = null;
                ChatService.resetSession();
                connectWebSocket(); // Переподключаемся для новой сессии
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
                inner.style.background = 'var(--color-container)';
                inner.style.borderRadius = '12px';
                inner.style.padding = '32px 24px';
                inner.style.minWidth = '340px';
                inner.style.maxHeight = '80vh';
                inner.style.overflowY = 'auto';
                inner.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';

                const closeBtnRow = doc.createElement('div');
                closeBtnRow.style.display = 'flex';
                closeBtnRow.style.justifyContent = 'flex-end';
                closeBtnRow.style.marginBottom = '8px';
                const closeBtn = doc.createElement('button');
                closeBtn.textContent = '×';
                closeBtn.style.background = 'none';
                closeBtn.style.border = 'none';
                closeBtn.style.fontSize = '28px';
                closeBtn.style.color = 'var(--color-text)';
                closeBtn.style.cursor = 'pointer';
                closeBtn.style.lineHeight = '1';
                closeBtn.style.padding = '0 8px';
                closeBtn.onclick = () => modal.remove();
                closeBtnRow.appendChild(closeBtn);
                inner.appendChild(closeBtnRow);

                const title = doc.createElement('h2');
                title.textContent = TranslationService.translate('chat_history');
                title.style.color = 'var(--color-text)';
                title.style.marginBottom = '18px';
                inner.appendChild(title);

                // Получаем токен и чаты
                const token = await AuthService.getToken();
                if (!token) {
                    return;
                }
                let sessions: ChatSession[] = [];
                try {
                    sessions = await ChatService.getChatSessions(token, doc);
                } catch (e) {
                    inner.appendChild(doc.createTextNode(TranslationService.translate('error_loading_chat_history')));
                }

                if (sessions.length === 0) {
                    const empty = doc.createElement('div');
                    empty.textContent = TranslationService.translate('no_chats');
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
                        item.style.borderBottom = '1px solid var(--color-border)';
                        item.style.cursor = 'pointer';
                        item.style.color = 'var(--color-text)';
                        item.textContent = `${session.name}  (${new Date(session.created_at).toLocaleString()})`;
                        item.onclick = async () => {
                            // Загрузить сообщения чата
                            let messages: ChatMessage[] = [];
                            try {
                                messages = await ChatService.getChatMessages(session.id, token);
                            } catch (e) {
                                alert(TranslationService.translate('error_loading_messages'));
                                return;
                            }
                            // Показать сообщения в основном окне чата
                            chatContainer.innerHTML = '';
                            ChatComponent.currentChatId = session.id;
                            messages.forEach(msg => {
                                const role = msg.role === 'assistant' ? 'ai' : 'user';
                                ChatComponent.appendMessage(chatContainer, msg.content, role, false);
                            });
                            modal.remove();
                            connectWebSocket();
                        };
                        // Кнопка удаления
                        const deleteBtn = doc.createElement('button');
                        deleteBtn.title = TranslationService.translate('delete_chat');
                        deleteBtn.style.marginLeft = '12px';
                        deleteBtn.style.background = 'none';
                        deleteBtn.style.border = 'none';
                        deleteBtn.style.color = '#e66';
                        deleteBtn.style.cursor = 'pointer';
                        deleteBtn.style.display = 'inline-flex';
                        deleteBtn.style.alignItems = 'center';
                        deleteBtn.style.justifyContent = 'center';
                        deleteBtn.style.padding = '0';
                        deleteBtn.style.width = '22px';
                        deleteBtn.style.height = '22px';
                        deleteBtn.innerHTML = `
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 7V15C6 15.5523 6.44772 16 7 16H13C13.5523 16 14 15.5523 14 15V7" stroke="#e66" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M4 7H16" stroke="#e66" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M9 10V13" stroke="#e66" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M11 10V13" stroke="#e66" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M8 7V5C8 4.44772 8.44772 4 9 4H11C11.5523 4 12 4.44772 12 5V7" stroke="#e66" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        `;
                        deleteBtn.onclick = async (e) => {
                            e.stopPropagation();
                            // Кастомная модалка подтверждения удаления чата
                            let customModal = doc.getElementById('delete-chat-modal') as HTMLElement | null;
                            if (customModal) customModal.remove();
                            customModal = doc.createElement('div');
                            customModal.id = 'delete-chat-modal';
                            customModal.className = 'tools-modal-overlay active';
                            customModal.innerHTML = `
                                <div class="modal-content tools-modal-content" style="max-width:340px;">
                                    <div class="modal-header">
                                        <div class="modal-title">${TranslationService.translate('delete_chat_confirm')}</div>
                                    </div>
                                    <div style="margin-bottom:18px; font-size:15px; text-align:center;">${TranslationService.translate('delete_chat_message')}</div>
                                    <div style="display:flex; gap:16px; justify-content:center;">
                                        <button id="delete-chat-confirm" style="background:#ff4444;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:15px;cursor:pointer;">${TranslationService.translate('delete')}</button>
                                        <button id="delete-chat-cancel" style="background:#232323;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:15px;cursor:pointer;">${TranslationService.translate('cancel')}</button>
                                    </div>
                                </div>
                            `;
                            inner.appendChild(customModal);
                            const confirmBtn = doc.getElementById('delete-chat-confirm');
                            const cancelBtn = doc.getElementById('delete-chat-cancel');
                            function cleanup() {
                                if (customModal) customModal.remove();
                                if (confirmBtn) confirmBtn.replaceWith(confirmBtn.cloneNode(true));
                                if (cancelBtn) cancelBtn.replaceWith(cancelBtn.cloneNode(true));
                            }
                            if (confirmBtn && cancelBtn) {
                                confirmBtn.onclick = async () => {
                                    cleanup();
                                    try {
                                        await ChatService.deleteChatSession(session.id, token, doc);
                                        item.remove();
                                        // Если после удаления нет чатов, показать сообщение
                                        if (list.childElementCount === 0) {
                                            const empty = doc.createElement('div');
                                            empty.textContent = TranslationService.translate('no_chats');
                                            empty.style.color = '#aaa';
                                            inner.appendChild(empty);
                                        }
                                        // Если удалённый чат был открыт — сбросить состояние и начать новый чат
                                        if (ChatComponent.currentChatId === session.id) {
                                            ChatComponent.currentChatId = null;
                                            chatContainer.innerHTML = '';
                                            ChatService.resetSession();
                                            connectWebSocket();
                                            // Закрыть модалку истории чатов, если она открыта
                                            const modal = doc.getElementById('chat-history-modal');
                                            if (modal) modal.remove();
                                        }
                                    } catch (err) {
                                        alert(TranslationService.translate('error_deleting_chat'));
                                    }
                                };
                                cancelBtn.onclick = () => {
                                    cleanup();
                                };
                            }
                        };
                        item.appendChild(deleteBtn);
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
            if (!userMessage || !isConnected) {
                if (!isConnected) console.log("Can't send message, not connected.");
                return;
            }

            // Add user message to chat
            ChatComponent.appendMessage(chatContainer, userMessage, 'user');
            chatInput.value = '';
            chatInput.style.height = 'auto';

            // Показать анимацию "раздумья" от ИИ
            ChatComponent.showThinkingAnimation(chatContainer);
            chatContainer.scrollTop = chatContainer.scrollHeight;

            // Отправить сообщение через WebSocket
            ChatService.sendMessage(userMessage);
        });

        // Auto-resize textarea
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = chatInput.scrollHeight + 'px';
        });

        // Send message on Enter (but allow Shift+Enter for newline)
        chatInput.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                chatForm.requestSubmit();
            }
        });
    }

    static appendMessage(container: HTMLElement, text: string, role: 'user' | 'ai', animate: boolean = true) {
        const msg = document.createElement('div');
        msg.className = 'chat-message ' + role;
        msg.style.alignSelf = role === 'user' ? 'flex-end' : 'flex-start';
        msg.style.background = role === 'user' ? 'var(--color-container)' : 'var(--color-bg)';
        msg.style.color = 'var(--color-text)';
        msg.style.padding = '10px 16px';
        msg.style.border = role === 'user' ? 'var(--color-border)' : 'none';
        msg.style.borderRadius = role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px';
        msg.style.maxWidth = role === 'user' ? '70%' : '100%';
        msg.style.marginTop = '2px';
        if (role === 'ai') {
            this.animateMessageMarkdown(msg, text, 4, animate);
        } else {
            msg.textContent = text;
        }
        container.appendChild(msg);
    }

    // Плавная "печать" текста для AI-сообщений с поддержкой Markdown
    static animateMessageMarkdown(element: HTMLElement, text: string, speed: number = 4, animate: boolean = true) {
        function escapeHtml(str: string) {
            return str.replace(/[&<>"']/g, function (tag) {
                const chars: any = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' };
                return chars[tag] || tag;
            });
        }
        function markdownToHtml(str: string) {
            str = str.replace(/\n\* (.+)/g, '<li>$1</li>');
            if (/^<li>/.test(str)) str = '<ul>' + str + '</ul>';
            str = str.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
            str = str.replace(/\*(.+?)\*/g, '<i>$1</i>');
            str = str.replace(/\n/g, '<br>');
            return str;
        }
        if (!animate) {
            element.innerHTML = markdownToHtml(escapeHtml(text));
            return;
        }
        let i = 0;
        let cursor = document.createElement('span');
        cursor.className = 'chat-typing-cursor';
        cursor.textContent = '▍';
        cursor.style.display = 'inline-block';
        cursor.style.animation = 'blink-cursor 1s steps(1) infinite';
        element.innerHTML = '';
        element.appendChild(cursor);
        function printNext() {
            if (i <= text.length) {
                let html = markdownToHtml(escapeHtml(text.slice(0, i)));
                element.innerHTML = html;
                element.appendChild(cursor);
                i++;
                element.scrollIntoView({ behavior: 'auto', block: 'end' });
                setTimeout(printNext, speed);
            } else {
                cursor.remove();
                element.innerHTML = markdownToHtml(escapeHtml(text));
            }
        }
        printNext();
    }

    // Показать "раздумье" AI — анимация прыгающих трёх точек
    static showThinkingAnimation(container: HTMLElement) {
        // Удалить предыдущую анимацию, если есть
        const prev = container.querySelector('.ai-thinking-animation');
        if (prev) prev.remove();
        const anim = document.createElement('div');
        anim.className = 'chat-message ai ai-thinking-animation';
        anim.style.alignSelf = 'flex-start';
        anim.style.background = 'var(--color-bg)';
        anim.style.color = '#888';
        anim.style.opacity = '0.7';
        anim.style.fontStyle = 'italic';
        anim.style.padding = '10px 16px';
        anim.style.borderRadius = '16px 16px 16px 4px';
        anim.style.maxWidth = '100%';
        anim.style.marginTop = '2px';
        anim.style.letterSpacing = '0.5px';
        anim.style.fontSize = '15px';
        anim.innerHTML = '<span class="dot dot1">.</span><span class="dot dot2">.</span><span class="dot dot3">.</span>';
        container.appendChild(anim);
        // Добавим стили для анимации точек
        if (!document.getElementById('ai-dots-animation-style')) {
            const style = document.createElement('style');
            style.id = 'ai-dots-animation-style';
            style.innerHTML = `
                .ai-thinking-animation .dot {
                    opacity: 0.3;
                    font-size: 22px;
                    font-weight: bold;
                    display: inline-block;
                    transform: translateY(0);
                    will-change: transform, opacity;
                    animation: ai-dot-bounce 1.2s cubic-bezier(0.4,0,0.2,1) infinite both;
                    animation-fill-mode: both;
                }
                .ai-thinking-animation .dot1 { animation-delay: 0s; }
                .ai-thinking-animation .dot2 { animation-delay: 0.2s; }
                .ai-thinking-animation .dot3 { animation-delay: 0.4s; }
                @keyframes ai-dot-bounce {
                    0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
                    40% { opacity: 1; transform: translateY(-13px); }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

/* Добавить CSS-анимацию для курсора */
if (!document.getElementById('chat-typing-cursor-style')) {
    const style = document.createElement('style');
    style.id = 'chat-typing-cursor-style';
    style.innerHTML = `
    @keyframes blink-cursor {
        0% { opacity: 1; }
        50% { opacity: 0; }
        100% { opacity: 1; }
    }
    .chat-typing-cursor {
        font-weight: bold;
        font-size: 1.1em;
        margin-left: 2px;
        color: #aaa;
        animation: blink-cursor 1s steps(1) infinite;
    }
    `;
    document.head.appendChild(style);
} 