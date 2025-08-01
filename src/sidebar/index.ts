import { TranslateService } from '../services/translate';
import { VoiceService } from '../services/voice';
import { ToolsComponent } from './components/tools';
import { NavigationComponent } from './components/navigation';
import { AuthComponent } from './components/auth';
import { AccountComponent } from './components/account';
import { ChatComponent } from './components/chat';
import { NotesComponent } from './components/notes';
import { PageTranslateService } from '../services/pageTranslate';
import { languages } from '../services/translate';
import { AuthService } from '../services/auth';
import { TranslationService, Language } from '../services/translations';

export class Sidebar {
    private sidebar: HTMLElement | null = null;
    private sidebarContainer: HTMLElement | null = null;
    private floatingContainer: HTMLElement | null = null;
    private floatingButton: HTMLElement | null = null;
    private actionButtons: { [key: string]: { button: HTMLElement, icon: HTMLImageElement } } = {};
    private originalStyles: Map<Element, string> = new Map();
    private sidebarOpen = false;
    private sidebarWidth = '480px';
    private sidebarPosition: 'left' | 'right' = 'right';
    private floatingButtonPosition: 'Bottom' | 'Top' = 'Bottom';
    private hideIconOn: string[] = [];
    private theme: 'system' | 'light' | 'dark' = 'system';
    private floatingButtonVisible: boolean = true;
    private currentScreen: string = 'screen-home'; // <--- добавлено
    private language: 'en' | 'ru' | 'es' = 'en'; // <--- добавлено

    private onboardingSteps = [
        {
            screenId: null,
            title: 'Welcome to Megan!',
            desc: 'Your AI assistant is ready to help you work smarter and faster. Let\'s take a quick tour!',
            isWelcome: true
        },
        {
            screenId: 'screen-notes',
            title: 'Notes',
            desc: 'Here you can save and organize your notes. Quickly jot down ideas or important information.'
        },
        {
            screenId: 'screen-chat',
            title: 'Chat',
            desc: 'Chat with Megan — your AI assistant. Ask questions, brainstorm, or get help with tasks.'
        },
        {
            screenId: 'screen-voice',
            title: 'Voice',
            desc: 'Use voice commands to interact with Megan. Just speak and get instant responses.'
        },
        {
            screenId: 'screen-translate',
            title: 'Translate',
            desc: 'Translate text between languages quickly and easily.'
        },
        {
            screenId: 'screen-tools',
            title: 'Tools',
            desc: 'Access extra tools like summarizer and more. Expand Megan\'s capabilities.',
            isTools: true
        },
        {
            screenId: 'screen-settings',
            title: 'Settings',
            desc: 'Customize appearance, language, and other preferences.'
        }
    ];

    constructor() {
        chrome.storage.local.get(['sidebarPosition', 'floatingButtonPosition', 'hideIconOn', 'sidebarTheme', 'floatingButtonEnabled', 'sidebarLanguage'], (result) => {
            if (result.sidebarPosition === 'left') {
                this.sidebarPosition = 'left';
            }
            if (result.floatingButtonPosition === 'Top') {
                this.floatingButtonPosition = 'Top';
            }
            if (Array.isArray(result.hideIconOn)) {
                this.hideIconOn = result.hideIconOn;
            }
            // Добавляем example.com по умолчанию, если его нет
            if (result.sidebarTheme === 'light' || result.sidebarTheme === 'dark') {
                this.theme = result.sidebarTheme;
            } else {
                this.theme = 'system';
            }
            if (typeof result.floatingButtonEnabled === 'boolean') {
                this.floatingButtonVisible = result.floatingButtonEnabled;
            }
            if (result.sidebarLanguage === 'ru' || result.sidebarLanguage === 'es') {
                this.language = result.sidebarLanguage;
            } else {
                this.language = 'en';
            }

            // Initialize TranslationService with current language
            TranslationService.setLanguage(this.language);

            this.initializeFloatingButton();
        });

        // --- Hide floating button on fullscreen ---
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                // Any element is in fullscreen, hide floating button
                if (this.floatingContainer) {
                    this.floatingContainer.style.display = 'none';
                }
            } else {
                // No fullscreen, show floating button if it should be visible
                if (this.floatingContainer && this.floatingButtonVisible) {
                    this.floatingContainer.style.display = '';
                }
            }
        });
    }

    public initializeFloatingButton(): void {
        // Check if floating button should be hidden on this site
        const currentHost = window.location.hostname.replace(/^www\./, '');
        // Проверяем точное совпадение домена или поддомена
        if (this.hideIconOn.some(domain => {
            const d = domain.replace(/^www\./, '');
            return currentHost === d || currentHost.endsWith('.' + d);
        })) {
            if (this.floatingContainer) this.floatingContainer.remove();
            this.floatingContainer = null;
            this.floatingButton = null;
            return;
        }
        // Remove existing button if it exists
        if (this.floatingContainer) {
            this.floatingContainer.remove();
        }

        // Если кнопка должна быть скрыта, не создаём её
        if (!this.floatingButtonVisible) {
            this.floatingContainer = null;
            this.floatingButton = null;
            return;
        }

        // Create the floating container
        this.floatingContainer = document.createElement('div');
        this.floatingContainer.id = 'chrome-extension-floating-container';

        // Create the floating button
        this.floatingButton = document.createElement('div');
        this.floatingButton.id = 'chrome-extension-floating-button';
        const iconUrl = chrome.runtime.getURL('public/icon.png');
        // Крестик всегда ближе к сайдбару
        const closeBtnStyle = this.sidebarPosition === 'left'
            ? 'display:flex;position:absolute;top:-10px;right:-10px;width:22px;height:22px;border:none;border-radius:50%;color:#888;cursor:pointer;z-index:2;font-size:16px;align-items:center;justify-content:center;line-height:1;padding:0;transition:background 0.15s;'
            : 'display:flex;position:absolute;top:-10px;left:-10px;width:22px;height:22px;border:none;border-radius:50%;color:#888;cursor:pointer;z-index:2;font-size:16px;align-items:center;justify-content:center;line-height:1;padding:0;transition:background 0.15s;';
        this.floatingButton.innerHTML = `
            <img id="floating-btn-avatar-img" src="${iconUrl}" alt="icon" style="width:28px;height:28px;object-fit:cover;display:block;border-radius:50%;margin:auto;" />
            <button id="floating-btn-close" class="floating-btn-close" style="${closeBtnStyle}">×</button>
        `;

        // Create action buttons
        const actionButtonsContainer = document.createElement('div');
        actionButtonsContainer.id = 'chrome-extension-action-buttons';

        const createActionButton = (id: string, iconName: string, screen: string): HTMLElement => {
            const button = document.createElement('button');
            button.id = `action-btn-${id}`;
            button.className = 'chrome-extension-action-btn';
            const icon = document.createElement('img');
            icon.src = chrome.runtime.getURL(`public/${iconName}.png`);
            button.appendChild(icon);
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.navigateTo(screen);
            });
            this.actionButtons[id] = { button, icon };
            return button;
        };

        // Voice button
        const voiceButton = document.createElement('button');
        voiceButton.id = 'action-btn-voice';
        voiceButton.className = 'chrome-extension-action-btn';
        const voiceIcon = document.createElement('img');
        voiceButton.appendChild(voiceIcon);
        voiceButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!this.sidebar) {
                await this.createSidebar();
            }
            if (VoiceService.isListening()) {
                VoiceService.stopListening();
            } else {
                await VoiceService.startListening();
            }
            this.updateVoiceActionButtonState();
        });
        this.actionButtons['voice'] = { button: voiceButton, icon: voiceIcon };

        const chatButton = createActionButton('chat', 'chat', 'screen-chat');
        const translateButton = createActionButton('translate', 'translate', 'screen-translate');

        actionButtonsContainer.appendChild(voiceButton);
        actionButtonsContainer.appendChild(chatButton);
        actionButtonsContainer.appendChild(translateButton);

        this.floatingContainer.appendChild(actionButtonsContainer);
        this.floatingContainer.appendChild(this.floatingButton);

        // --- Крестик (close button) ---
        const closeBtn = this.floatingButton.querySelector('#floating-btn-close') as HTMLButtonElement | null;
        if (closeBtn) {
            // Показывать крестик при наведении на floating button
            this.floatingButton.addEventListener('mouseenter', () => {
                closeBtn.style.display = 'flex';
            });
            this.floatingButton.addEventListener('mouseleave', () => {
                closeBtn.style.display = 'none';
            });
            // Клик по крестику — показываем popup с вариантами
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Если уже открыт popup — не дублируем
                if (document.getElementById('floating-btn-close-popup')) return;
                // Создаём popup
                const popup = document.createElement('div');
                popup.id = 'floating-btn-close-popup';
                // Default dark theme
                popup.style.cssText = `
                    position: absolute;
                    top: 34px;
                    right: 0;
                    z-index: 99999;
                    background: #232323;
                    color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px #0004;
                    padding: 4px 0 2px 0;
                    min-width: 148px;
                    font-size: 13px;
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    border: 1px solid #444;
                    animation: fadeIn .18s;
                `;
                // Light theme support
                if (document.body.classList.contains('theme-light')) {
                    popup.style.background = '#fff';
                    popup.style.color = '#232323';
                    popup.style.border = '1px solid #E9E9E9';
                }
                // Dark theme support
                if (document.body.classList.contains('theme-dark')) {
                    popup.style.cssText += 'background: #232323; border: 1px solid #444; color: #fff !important;';
                }
                // Кнопки
                const btn1 = document.createElement('button');
                btn1.textContent = TranslationService.translate('close_floating_temp');
                btn1.style.cssText = 'background:none;border:none;padding:7px 12px;text-align:left;cursor:pointer;width:100%;font-size:13px;border-radius:6px 6px 0 0;transition:background .15s;line-height:1.2;';
                const btn2 = document.createElement('button');
                btn2.textContent = TranslationService.translate('close_floating_site');
                btn2.style.cssText = 'background:none;border:none;padding:7px 12px;text-align:left;cursor:pointer;width:100%;font-size:13px;transition:background .15s;line-height:1.2;';
                const btn3 = document.createElement('button');
                btn3.textContent = TranslationService.translate('close_floating_all');
                btn3.style.cssText = 'background:none;border:none;padding:7px 12px;text-align:left;cursor:pointer;width:100%;font-size:13px;border-radius:0 0 6px 6px;transition:background .15s;line-height:1.2;';
                // Dark theme support for popup и кнопок (после объявления кнопок, до append)
                if (document.body.classList.contains('theme-dark')) {
                    popup.style.cssText += 'background: #232323; border: 1px solid #444; color: #fff !important;';
                    btn1.style.setProperty('color', '#fff', 'important');
                    btn2.style.setProperty('color', '#fff', 'important');
                    btn3.style.setProperty('color', '#fff', 'important');
                }
                // Hover effect
                [btn1, btn2, btn3].forEach(btn => {
                    btn.addEventListener('mouseenter', () => btn.style.background = document.body.classList.contains('theme-light') ? '#F5F5F5' : '#333');
                    btn.addEventListener('mouseleave', () => btn.style.background = 'none');
                });
                // 1. До перезагрузки
                btn1.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Удаляем popup и floating button сразу
                    if (this.floatingContainer) {
                        this.floatingContainer.remove();
                        this.floatingContainer = null;
                        this.floatingButton = null;
                    }
                    popup.remove();
                });
                // 2. На этом сайте
                btn2.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Удаляем popup и floating button сразу
                    if (this.floatingContainer) {
                        this.floatingContainer.remove();
                        this.floatingContainer = null;
                        this.floatingButton = null;
                    }
                    popup.remove();
                    let domain = window.location.hostname.replace(/^www\./, '');
                    chrome.storage.local.get(['hideIconOn'], (result) => {
                        let arr = Array.isArray(result.hideIconOn) ? result.hideIconOn : [];
                        if (!arr.includes(domain)) {
                            arr.push(domain);
                            chrome.storage.local.set({ hideIconOn: arr });
                        }
                    });
                });
                // 3. Вообще
                btn3.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Удаляем popup и floating button сразу
                    if (this.floatingContainer) {
                        this.floatingContainer.remove();
                        this.floatingContainer = null;
                        this.floatingButton = null;
                    }
                    popup.remove();
                    chrome.storage.local.set({ floatingButtonEnabled: false });
                });
                // Добавить кнопки
                popup.appendChild(btn1);
                popup.appendChild(btn2);
                popup.appendChild(btn3);
                // Клик вне popup — закрыть
                setTimeout(() => {
                    const closePopup = (ev: MouseEvent) => {
                        if (!popup.contains(ev.target as Node)) {
                            popup.remove();
                            document.removeEventListener('mousedown', closePopup);
                        }
                    };
                    document.addEventListener('mousedown', closePopup);
                }, 10);
                // Вставить popup в floatingButton
                if (this.floatingButton) {
                    this.floatingButton.appendChild(popup);
                }
            });
        }

        this.floatingContainer.addEventListener('mouseenter', () => {
            this.updateVoiceActionButtonState();
        });

        const topValue = this.floatingButtonPosition === 'Top' ? '25%' : '75%';
        const commonStyles = `
            position: fixed;
            top: ${topValue};
            transform: translateY(-50%);
            z-index: 2147483648;
            user-select: none;
            pointer-events: auto; /* Changed */
        `;

        const buttonStyles = `
            width: 44px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: none;
            transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            padding: 0;
            gap: 0;
            pointer-events: auto; /* Button is clickable */
            background: transparent;
            border: none;
        `;

        if (this.sidebarPosition === 'left') {
            this.floatingContainer.style.cssText = commonStyles + `left: 0;`;
            this.floatingButton.style.cssText = buttonStyles + `
                border-radius: 0 22px 22px 0;
                border-left: none;
                position: relative;
                overflow: visible !important;
            `;
        } else {
            this.floatingContainer.style.cssText = commonStyles + `right: 0;`;
            this.floatingButton.style.cssText = buttonStyles + `
                border-radius: 22px 0 0 22px;
                border-right: none;
                position: relative;
                overflow: visible !important;
            `;
        }

        // Create a style element for hover effects
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-floating-button-hover', 'true');
        styleElement.textContent = `
            #chrome-extension-floating-container::before {
                content: '';
                position: absolute;
                top: -80px;
                left: -80px;
                right: -80px;
                bottom: -80px;
                z-index: 0;
            }
            #chrome-extension-sidebar-container.open ~ #chrome-extension-floating-container::before {
                display: none;
            }
            #chrome-extension-floating-button {
                position: relative;
                z-index: 1;
                transition: width 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            #chrome-extension-floating-button img {
                transition: margin 0.25s;
                margin-left: auto;
                margin-right: auto;
            }
             #chrome-extension-floating-container:hover #chrome-extension-floating-button {
                width: 80px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
            }
             #chrome-extension-floating-container:hover #chrome-extension-floating-button img {
                margin-left: ${this.sidebarPosition === 'left' ? 'auto' : '8px'} !important;
                margin-right: ${this.sidebarPosition === 'left' ? '8px' : 'auto'} !important;
            }
            /* When sidebar is open, adjust hover width only */
            #chrome-extension-sidebar-container.open ~ #chrome-extension-floating-container:hover #chrome-extension-floating-button {
                width: 80px !important;
            }
            #chrome-extension-action-buttons {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 1px;
                height: 1px;
                pointer-events: none;
            }
            #chrome-extension-floating-container:hover #chrome-extension-action-buttons {
                pointer-events: auto;
            }
            .chrome-extension-action-btn {
                position: absolute;
                z-index: 1;
                top: 0;
                left: 0;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.3);
            }
            #chrome-extension-floating-container:hover .chrome-extension-action-btn {
                opacity: 1;
            }
            #chrome-extension-floating-container:hover #action-btn-voice {
                transform: translate(-50%, -50%) ${this.sidebarPosition === 'right' ? 'translate(-60px, -45px)' : 'translate(60px, -45px)'} scale(1);
                transition-delay: 0.1s;
            }
            #chrome-extension-floating-container:hover #action-btn-chat {
                transform: translate(-50%, -50%) ${this.sidebarPosition === 'right' ? 'translate(-75px, 0px)' : 'translate(75px, 0px)'} scale(1);
                transition-delay: 0.05s;
            }
            #chrome-extension-floating-container:hover #action-btn-translate {
                transform: translate(-50%, -50%) ${this.sidebarPosition === 'right' ? 'translate(-60px, 45px)' : 'translate(60px, 45px)'} scale(1);
                transition-delay: 0s;
            }
            .chrome-extension-action-btn:hover {
                box-shadow: 0 6px 16px rgba(0,0,0,0.15);
            }
            #chrome-extension-floating-container:hover #action-btn-voice:hover {
                 transform: translate(-50%, -50%) ${this.sidebarPosition === 'right' ? 'translate(-60px, -45px)' : 'translate(60px, -45px)'} scale(1.1);
            }
            #chrome-extension-floating-container:hover #action-btn-chat:hover {
                transform: translate(-50%, -50%) ${this.sidebarPosition === 'right' ? 'translate(-75px, 0px)' : 'translate(75px, 0px)'} scale(1.1);
            }
            #chrome-extension-floating-container:hover #action-btn-translate:hover {
                transform: translate(-50%, -50%) ${this.sidebarPosition === 'right' ? 'translate(-60px, 45px)' : 'translate(60px, 45px)'} scale(1.1);
            }
            .chrome-extension-action-btn img {
                width: 24px;
                height: 24px;
            }
            /* Floating button close (theme support) */
            body.theme-light .floating-btn-close {
                background: #FAFAFA;
                transition: background 0.15s;
            }
            body.theme-light .floating-btn-close:hover {
                background: #e0e0e0;
            }
            body.theme-dark .floating-btn-close {
                background: #151515;
                transition: background 0.15s;
            }
            body.theme-dark .floating-btn-close:hover {
                background: #232323;
            }
        `;
        document.head.appendChild(styleElement);

        // Устанавливаем цвет по теме
        this.updateFloatingButtonTheme();

        // Add click handler
        this.floatingButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebar();
        });

        // Add the button to the page
        document.body.appendChild(this.floatingContainer);

        // Если сайдбар открыт — сразу позиционируем кнопку у края сайдбара
        if (this.sidebarOpen) {
            if (this.sidebarPosition === 'left') {
                this.floatingContainer.style.left = this.sidebarWidth;
                this.floatingContainer.style.right = '';
            } else {
                this.floatingContainer.style.right = this.sidebarWidth;
                this.floatingContainer.style.left = '';
            }
        }
    }

    public cleanup(): void {
        if (this.floatingContainer) {
            this.floatingContainer.remove();
            this.floatingContainer = null;
            this.floatingButton = null;
        }
        if (this.sidebarContainer) {
            this.sidebarContainer.remove();
            this.sidebarContainer = null;
            this.sidebar = null;
        }
    }

    private updateFloatingButtonState(): void {
        // Кнопка всегда выглядит одинаково
    }

    private createSidebar(): Promise<void> {
        return new Promise(resolve => {
            // Создаем основной контейнер
            this.sidebarContainer = document.createElement('div');
            this.sidebarContainer.id = 'chrome-extension-sidebar-container';

            // Создаем iframe для изоляции стилей
            const iframe = document.createElement('iframe');
            iframe.id = 'chrome-extension-sidebar-iframe';

            const iframeBaseStyles = `
                position: fixed;
                top: 0;
                width: ${this.sidebarWidth};
                height: 100vh;
                border: none;
                z-index: 2147483647;
                box-shadow: -2px 0 10px rgba(0,0,0,0.1);
                background: white;
            `;

            if (this.sidebarPosition === 'left') {
                iframe.style.cssText = iframeBaseStyles + `
                    left: -${this.sidebarWidth};
                    transition: left 0.3s ease;
                 `;
            } else {
                iframe.style.cssText = iframeBaseStyles + `
                    right: -${this.sidebarWidth};
                    transition: right 0.3s ease;
                 `;
            }

            this.sidebarContainer.appendChild(iframe);
            document.body.appendChild(this.sidebarContainer);

            // Создаем контент внутри iframe
            iframe.onload = () => {
                const iframeDoc = iframe.contentDocument;
                if (!iframeDoc) return;

                // Добавляем HTML и CSS
                iframeDoc.head.innerHTML = `
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Extension Sidebar</title>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
                            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap');
                            :root {
                                --color-bg: #000;
                                --color-container: #232323;
                                --color-active: #715CFF;
                                --color-border: #1F1D1D;
                                --color-text: #fff;
                            }
                            body.theme-light {
                                --color-bg: #FAFAFA;
                                --color-container: #F5F5F5;
                                --color-active: #AA97FF;
                                --color-border: #E9E9E9;
                                --color-text: #232323;
                            }
                            body.theme-dark {
                                --color-bg: #000;
                                --color-container: #232323;
                                --color-active: #715CFF;
                                --color-border: #1F1D1D;
                                --color-text: #fff;
                            }

                            * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                            }
                            
                            body {
                                font-family: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif;
                                background: var(--color-bg);
                                color: var(--color-text);
                                height: 100vh;
                                overflow: hidden;
                                transition: background 0.2s, color 0.2s;
                            }
                            
                            .sidebar {
                                position: relative;
                                width: 100%;
                                height: 100%;
                                padding: 32px 24px 24px;
                                background: var(--color-bg);
                            }
                            
                            .title {
                                font-size: 22px;
                                font-weight: 600;
                                margin-bottom: 16px;
                                text-align: center;
                                color: var(--color-text);
                            }

                            label {
                                font-size: 14px;
                                margin-top: 16px;
                                display: block;
                            }

                            textarea {
                                width: 390px;
                                min-width: 390px;
                                height: 100px;
                                padding: 10px;
                                font-size: 14px;
                                margin-top: 4px;
                                border-radius: 8px;
                                border: 1px solid var(--color-border);
                                resize: none;
                                box-sizing: border-box;
                                background-color: var(--color-container);
                                color: var(--color-text);
                            }
                            
                            textarea:focus {
                                border:1px solid var(--color-active);
                                outline: none;
                                width: 100%;
                                height: 100px;
                            }

                            textarea[readonly] {
                                background-color: var(--color-container);
                                color: var(--color-text);
                            }

                            select option {
                                background-color: var(--color-container);
                                color: var(--color-text);
                                border: 1px solid var(--color-border);
                            }

                            select {
                                background-color: var(--color-container);
                                color: var(--color-text);
                                border: 1px solid var(--color-border);
                            }


                                .language-select {
                                flex: 1;
                                padding: 6px 8px;
                                border-radius: 8px;
                                border: 1px solid var(--color-border);
                                font-size: 14px;
                                background-color: var(--color-container);
                                color: var(--color-text);
                            }

                                #swapLangs {
                                cursor: pointer;
                                font-size: 18px;
                                user-select: none;
                                padding: 0 6px;
                                color: #666;
                            }

                                .translate-btn {
                                padding: 8px 12px;
                                font-size: 14px;
                                font-weight: 600;
                                background-color: var(--color-active);
                                color: #fff;
                                border: none;
                                border-radius: 8px;
                                cursor: pointer;
                                white-space: nowrap;
                            }

                            .translate-btn:hover {
                                background-color: #8B78E0;
                            }



                            .page-translate-btn:hover {
                                background-color: #d5d5d5;
                                border: 1px solid #1F1D1D;
                                color: #A48FFF;
                            }

                            .avatar {
                                width: 36px;
                                height: 36px;
                                border-radius: 50%;
                                background: #fff;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                margin-bottom: 32px;
                            }

                            .intro {
                                line-height: 1.4;
                                font-size: 15px;
                                max-width: 260px;
                            }
                            
                            .close-btn {
                                position: absolute;
                                background: none;
                                top: 16px;
                                right: ${this.sidebarPosition === 'left' ? '435px' : '16px'};
                                border: none;
                                display: flex;
                                font-size: 20px;
                                cursor: pointer;
                                color: #6c757d;
                                padding: 4px;
                                border-radius: 4px;
                                transition: all 0.2s ease;
                            }
                            
                            .close-btn:hover {
                                background: #e9ecef;
                                color: #495057;
                            }

                            .settings_dock {
                                position: fixed;
                                top: 300px;
                                left: 0px;
                                width: 56px;
                                padding: 32px 0;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: 24px;
                                background: #151515;
                                border-radius: 0 48px 48px  0;
                                z-index: 9999;
                                transform: translateY(-50%);
                            }

                            .settings__dock__btn {
                                width: 44px;
                                height: 44px;
                                border: none;
                                border-radius: 50%;
                                background: rgba(255,255,255,.04);
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                cursor: pointer;
                                transition: background .2s, box-shadow .2s;
                            }

                            .settings__dock__btn:hover {
                                background: rgba(255,255,255,.10);
                            }

                            .settings__dock__btn svg {
                                width: 20px;
                                height: 20px;
                                stroke: #cfcfcf;
                                fill: none;
                            }

                            .settings__dock__btn.active {
                                background: var(--color-active);
                                box-shadow: 0 0 8px var(--color-active);
                            }

                            .settings__dock__btn.active svg {
                                stroke: #fff;
                            }

                            .dock{
                                position:fixed;                /* остаётся на экране при скролле */
                                top:435px;                       /* вертикальный центр */
                                right:0px;                    /* отступ от края страницы */
                                transform:translateY(-50%);
                                width:56px;
                                padding:32px 0;                /* внутренние отступы сверху‑снизу */
                                display:flex;
                                flex-direction:column;
                                align-items:center;
                                gap:24px;                      /* расстояние между иконками */
                                background:#151515;
                                border-radius: 56px 0 0 56px;
                                z-index:9999;                  /* поверх контента */
                            }

                            .dock__btn{
                                width:44px;
                                height:44px;
                                border:none;
                                border-radius:50%;
                                background:rgba(255,255,255,.04);
                                display:flex;
                                justify-content:center;
                                align-items:center;
                                cursor:pointer;
                                transition:background .2s, box-shadow .2s;
                            }
                            .dock__btn:hover{
                                background:rgba(255,255,255,.10);
                            }
                            .dock__btn svg{
                                width:20px;
                                height:20px;
                                stroke:#cfcfcf;                /* приятный серый контур иконки */
                                fill:none;
                            }

                            /* активный инструмент — фиолетовый круг + лёгкое свечение */
                            .dock__btn.active{
                                background: var(--color-active);
                                box-shadow: 0 0 8px var(--color-active);
                            }
                            .dock__btn.active svg{stroke:#fff;}

                            /* Tools button styling */
                            .tools_button {
                                width: 44px;
                                height: 44px;
                                border: none;
                                border-radius: 50%;
                                background: rgba(255,255,255,.04);
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                cursor: pointer;
                                transition: background .2s, box-shadow .2s;
                            }
                            .tools_button:hover {
                                background: rgba(255,255,255,.10);
                            }
                            .tools_button svg {
                                width: 20px;
                                height: 20px;
                                stroke: #cfcfcf;
                                fill: none;
                            }
                            .tools_button.active {
                                background: var(--color-active);
                                box-shadow: none;
                            }
                            .tools_button.active svg {
                                stroke: #fff;
                            }

                            .screen {
                                display: none;
                                height: 100%;
                                min-height: 0;
                            }
                                .screen.active {
                                display: block;
                            }
                            .screen.active#screen-chat {
                                display: flex;
                                flex-direction: column;
                                height: 100%;
                                min-height: 0;
                            }

                            /* Стили для модального окна */
                            /* overlay — не перекрывает док, плавный fade/slide */
                            .tools-modal-overlay{
                                position:fixed;
                                top:0;
                                left:0;                /* Changed from 72px to 0 to cover full width */
                                right:0;
                                bottom:0;
                                background:rgba(0,0,0,.7);
                                display:flex;             
                                justify-content:flex-start; /* Changed from center to flex-start */
                                align-items:center;
                                z-index:2147483647;
                                backdrop-filter:blur(5px);

                                opacity:0;
                                visibility:hidden;
                                transform:translateY(-8px);
                                transition:opacity .25s ease, transform .25s ease;
                            }
                            .tools-modal-overlay.active{
                                opacity:1;
                                visibility:visible;
                                transform:translateY(0);
                            }

                            /* плавный «поп‑ап» самого окна */
                            .tools-modal-overlay .modal-content{
                                transform:scale(.96);
                                transition:transform .25s ease;
                            }
                            .tools-modal-overlay.active .modal-content{
                                transform:scale(1);
                            }

                            .account-modal-overlay {
                                position: fixed;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                background: rgba(0, 0, 0, 0.7);
                                display: none;
                                justify-content: center;
                                align-items: center;
                                z-index: 1000;
                                backdrop-filter: blur(5px);
                            }

                            .account-modal-overlay.active {
                                display: flex;
                            }

                            .account-grid {
                                display: grid;
                                grid-template-columns: repeat(2, 1fr);
                                gap: 16px;
                            }

                            .modal-content {
                                font-size: 12px;
                                background: var(--color-container);
                                border-radius: 12px;
                                padding: 24px;
                                width: 70%;
                                max-width: 350px;
                                left: 35px;
                                position: absolute;
                                border: 1px solid var(--color-border);
                                box-shadow: 0 8px 32px rgba(0,0,0,0.10);
                                color: var(--color-text);
                            }

                            .modal-header {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-bottom: 10px;
                            }

                            .modal-title {
                                font-size: 22px;
                                font-weight: 600;
                                margin-bottom: 8px;
                                color: var(--color-text);
                            }

                            .tools-grid {
                                display: grid;
                                grid-template-columns: repeat(2, 1fr);
                                gap: 16px;
                            }

                            .tool-item {
                                font-size: 14px;
                                background: #151515;
                                border-radius: 8px;
                                padding: 16px;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                border: 1px solid #1F1D1D;
                            }

                            .modal-close {
                                background: none;
                                border: none;
                                color: #6c757d;
                                font-size: 24px;
                                cursor: pointer;
                                padding: 4px;
                                border-radius: 4px;
                                transition: all 0.2s ease;
                            }

                            .modal-close:hover {
                                background: rgba(255, 255, 255, 0.1);
                                color: #fff;
                            }

                            .auth-modal-overlay {
                                position: fixed;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                background: rgba(0, 0, 0, 0.9);
                                display: none;
                                justify-content: center;
                                align-items: center;
                                z-index: 2147483647;
                                backdrop-filter: blur(8px);
                            }

                            .auth-modal-overlay.active {
                                display: flex;
                            }

                            .auth-form {
                                display: flex;
                                flex-direction: column;
                                gap: 16px;
                                width: 100%;
                            }

                            .form-group {
                                display: flex;
                                flex-direction: column;
                                gap: 8px;
                            }

                            .form-group label {
                                font-size: 14px;
                                color: #fff;
                            }

                            .form-group input {
                                padding: 12px;
                                border-radius: 8px;
                                border: 1px solid rgba(255, 255, 255, 0.1);
                                background: rgba(255, 255, 255, 0.05);
                                color: #fff;
                                font-size: 16px;
                            }

                            .form-group input:focus {
                                outline: none;
                                border-color: #007bff;
                            }

                            .error-message {
                                color: #ff4444;
                                font-size: 14px;
                                text-align: center;
                            }

                            .login-button {
                                padding: 12px;
                                border-radius: 8px;
                                border: none;
                                background: #007bff;
                                color: white;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s ease;
                            }

                            .login-button:hover {
                                background: #0056b3;
                            }

                            .page-translate-btn{
                                position:absolute; top:40px;
                                background:#262626; color:#ccc; padding:6px 6px;
                                border-radius:8px; font-size:14px; border:none; cursor:pointer;
                                color: #A48FFF;
                            }
                            .page-translate-btn:hover{background:#333;color:#fff;}

                            /* свёрнутое/развёрнутое поле перевода */
                            #translatedText {
                                height: 0;
                                opacity: 0;
                                padding: 0 10px;
                                overflow: hidden;
                                transition: height .25s ease, opacity .25s ease, padding .25s ease;
                                border: 1px solid var(--color-border);
                            }
                            #translatedText.expanded {
                                height: 100px;          /* конечная высота */
                                opacity: 1;
                                padding: 10px;
                                border: 1px solid var(--color-border);
                            }

                            /* контейнер исходного текста для размещения кнопки */
                            .source-wrapper {
                                position: relative;
                            }
                            .translate-btn-inside {
                                position: absolute;
                                right: -32px;
                                bottom: 12px;
                                padding: 6px 12px;
                                font-size: 13px;
                            }

                            /* верхняя строка: "Translate" + Translate webpage */
                            .translate-top-row {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-top: 16px;
                                border-radius: 8px;
                                padding: 4px 0;
                            }
                            .page-translate-btn {
                                flex: 0 0 auto;
                                width: 160px;
                                height: 4%;
                                background: var(--color-container);
                                color: var(--color-active);
                                border: 1px solid var(--color-border);
                                border-radius: 8px;
                                font-weight: 300;
                                transition: background 0.2s, color 0.2s;
                            }
                            .page-translate-btn:hover {
                                background: var(--color-active);
                                color: #fff;
                            }

                            .screen.active#screen-notes {
                                display: flex;
                                flex-direction: column;
                                height: 100%;
                                min-height: 0;
                            }
                            .notes-screen-things {
                                display: flex;
                                flex-direction: column;
                                height: 100%;
                                min-height: 0;
                            }

                            .screen.active#screen-note-detail {
                                display: flex;
                                flex-direction: column;
                                height: 100%;
                                min-height: 0;
                            }
                            .notes-detail-container {
                                display: flex;
                                flex-direction: column;
                                flex: 1 1 0;
                                min-height: 0;
                            }
                            .notes-detail-body {
                                min-height: 120px;
                                overflow-y: auto !important;
                                resize: none;
                                scrollbar-width: thin;
                                scrollbar-color: var(--color-active) var(--color-container);
                            }
                            .notes-detail-body::-webkit-scrollbar {
                                width: 8px;
                                background: var(--color-container);
                            }
                            .notes-detail-body::-webkit-scrollbar-thumb {
                                background: var(--color-active);
                                border-radius: 6px;
                            }

                            #back-to-notes {
                                background: var(--color-container);
                                color: var(--color-text);
                                border: none;
                                cursor: pointer;
                            }

                            #note-body {
                                min-height: 120px;
                                overflow-y: auto !important;
                                resize: none;
                                scrollbar-width: thin;
                                scrollbar-color: #b0b0b0 #f5f5f5;
                            }
                            #note-body::-webkit-scrollbar {
                                width: 8px;
                                background: #f5f5f5;
                            }
                            #note-body::-webkit-scrollbar-thumb {
                                background: #b0b0b0;
                                border-radius: 6px;
                                transition: background 0.2s;
                            }
                            #note-body::-webkit-scrollbar-thumb:hover {
                                background: #888;
                            }
                            body.theme-dark #note-body {
                                scrollbar-color: #444 #232323;
                            }
                            body.theme-dark #note-body::-webkit-scrollbar {
                                background: #232323;
                            }
                            body.theme-dark #note-body::-webkit-scrollbar-thumb {
                                background: #444;
                            }
                            body.theme-dark #note-body::-webkit-scrollbar-thumb:hover {
                                background: #666;
                            }

                            #screen-note-detail {
                                overflow-y: auto;
                                resize: vertical;
                            }

                            .tools-modal-content {
                                background: var(--color-container) !important;
                                color: var(--color-text) !important;
                                border-radius: 18px !important;
                                box-shadow: 0 8px 32px rgba(0,0,0,0.10);
                                padding: 32px 32px 24px 32px !important;
                                max-width: 420px !important;
                                width: 90vw;
                                left: 0 !important;
                                right: 0 !important;
                                margin: auto;
                            }
                            .tools-section-title {
                                color: #b0b0b0;
                                font-size: 15px;
                                margin-bottom: 18px;
                                color: var(--color-text);
                                opacity: 0.7;
                            }
                            .tools-icons-row {
                                display: flex;
                                gap: 36px;
                                margin-bottom: 8px;
                            }
                            .tool-icon-block {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: 8px;
                                background: var(--color-container);
                                border-radius: 10px;
                                transition: background 0.2s, border 0.2s;
                            }
                            .tool-icon {
                                font-size: 32px;
                                margin-bottom: 2px;
                                color: var(--color-active);
                            }
                            .tool-label {
                                font-size: 12px;
                                color: var(--color-text);
                            }
                            .modal-title {
                                font-size: 22px;
                                font-weight: 600;
                                margin-bottom: 8px;
                                color: var(--color-text);
                            }

                            .tool-icon-block {
                                cursor: pointer;
                            }
                            .tool-icon-block:hover {
                                background: var(--color-border);
                                color: #fff;
                            }

                            .tool-icon-block.disabled-tool {
                                cursor: not-allowed;
                                opacity: 0.5;
                            }
                            .tool-icon-block.disabled-tool:hover {
                                background: var(--color-container) !important;
                                border: 1px solid var(--color-border) !important;
                            }
                            .tool-icon-block.disabled-tool .tool-label {
                                color: #bbb !important;
                            }

                            .screen.active#screen-voice {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                            }

                            #screen-voice {
                                text-align: center;
                                height: 100%;
                                padding: 24px;
                                box-sizing: border-box;
                                background: var(--color-bg);
                            }

                            #voice-status-bubble {
                                background: var(--color-container);
                                color: var(--color-active);
                                padding: 8px 16px;
                                border-radius: 20px;
                                margin-bottom: 40px;
                                font-size: 14px;
                                display: inline-block;
                                border: 1px solid var(--color-border);
                            }

                            #voice-waveform-container {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                height: 60px;
                                gap: 3px;
                                margin-bottom: 40px;
                                width: 100%;
                                background: var(--color-container);
                                border-radius: 12px;
                                border: 1px solid var(--color-border);
                            }

                            .waveform-bar {
                                width: 4px;
                                background-color: var(--color-active);
                                border-radius: 2px;
                                transition: height 0.1s ease;
                            }

                            #voice-result {
                                font-size: 16px;
                                color: var(--color-text);
                                min-height: 24px;
                                line-height: 1.5;
                            }

                            .icon-active { display: none; }
                            .dock__btn.active .icon-default { display: none; }
                            .dock__btn.active .icon-active { display: block; }
                            .tools_button.active .icon-default { display: none; }
                            .tools_button.active .icon-active { display: block; }

                            .modal-content.tools-modal-content .modal-title {
                                font-size: 15px !important;
                            }
                            .modal-content.tools-modal-content .tools-section-title {
                                font-size: 13px !important;
                            }

                            /* .settings_dock теперь управляется через JS */

                            /* Settings Page Styles */
                            .settings-section {
                                margin-bottom: 24px;
                                padding: 0 8px;
                            }
                            .section-title {
                                font-size: 14px;
                                font-weight: 500;
                                color: #a0a0a0;
                                margin-bottom: 12px;
                                text-transform: uppercase;
                            }
                            .settings-group {
                                background: var(--color-container);
                                border-radius: 12px;
                                overflow: hidden;
                                border: 1px solid var(--color-border);
                            }
                            .setting-item {
                                display: flex;
                                flex-direction: row;
                                align-items: center;
                                justify-content: flex-start;
                                gap: 18px;
                                padding: 10px 14px;
                                border-bottom: 1px solid var(--color-border);
                                font-size: 14px;
                            }
                            .setting-item span {
                                flex: 0 0 auto;
                                min-width: 80px;
                                max-width: 40%;
                                margin-bottom: 0;
                                margin-right: 12px;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            }
                            .setting-item .custom-dropdown {
                                flex: 1 1 0;
                                min-width: 120px;
                                max-width: 100%;
                                margin-left: 0;
                            }
                            .setting-item > *:last-child {
                                margin-left: auto;
                            }
                            @media (max-width: 600px) {
                                .setting-item {
                                    flex-direction: column;
                                    align-items: stretch;
                                    gap: 8px;
                                    padding: 8px 6px !important;
                                    font-size: 13px !important;
                                }
                                .setting-item span {
                                    margin-bottom: 2px;
                                    margin-right: 0;
                                    max-width: 100%;
                                }
                                .setting-item .custom-dropdown {
                                    min-width: 0;
                                }
                                .setting-item > *:last-child {
                                    margin-left: 0;
                                }
                            }
                            .setting-item:last-child {
                                border-bottom: none;
                            }
                            .setting-item select {
                                background: transparent;
                                border: none;
                                color: #a0a0a0;
                                -webkit-appearance: none;
                                -moz-appearance: none;
                                appearance: none;
                                background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="%23a0a0a0" viewBox="0 0 16 16"><path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/></svg>');
                                background-repeat: no-repeat;
                                background-position: right 4px top 50%;
                                background-size: .7em auto;
                                padding-right: 20px;
                                font-size: 14px;
                                text-align: right;
                            }
                            .setting-item select:focus {
                                outline: none;
                            }
                            .section-title-container {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                            }

                            .switch {
                              position: relative;
                              display: inline-block;
                              width: 40px;
                              height: 24px;
                              margin-bottom: 24px;
                            }

                            .switch input {
                              opacity: 0;
                              width: 0;
                              height: 0;
                            }

                            .slider {
                              position: absolute;
                              cursor: pointer;
                              top: 0;
                              left: 0;
                              right: 0;
                              bottom: 0;
                              background-color: #333;
                              -webkit-transition: .4s;
                              transition: .4s;
                            }

                            .slider:before {
                              position: absolute;
                              content: "";
                              height: 18px;
                              width: 18px;
                              left: 3px;
                              bottom: 3px;
                              background-color: white;
                              -webkit-transition: .4s;
                              transition: .4s;
                            }

                            input:checked + .slider {
                              background-color: #715CFF;
                            }

                            input:focus + .slider {
                              box-shadow: 0 0 1px #715CFF;
                            }

                            input:checked + .slider:before {
                              -webkit-transform: translateX(16px);
                              -ms-transform: translateX(16px);
                              transform: translateX(16px);
                            }

                            .slider.round {
                              border-radius: 24px;
                            }

                            .slider.round:before {
                              border-radius: 50%;
                            }

                            .chip {
                                display: inline-flex;
                                align-items: center;
                                background: var(--color-container);
                                border-radius: 16px;
                                padding: 6px 12px;
                                font-size: 14px;
                                border: 1px solid var(--color-border);
                            }
                            .chip img {
                                width: 16px;
                                height: 16px;
                                margin-right: 8px;
                                border-radius: 4px;
                            }
                            .chip .close-chip {
                                margin-left: 8px;
                                background: none;
                                border: none;
                                color: #a0a0a0;
                                cursor: pointer;
                                font-size: 16px;
                            }

                            .notes-input-row {
                                border-radius: 12px;
                            }
                            .notes-textarea {
                                flex: 1;
                                padding: 12px 60px 12px 14px;
                                border-radius: 8px;
                                border: 1px solid var(--color-border);
                                background: var(--color-bg);
                                color: var(--color-text);
                                font-size: 15px;
                                resize: none;
                                transition: border 0.2s;
                            }
                            .notes-textarea:focus {
                                outline: none;
                            }
                            .notes-save-btn {
                                position: absolute;
                                right: 12px;
                                bottom: 12px;
                                height: 32px;
                                padding: 0 16px;
                                border-radius: 8px;
                                background: var(--color-active);
                                color: #fff;
                                border: none;
                                cursor: pointer;
                                z-index: 2;
                                font-weight: 600;
                                font-size: 15px;
                            }
                            .notes-save-btn:hover {
                                background: #8B78E0;
                            }
                            .notes-search-input {
                                width: 100%;
                                margin-bottom: 12px;
                                padding: 10px 14px;
                                border-radius: 8px;
                                border: 1px solid var(--color-border);
                                background: var(--color-bg);
                                color: var(--color-text);
                                font-size: 15px;
                            }
                            .notes-search-input:focus {
                                border: 1.5px solid var(--color-active);
                                outline: none;
                            }
                            #notes-list {
                                border-radius: 12px;
                                color: var(--color-text);
                                flex: 1 1 0;
                                min-height: 0;
                                overflow-y: auto;
                                scrollbar-width: none; /* Firefox */
                            }
                            #notes-list::-webkit-scrollbar {
                                display: none; /* Chrome, Safari, Opera */
                            }
                            #calendar-date-events::-webkit-scrollbar {
                                display: none; /* Chrome, Safari, Opera */
                            }
                            #calendar-upcoming-events::-webkit-scrollbar {
                                width: 6px;
                                background: transparent;
                            }
                            #calendar-upcoming-events::-webkit-scrollbar-thumb {
                                background: #888;
                                border-radius: 6px;
                            }
                            #calendar-upcoming-events::-webkit-scrollbar-track {
                                background: transparent;
                            }
                            .notes-detail-header {
                                display: flex;
                                align-items: center;
                                margin-bottom: 18px;
                            }
                            .notes-detail-back {
                                background: none;
                                color: #aaa;
                                border: none;
                                font-size: 15px;
                                border-radius: 8px;
                                padding: 4px 10px;
                                cursor: pointer;
                            }
                            .notes-detail-btns {
                                margin-left: auto;
                                display: flex;
                                gap: 8px;
                            }
                            .notes-detail-btn {
                                background: var(--color-active);
                                color: #fff;
                                border: none;
                                border-radius: 8px;
                                padding: 0 18px;
                                height: 38px;
                                font-size: 15px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: background 0.2s;
                            }
                            .notes-detail-btn:hover {
                                background: #8B78E0;
                            }
                            .notes-detail-btn-delete {
                                background: var(--color-container);
                                color: #ff4444;
                                border: 1px solid var(--color-border);
                            }
                            .notes-detail-btn-delete:hover {
                                background: #ffeaea;
                            }
                            .notes-detail-container {
                                background: var(--color-container);
                                border-radius: 14px;
                                box-shadow: 0 2px 12px #0002;
                                margin-bottom: 18px;
                                margin-top: 18px;
                                padding: 0;
                                border: 1px solid var(--color-border);
                            }
                            body.theme-dark .notes-detail-container {
                                box-shadow: 0 1px 6px #0006;
                            }
                            .notes-detail-title {
                                width: 100%;
                                background: var(--color-bg);
                                color: var(--color-text);
                                border: 1px solid var(--color-border);
                                border-radius: 8px;
                                padding: 10px 12px;
                                font-size: 19px;
                                margin-bottom: 0;
                            }
                            .notes-detail-title:focus {
                                border: 1.5px solid var(--color-active);
                                outline: none;
                            }
                            .notes-detail-body {
                                width: 100%;
                                min-height: 120px;
                                background: var(--color-bg);
                                color: var(--color-text);
                                border: 1px solid var(--color-border);
                                border-radius: 8px;
                                padding: 12px;
                                font-size: 15px;
                                resize: vertical;
                                overflow-y: auto !important;
                                -ms-overflow-style: none !important; /* IE 10+ */
                            }
                            .notes-detail-body:focus {
                                border: 1px solid var(--color-border) !important;
                                outline: none;
                            }

                            .note-row {
                                margin-bottom: 12px;
                                padding: 14px 16px;
                                background: var(--color-bg);
                                border: 1px solid var(--color-border) !important;
                                border-radius: 12px;
                                cursor: pointer;
                                box-shadow: 0 2px 8px #0002;
                                display: flex;
                                flex-direction: column;
                                gap: 2px;
                                color: var(--color-text);
                                transition: background 0.2s;
                            }
                            .note-row:hover {
                                background: var(--color-active);
                                color: #fff;
                            }

                            .translate-lang-row {
                                display: flex;
                                gap: 8px;
                                width: 100%;
                                margin-top: 16px;
                                align-items: center;
                                /* Remove any max-width here */
                            }
                            .language-select {
                                flex: 1 1 0;
                                min-width: 0;
                            }
                            #swapLangs {
                                flex: 0 0 40px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 22px;
                                cursor: pointer;
                                user-select: none;
                            }

                            .account-section {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: 24px;
                                margin: 0 auto;
                                max-width: 340px;
                            }
                            .account-card {
                                background: var(--color-bg);
                                border-radius: 18px;
                                padding: 0 0 24px 0;
                                width: 100%;
                            }
                            .account-card-title {
                                font-size: 18px;
                                font-weight: 500;
                                padding: 20px 0 12px 32px;
                                text-align: left;
                                color: var(--color-text);
                            }
                            .account-card-content {
                                background: var(--color-container);
                                box-shadow: 0 2px 12px #0001;
                                border-radius: 18px;
                                border: 1px solid var(--color-border);
                                padding: 20px 24px;
                                display: flex;
                                align-items: center;
                                gap: 18px;
                                width: 100%;
                                justify-content: center;
                            }
                            .account-avatar {
                                width: 56px;
                                height: 56px;
                                border-radius: 50%;
                                object-fit: cover;
                                background: #fff;
                                border: 1px solid var(--color-border);
                            }
                            .account-info {
                                display: flex;
                                flex-direction: column;
                                width: 100%;
                            }
                            .account-name {
                                font-size: 15px;
                                font-weight: 600;
                                margin-bottom: 2px;
                                color: var(--color-text);
                            }
                            .account-email {
                                font-size: 12px;
                                color: #b0b0b0;
                            }
                            .account-pro {
                                flex-direction: column;
                                align-items: center;
                                gap: 10px;
                            }
                            .account-pro-text {
                                font-size: 15px;
                                color: #b0b0b0;
                                margin-bottom: 10px;
                            }
                            .account-btn {
                                display: inline-block;
                                background: var(--color-active);
                                color: #fff;
                                border: none;
                                border-radius: 8px;
                                padding: 12px 0;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                width: 100%;
                                max-width: 280px;
                                margin: 0 auto;
                                text-align: center;
                                text-decoration: none;
                                transition: background 0.2s;
                            }
                            .account-btn-pro {
                                background: var(--color-active);
                                color: #fff;
                                text-decoration: underline;
                                font-size: 15px;
                                padding: 8px 0;
                            }
                            .account-btn-logout {
                                background: #ff4444;
                                color: #fff;
                                margin: 24px auto 24px auto;
                            }
                            .account-btn-logout:hover {
                                background: #d32f2f;
                            }

                            .add-hide-icon-btn {
                                background: #232323;
                                color: #A48FFF;
                                border: none;
                                border-radius: 50%;
                                width: 28px;
                                height: 28px;
                                font-size: 22px;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                transition: background 0.2s, color 0.2s;
                            }
                            body.theme-light .add-hide-icon-btn {
                                background: #F5F5F5;
                                color: #715CFF;
                                border: 1px solid #E9E9E9;
                            }
                            body.theme-dark .add-hide-icon-btn {
                                background: #232323;
                                color: #A48FFF;
                                border: none;
                            }
                            .add-hide-icon-btn:hover {
                                background: #333;
                                color: #fff;
                            }
                            body.theme-light .add-hide-icon-btn:hover {
                                background: #E9E9E9;
                                color: #715CFF;
                            }

                            .hide-icon-input {
                                width: 180px;
                                padding: 6px 12px;
                                border-radius: 8px;
                                border: 1px solid var(--color-border);
                                background: var(--color-container);
                                color: var(--color-text);
                                font-size: 14px;
                                transition: border 0.2s, background 0.2s, color 0.2s;
                            }
                            body.theme-light .hide-icon-input {
                                background: #fff;
                                color: #232323;
                                border: 1px solid #E9E9E9;
                            }
                            body.theme-dark .hide-icon-input {
                                background: #151515;
                                color: #fff;
                                border: 1px solid #333;
                            }
                            .hide-icon-input:focus {
                                border: 1.5px solid var(--color-active);
                                outline: none;
                            }

                            .hide-icon-input-confirm {
                                margin-left: 8px;
                                background: var(--color-active);
                                color: #fff;
                                border: none;
                                border-radius: 8px;
                                padding: 6px 16px;
                                font-size: 14px;
                                cursor: pointer;
                                transition: background 0.2s, color 0.2s;
                            }
                            .hide-icon-input-confirm:hover {
                                background: #8B78E0;
                            }

                            /* --- Light theme dock/button overrides --- */
                            body.theme-light .dock {
                                background: #F5F5F5;
                                box-shadow: 0 4px 24px rgba(0,0,0,.15);
                            }
                            body.theme-light .dock__btn,
                            body.theme-light .tools_button {
                                background: #EDEDED;
                            }
                            body.theme-light .dock__btn.active,
                            body.theme-light .tools_button.active {
                                background: #AA97FF;
                                box-shadow: 0 0 8px #AA97FF;
                            }
                            body.theme-light .settings_dock {
                                background: #F5F5F5;
                                box-shadow: 0 4px 24px rgba(0,0,0,.15);
                            }
                            body.theme-light .settings__dock__btn {
                                background: #EDEDED;
                            }
                            body.theme-light .settings__dock__btn.active {
                                background: #AA97FF !important;
                                box-shadow: 0 0 8px #AA97FF !important;
                            }

                            /* --- Dark theme dock/button overrides --- */
                            body.theme-dark .dock {
                                background: #151515;
                                box-shadow: 0 4px 24px rgba(0,0,0,.45);
                            }
                            body.theme-dark .settings_dock {
                                background: #151515;
                                box-shadow: 0 4px 24px rgba(0,0,0,.45);
                            }
                            body.theme-dark .settings__dock__btn.active {
                                background: #6F58D5 !important;
                                box-shadow: 0 0 8px #6F58D5 !important;
                            }

                            /* ... existing styles ... */
                            #screen-home.screen.active {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                height: 100%;
                                background: none;
                            }
                            #screen-home .gradient-text {
                                background: linear-gradient(90deg, #715CFF 0%, #8B78E0 50%, #AA97FF 100%);
                                -webkit-background-clip: text;
                                -webkit-text-fill-color: transparent;
                                background-clip: text;
                                text-fill-color: transparent;
                                /* Чёткая тень без блюра, для читаемости */
                                text-shadow: 0 2px 0 #fff2, 0 1px 0 #715CFF44;
                            }
                            .custom-dropdown {
                                position: relative;
                                width: 166px;
                                user-select: none;
                                font-size: 15px;
                                font-weight: 500;
                                flex-shrink: 0;
                            }
                            .custom-dropdown-selected {
                                background: var(--color-container);
                                color: var(--color-text);
                                border: 1.5px solid var(--color-active);
                                border-radius: 10px;
                                padding: 10px 38px 10px 14px;
                                cursor: pointer;
                                transition: border 0.2s, box-shadow 0.2s;
                                box-shadow: 0 2px 8px #715cff11;
                                position: relative;
                            }
                            .custom-dropdown-selected:after {
                                content: '';
                                position: absolute;
                                right: 16px;
                                top: 50%;
                                width: 16px;
                                height: 16px;
                                background-image: url('data:image/svg+xml;utf8,<svg fill="none" stroke="%23715CFF" stroke-width="2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6"/></svg>');
                                background-size: 16px 16px;
                                background-repeat: no-repeat;
                                background-position: center;
                                transform: translateY(-50%);
                                pointer-events: none;
                            }
                            .custom-dropdown-list {
                                display: none;
                                position: absolute;
                                left: 0;
                                right: 0;
                                top: 110%;
                                background: var(--color-container);
                                border: 1.5px solid var(--color-active);
                                border-radius: 10px;
                                box-shadow: 0 8px 32px rgba(111,88,213,0.10);
                                z-index: 99999;
                                animation: fadeInDropdown 0.18s;
                                max-height: 260px;
                                overflow-y: auto;
                                scrollbar-width: thin;
                                scrollbar-color: var(--color-active) var(--color-container);
                            }
                            .custom-dropdown-list::-webkit-scrollbar {
                                width: 7px;
                                background: var(--color-container);
                            }
                            .custom-dropdown-list::-webkit-scrollbar-thumb {
                                background: var(--color-active);
                                border-radius: 6px;
                            }
                            .custom-dropdown.open .custom-dropdown-list {
                                display: block;
                            }
                            .custom-dropdown-option {
                                padding: 12px 18px;
                                cursor: pointer;
                                color: var(--color-text);
                                transition: background 0.15s, color 0.15s;
                            }
                            .custom-dropdown-option:hover {
                                background: var(--color-active);
                                color: #fff;
                            }
                            @keyframes fadeInDropdown {
                                from { opacity: 0; transform: translateY(-8px); }
                                to { opacity: 1; transform: translateY(0); }
                            }
                            .settings-section, .settings-group, .screen.active, .sidebar {
                                overflow: visible !important;
                            }
                            #chat-container {
                                scrollbar-width: none !important; /* Firefox */
                                -ms-overflow-style: none !important; /* IE 10+ */
                            }
                            #chat-container::-webkit-scrollbar {
                                width: 0 !important;
                                background: transparent !important;
                            }
                            #chat-container::-webkit-scrollbar-thumb {
                                background: transparent !important;
                                border-radius: 6px;
                            }
                            /* Стили для placeholder-ов */
                            input::placeholder,
                            textarea::placeholder {
                                font-family: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif;
                                color: #b0b0b0;
                                opacity: 1;
                            }
                            /* Для кроссбраузерности */
                            input::-webkit-input-placeholder,
                            textarea::-webkit-input-placeholder {
                                font-family: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif;
                                color: #b0b0b0;
                            }
                            input::-moz-placeholder,
                            textarea::-moz-placeholder {
                                font-family: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif;
                                color: #b0b0b0;
                            }
                            input:-ms-input-placeholder,
                            textarea:-ms-input-placeholder {
                                font-family: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif;
                                color: #b0b0b0;
                            }
                            input::-ms-input-placeholder,
                            textarea::-ms-input-placeholder {
                                font-family: 'Poppins', 'Inter', 'Segoe UI', Arial, sans-serif;
                                color: #b0b0b0;
                            }
                            .translate-block-align {
                                max-width: 420px;
                                margin: 0 auto;
                                width: 100%;
                                display: flex;
                                flex-direction: column;
                                gap: 12px;
                                padding-right: 20px; /* Prevent overlap with .dock on the right */
                            }
                            @media (max-width: 600px) {
                                .translate-block-align {
                                    padding-right: 45px;
                                }
                            }
                            @media (max-width: 400px) {
                                .translate-block-align {
                                    padding-right: 0;
                                }
                            }
                            /* Кастомный скролл для sourceText и translatedText */
                            #sourceText, #translatedText {
                              scrollbar-width: thin;
                              scrollbar-color: var(--color-active) var(--color-container);
                            }
                            #sourceText::-webkit-scrollbar, #translatedText::-webkit-scrollbar {
                              width: 8px;
                              background: var(--color-container);
                            }
                            #sourceText::-webkit-scrollbar-thumb, #translatedText::-webkit-scrollbar-thumb {
                              background: var(--color-active);
                              border-radius: 6px;
                            }
                            #sourceText::-webkit-scrollbar-track, #translatedText::-webkit-scrollbar-track {
                              background: var(--color-container);
                            }
                            body.theme-light #sourceText, body.theme-light #translatedText {
                              scrollbar-color: #AA97FF #F5F5F5;
                            }
                            body.theme-light #sourceText::-webkit-scrollbar-thumb, body.theme-light #translatedText::-webkit-scrollbar-thumb {
                              background: #AA97FF;
                            }
                            body.theme-light #sourceText::-webkit-scrollbar-track, body.theme-light #translatedText::-webkit-scrollbar-track {
                              background: #F5F5F5;
                            }
                            body.theme-dark #sourceText, body.theme-dark #translatedText {
                              scrollbar-color: #715CFF #232323;
                            }
                            body.theme-dark #sourceText::-webkit-scrollbar-thumb, body.theme-dark #translatedText::-webkit-scrollbar-thumb {
                              background: #715CFF;
                            }
                            body.theme-dark #sourceText::-webkit-scrollbar-track, body.theme-dark #translatedText::-webkit-scrollbar-track {
                              background: #232323;
                            }
                            /* --- Responsive styles for appearance settings page --- */
                            @media (max-width: 600px) {
                                .sidebar > div[style*='padding: 0 40px'] {
                                    padding: 0 8px !important;
                                }
                                .settings-section {
                                    padding: 0 2px !important;
                                }
                                .settings-group {
                                    border-radius: 8px !important;
                                }
                                .setting-item {
                                    flex-direction: column;
                                    align-items: stretch;
                                    gap: 8px;
                                    padding: 8px 6px !important;
                                    font-size: 13px !important;
                                }
                                .setting-item span {
                                    margin-bottom: 2px;
                                }
                                .custom-dropdown {
                                    min-width: 0 !important;
                                }
                                .custom-dropdown-selected {
                                    padding: 8px 34px 8px 10px !important;
                                    font-size: 14px !important;
                                }
                                .custom-dropdown-list {
                                    font-size: 14px !important;
                                }
                                .add-hide-icon-btn {
                                    width: 24px !important;
                                    height: 24px !important;
                                    font-size: 18px !important;
                                }
                                .hide-icon-input {
                                    width: 100% !important;
                                    font-size: 13px !important;
                                }
                                .hide-icon-input-confirm {
                                    font-size: 13px !important;
                                    padding: 6px 10px !important;
                                }
                            }
                            @media (max-width: 400px) {
                                .sidebar > div[style*='padding: 0 40px'] {
                                    padding: 0 2px !important;
                                }
                                .settings-section {
                                    padding: 0 0px !important;
                                }
                                .setting-item {
                                    font-size: 12px !important;
                                    padding: 6px 2px !important;
                                }
                                .custom-dropdown-selected {
                                    font-size: 12px !important;
                                    padding: 6px 24px 6px 8px !important;
                                }
                                .add-hide-icon-btn {
                                    width: 20px !important;
                                    height: 20px !important;
                                    font-size: 15px !important;
                                }
                            }
                            /* --- Custom scrollbar for settings/appearance page --- */
                            .settings-section,
                            .settings-group,
                            .settings-scroll-area {
                                scrollbar-width: thin;
                                scrollbar-color: #d1d5db #f5f5f5;
                            }
                            .settings-section::-webkit-scrollbar,
                            .settings-group::-webkit-scrollbar,
                            .settings-scroll-area::-webkit-scrollbar {
                                width: 8px;
                                background: #f5f5f5;
                                border-radius: 8px;
                            }
                            .settings-section::-webkit-scrollbar-thumb,
                            .settings-group::-webkit-scrollbar-thumb,
                            .settings-scroll-area::-webkit-scrollbar-thumb {
                                background: #d1d5db;
                                border-radius: 8px;
                            }
                            .settings-section::-webkit-scrollbar-track,
                            .settings-group::-webkit-scrollbar-track,
                            .settings-scroll-area::-webkit-scrollbar-track {
                                background: #f5f5f5;
                                border-radius: 8px;
                            }
                            body.theme-dark .settings-section,
                            body.theme-dark .settings-group,
                            body.theme-dark .settings-scroll-area {
                                scrollbar-color: #444 #232323;
                            }
                            body.theme-dark .settings-section::-webkit-scrollbar,
                            body.theme-dark .settings-group::-webkit-scrollbar,
                            body.theme-dark .settings-scroll-area::-webkit-scrollbar {
                                background: #232323;
                            }
                            body.theme-dark .settings-section::-webkit-scrollbar-thumb,
                            body.theme-dark .settings-group::-webkit-scrollbar-thumb,
                            body.theme-dark .settings-scroll-area::-webkit-scrollbar-thumb {
                                background: #444;
                            }
                            body.theme-dark .settings-section::-webkit-scrollbar-track,
                            body.theme-dark .settings-group::-webkit-scrollbar-track,
                            body.theme-dark .settings-scroll-area::-webkit-scrollbar-track {
                                background: #232323;
                            }
                            .selection-tooltip-group {
                                background: transparent !important;
                                border: none !important;
                                box-shadow: none !important;
                            }
                            .selection-tooltip-item {
                                display: flex;
                                flex-direction: row;
                                align-items: center;
                                justify-content: space-between;
                                gap: 8px;
                            }
                            @media (max-width: 600px) {
                                .selection-tooltip-item {
                                    flex-direction: column;
                                    align-items: stretch;
                                    gap: 6px;
                                }
                            }
                        </style>
                    `;

                // --- ICON URLS ---
                const iconUrl = chrome.runtime.getURL('public/icon.png');

                const notesUrl = chrome.runtime.getURL('public/notes.png');
                const chatUrl = chrome.runtime.getURL('public/chat.png');
                const voiceUrl = chrome.runtime.getURL('public/voice.png');
                const translateUrl = chrome.runtime.getURL('public/translate.png');
                const toolsUrl = chrome.runtime.getURL('public/tools.png');
                const settingsUrl = chrome.runtime.getURL('public/settings.png');

                const notesActiveUrl = chrome.runtime.getURL('public/notes-active.png');
                const chatActiveUrl = chrome.runtime.getURL('public/chat-active.png');
                const voiceActiveUrl = chrome.runtime.getURL('public/voice-active.png');
                const translateActiveUrl = chrome.runtime.getURL('public/translate-active.png');
                const toolsActiveUrl = chrome.runtime.getURL('public/tools-active.png');
                const settingsActiveUrl = chrome.runtime.getURL('public/settings-active.png');

                // --- WHITE ICON URLS ---
                const notesWhiteUrl = chrome.runtime.getURL('public/notes-white.png');
                const chatWhiteUrl = chrome.runtime.getURL('public/chat-white.png');
                const voiceWhiteUrl = chrome.runtime.getURL('public/voice-white.png');
                const translateWhiteUrl = chrome.runtime.getURL('public/translate-white.png');
                const toolsWhiteUrl = chrome.runtime.getURL('public/tools-white.png');
                const settingsWhiteUrl = chrome.runtime.getURL('public/settings-white.png');

                const notesActiveWhiteUrl = chrome.runtime.getURL('public/notes-white-active.png');
                const chatActiveWhiteUrl = chrome.runtime.getURL('public/chat-active-white.png');
                const voiceActiveWhiteUrl = chrome.runtime.getURL('public/voice-white-active.png');
                const translateActiveWhiteUrl = chrome.runtime.getURL('public/translate-white-active.png');
                const toolsActiveWhiteUrl = chrome.runtime.getURL('public/tools-active-white.png');
                const settingsActiveWhiteUrl = chrome.runtime.getURL('public/settings-white-active.png');

                const summarizerUrl = chrome.runtime.getURL('public/summarizer.png');
                const simplifierUrl = chrome.runtime.getURL('public/simplifier.png');

                const historyUrl = chrome.runtime.getURL('public/history.png');
                const newChatUrl = chrome.runtime.getURL('public/new-chat.png');

                const accountUrl = chrome.runtime.getURL('public/account.png');
                const appereanceUrl = chrome.runtime.getURL('public/appereance.png');

                const accountActiveUrl = chrome.runtime.getURL('public/account-active.png');
                const appereanceActiveUrl = chrome.runtime.getURL('public/appereance-active.png');

                // Белые иконки для settings_dock (использовать в светлой теме)
                const accountWhiteUrl = chrome.runtime.getURL('public/account-white.png');
                const appereanceWhiteUrl = chrome.runtime.getURL('public/appereance-white.png');
                const accountActiveWhiteUrl = chrome.runtime.getURL('public/account-white-active.png');
                const appereanceActiveWhiteUrl = chrome.runtime.getURL('public/appereance-white-active.png');

                // --- WHITE ICONS for settings dock ---
                // (Удалены неиспользуемые переменные)

                iframeDoc.body.innerHTML = `
                        <div class="sidebar">
                            <button class="close-btn" id="close-sidebar" style="right: ${this.sidebarPosition === 'left' ? '435px' : '16px'};">×</button>

                            <div id="screen-home" class="screen active">
                                <div class="megan-card" style="box-shadow: 0 8px 32px rgb(84, 57, 202); border-radius: 24px; padding: 40px 36px 32px 36px; max-width: 340px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 18px; border: 1px solid var(--color-border, #ececec); background: var(--color-bg);">
                                    <div class="avatar" style="width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                                        <img id="home-megan-icon" src="${iconUrl}" alt="Megan Icon" style="width: 48px; height: 48px; object-fit: contain; border-radius: 50%;" />
                                    </div>
                                    <h1 class="title gradient-text" style="font-family: 'Playfair Display', serif; font-size: 44px; font-weight: 700; margin-bottom: 0; text-align: center;">Megan</h1>
                                    <p class="intro" style="line-height: 1.6; font-size: 16px; color: var(--color-text, #232323); text-align: center; margin-top: 0; margin-bottom: 0; opacity: 0.85;">
                                    <span data-translate="megan_intro" style="font-weight: 700;"></span>
                                    <br><br>
                                    <span class="gradient-text" style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 24px;" data-translate="lets_get_started"></span>
                                    </p>
                                </div>
                            </div>

                            <div id="screen-notes" class="screen">
                                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                                    <h1 class="title" data-translate="notes" style="text-align: left; margin-bottom: 0;${this.sidebarPosition === 'left' ? ' margin-left: 52px;' : ''}">Notes</h1>
                                    <button id="calendar-btn" style="background: var(--color-active); color: #fff; border: none; border-radius: 8px; padding: 8px 12px; font-size: 14px; font-weight: 600; cursor: pointer;${this.sidebarPosition === 'left' ? ' margin-right: -9px;' : ' margin-right: 42px;'}" data-translate="calendar">Calendar</button>
                                </div>
                                <div class="notes-screen-things" style="max-width: 390px;${this.sidebarPosition === 'left' ? ' margin-left:50px;' : ''}">
                                    <div class="notes-input-row" style="position: relative; display: flex; align-items: stretch; margin-bottom: 12px;">
                                        <textarea id="note-input" data-translate="note_placeholder" placeholder="What do you want to save?" class="notes-textarea"></textarea>
                                        <button id="save-note" class="notes-save-btn" data-translate="save">Save</button>
                                    </div>
                                    <input id="notes-search" type="text" data-translate="search" placeholder="Search" class="notes-search-input" />
                                    <div id="notes-list"></div>
                                </div>
                            </div>

                            <!-- Экран детального просмотра заметки -->
                            <div id="screen-note-detail" class="screen" style="overflow-y: auto;">
                                <div style="max-width:390px;${this.sidebarPosition === 'left' ? ' margin-left:50px;' : ''}">
                                    <h1 class="title" data-translate="notes">Notes</h1>
                                    <div class="notes-detail-header">
                                        <button id="back-to-notes" class="notes-detail-back" data-translate="back">← Back</button>
                                        <div class="notes-detail-btns">
                                            <button id="update-note" class="notes-detail-btn" data-translate="save">Save</button>
                                            <button id="delete-note" class="notes-detail-btn notes-detail-btn-delete" data-translate="delete">Delete</button>
                                        </div>
                                    </div>
                                    <div class="notes-detail-container">
                                        <input id="note-title" data-translate="title" placeholder="Title" class="notes-detail-title">
                                        <textarea id="note-body" class="notes-detail-body"></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Новый экран календаря -->
                            <div id="screen-calendar" class="screen">
                                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                                    <button id="back-to-notes-from-calendar" style="background: var(--color-container); color: var(--color-text); border: 1px solid var(--color-border); border-radius: 8px; padding: 8px 14px; font-size: 14px; cursor: pointer; transition: all 0.2s ease;" data-translate="back"></button>
                                    <h1 class="title" style="margin: 0; color: var(--color-text);" data-translate="calendar"></h1>
                                </div>
                                <div id="calendar-widget" style="background: var(--color-container); border-radius: 12px; padding: 18px; margin-bottom: 24px; max-width: 390px; border: 1px solid var(--color-border); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);${this.sidebarPosition === 'left' ? ' margin-left: 40px;' : ' margin-right: 40px;'}">
                                    <!-- Навигация по месяцам -->
                                    <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 18px; gap: 8px;">
                                        <button id="calendar-prev-month" style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--color-text); transition: color 0.2s ease; padding: 4px; border-radius: 4px; min-width: 28px; display: flex; align-items: center; justify-content: center;">&lt;</button>
                                        <div id="calendar-current-month" style="font-weight: 600; font-size: 16px; color: var(--color-text); min-width: 120px; text-align: center;"></div>
                                        <button id="calendar-next-month" style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--color-text); transition: color 0.2s ease; padding: 4px; border-radius: 4px; min-width: 28px; display: flex; align-items: center; justify-content: center;">&gt;</button>
                                    </div>
                                    <!-- Простой календарь (сетка дней) -->
                                    <div id="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center; font-size: 15px; margin-bottom: 18px;"></div>
                                </div>
                                <div id="calendar-events-section" style="${this.sidebarPosition === 'left' ? 'margin-left: 40px;' : 'margin-right: 40px;'}">
                                    <h2 style="font-size: 17px; margin-bottom: 10px; color: var(--color-text);" data-translate="upcoming_events"></h2>
                                    <input type="text" id="calendar-events-search" style="width: 100%; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg); color: var(--color-text); font-size: 14px; margin-bottom: 12px;" data-translate="search_events" placeholder="Search events...">
                                    <ul id="calendar-upcoming-events" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto;"></ul>
                                </div>
                                <div id="calendar-date-details" style="display: none; margin-top: 24px;${this.sidebarPosition === 'left' ? ' margin-left: 40px;' : ' margin-right: 40px;'}">
                                    <h2 style="font-size: 17px; margin-bottom: 10px; color: var(--color-text);">
                                        <span data-translate="details_for"></span>
                                        <span id="calendar-selected-date"></span>
                                    </h2>
                                    <div id="calendar-date-events" style="max-height: 300px; overflow-y: auto; scrollbar-width: none; margin-bottom: 12px; color: var(--color-text);">
                                        <div data-translate="no_events_for_date"></div>
                                    </div>
                                    <button id="calendar-create-event-btn" style="background: var(--color-active); color: #fff; border: none; border-radius: 8px; padding: 8px 14px; font-size: 14px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);" data-translate="create_event"></button>
                                </div>
                            </div>

                            <!-- Кастомная модалка подтверждения удаления заметки -->

                            <div id="delete-note-modal" class="tools-modal-overlay">
                                <div class="modal-content tools-modal-content" style="max-width:340px;">
                                    <div class="modal-header">
                                        <div class="modal-title" data-translate="delete_note_confirm">Delete note?</div>
                                    </div>
                                    <div style="margin-bottom:18px; font-size:15px; text-align:center;" data-translate="delete_note_message">Are you sure you want to delete this note? This action cannot be undone.</div>
                                    <div style="display:flex; gap:16px; justify-content:center;">
                                        <button id="delete-note-confirm" style="background:#ff4444;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:15px;cursor:pointer;" data-translate="delete">Delete</button>
                                        <button id="delete-note-cancel" style="background:#232323;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:15px;cursor:pointer;" data-translate="cancel">Cancel</button>
                                    </div>
                                </div>
                            </div>

                            <div id="screen-chat" class="screen">
                                <h1 class="title" data-translate="chat">Chat</h1>
                                <div id="chat-container" style="flex: 1 1 0; display: flex; flex-direction: column; background: var(--color-bg); border-radius: 8px; overflow-y: auto; gap: 12px; margin-bottom: 16px; min-height: 0; max-height: 80vh;${this.sidebarPosition === 'left' ? ' margin-left: 40px; margin-right: 4px;' : ' margin-right: 40px; margin-left: 4px;'}"></div>
                                <form id="chat-form" style="display: flex; flex-direction: column; gap: 0; align-items: stretch; margin-top: auto; width: 100%; position: relative;">
                                    <div class="chat-actions" style="display: flex; justify-content: flex-end; gap: 4px; margin-bottom: 4px; margin-right: 30px;">
                                        <button type="button" id="chat-new" style="background: none; border: none; border-radius: 0; padding: 0; height: 40px; width: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><img src="${newChatUrl}" alt="New Chat" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;" /></button>
                                        <button type="button" id="chat-history" style="background: none; border: none; border-radius: 0; padding: 0; height: 40px; width: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><img src="${historyUrl}" alt="History" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;" /></button>
                                    </div>
                                    <div style="position: relative; width: 100%; display: flex; align-items: flex-end; gap: 8px;">
                                        <textarea id="chat-input" data-translate="chat_placeholder" placeholder="Ask whatever you want..." rows="1" style="max-width:380px; min-width: 0; resize: none; border-radius: 12px; border: 1.5px solid var(--color-border); background: var(--color-container); color: var(--color-text); padding: 12px 80px 12px 14px; font-size: 15px; transition: border 0.2s; height: 100px; min-height: 100px; max-height:100px ; margin: 0 0 0 16px; scrollbar-width: thin; scrollbar-color: #232323 #0000;"></textarea>
                                        <button type="submit" id="chat-send" style="position: absolute; right: 48px; bottom: 18px; background: var(--color-active);; color: #fff; border: none; border-radius: 10px; padding: 0 18px; height: 40px; font-weight: 600; font-size: 15px; cursor: pointer; z-index: 2;" data-translate="send">Send</button>
                                    </div>
                                </form>
                                <style>
                                    /* Стили только для чата */
                                    #chat-input:focus {
                                        border: 1.5px solid #A48FFF !important;
                                        outline: none;
                                    }
                                    #chat-container::-webkit-scrollbar {
                                        width: 0 !important;
                                        background: transparent !important;
                                    }
                                    #chat-container::-webkit-scrollbar-thumb {
                                        background: transparent !important;
                                        border-radius: 8px;
                                    }
                                    .chat-actions {
                                        display: flex;
                                        gap: 8px;
                                        margin-bottom: 4px;
                                    }
                                    #chat-form {
                                        margin-top: 0;
                                        flex-direction: column;
                                        gap: 0;
                                        align-items: stretch;
                                    }
                                    #chat-send {
                                        position: absolute;
                                        right: 24px;
                                        bottom: 18px;
                                        z-index: 2;
                                    }
                                    #chat-input {
                                        padding-right: 80px !important;
                                    }
                                    /* ... existing chat styles ... */
                                    #chat-input::-webkit-scrollbar {
                                        width: 6px;
                                        background: transparent;
                                    }
                                    #chat-input::-webkit-scrollbar-thumb {
                                        background: #232323;
                                        border-radius: 6px;
                                    }
                                    #chat-input::-webkit-scrollbar-track {
                                        background: transparent;
                                    }
                                </style>
                            </div>

                            <div id="screen-voice" class="screen">
                                <button id="read-page-aloud-btn" data-translate="read_page_aloud" style="position: absolute; top: 18px; ${this.sidebarPosition === 'left' ? 'right: 18px;' : 'left: 18px;'} z-index: 10; margin: 0; background: var(--color-container); color: var(--color-active); border: 1px solid var(--color-border); border-radius: 8px; height: 36px; padding: 0 18px; font-size: 15px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background 0.2s, color 0.2s, border 0.2s; box-shadow: none; white-space: nowrap;">
                                    <span class="read-page-aloud-icon" style="margin-right: 8px; display: flex; align-items: center; color: var(--color-active);">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3 9V15H7L12 20V4L7 9H3Z" fill="currentColor"/>
                                            <path d="M16.5 12C16.5 10.07 15.37 8.36 13.5 7.68V9.1C14.44 9.58 15.1 10.7 15.1 12C15.1 13.3 14.44 14.42 13.5 14.9V16.32C15.37 15.64 16.5 13.93 16.5 12Z" fill="currentColor"/>
                                        </svg>
                                    </span>
                                    <span data-translate="read_page_aloud" style="color: var(--color-active); font-weight: 500;">Read page aloud</span>
                                </button>

                                <h1 class="title" data-translate="lets_talk">Let's talk!</h1>

                                <button id="mic-toggle-btn" style="margin-bottom: 18px; background: #1A1A1A; color: #fff; border: none; border-radius: 50%; width: 56px; height: 56px; font-size: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; position: relative;">
                                    <span id="mic-toggle-icon" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; position: relative;"></span>
                                </button>
                                
                                <p id="voice-status-bubble" data-translate="voice_waiting">I'm waiting to hear your pretty voice!</p>
                                
                                <div id="voice-waveform-container">
                                    <!-- Bars will be generated by JS -->
                                
                                </div>
                                <p id="voice-result"></p>
                            </div>

                            <div id="screen-translate" class="screen">
                                <div style="max-width:390px; ${this.sidebarPosition === 'left' ? ' margin-left:50px;' : ''}">
                                    <div class="translation-header" style="display: flex; align-items: center; justify-content: space-between;"/*  */>
                                        <h1 id="translate-top-row" data-translate="translate">Translate</h1>
                                        <button id="translate-page-btn" class="page-translate-btn" data-translate="translate_webpage" style="right: ${this.sidebarPosition === 'left' ? '22px' : '72px'};"></button>
                                    </div>
                                    
                                    <div class="translate-block-align">
                                        <div class="translate-lang-row">
                                            <div class="custom-dropdown" id="source-lang-dropdown">
                                                <div class="custom-dropdown-selected" id="source-lang-dropdown-selected">Auto</div>
                                                <div class="custom-dropdown-list" id="source-lang-dropdown-list"></div>
                                            </div>
                                            <span id="swapLangs" title="Swap languages">↔</span>
                                            <div class="custom-dropdown" id="target-lang-dropdown">
                                                <div class="custom-dropdown-selected" id="target-lang-dropdown-selected">English</div>
                                                <div class="custom-dropdown-list" id="target-lang-dropdown-list"></div>
                                            </div>
                                            <select id="sourceLanguage" style="display:none"></select>
                                            <select id="targetLanguage" style="display:none"></select>
                                        </div>
                                        
                                        <div class="source-wrapper">
                                            <textarea id="sourceText" data-translate="type_here" placeholder="Type here..." style="resize: none; min-height: 44px; max-height: 35vh;min-height: 10vh; overflow-y: auto;"></textarea>
                                            <button id="translateButton" class="translate-btn translate-btn-inside" data-translate="translate">Translate</button>
                                        </div>
                                        <textarea id="translatedText" readonly data-translate="translation_placeholder" placeholder="Translation will appear here..." style="resize: none; min-height: 10vh; max-height: 35vh; overflow-y: auto;"></textarea>
                                    </div>
                                </div>
                            </div>

                            <div id="screen-tools" class="screen">
                            </div>

                            <div id="tools-modal" class="tools-modal-overlay">
                                <div class="modal-content tools-modal-content">
                                    <div class="modal-header">
                                        <div class="modal-title" data-translate="all_tools">All tools</div>
                                    </div>
                                    <div class="tools-section">
                                        <div class="tools-section-title" data-translate="available_tools">Here is the all available tools</div>
                                        <div class="tools-icons-row">
                                            <div class="tool-icon-block" data-tool="translate">
                                                <span class="tool-icon"><img src="${translateUrl}" alt="Translate" style="width:32px;height:32px;object-fit:contain;display:block;" /></span>
                                                <div class="tool-label" data-translate="translate">Translate</div>
                                            </div>
                                            <div class="tool-icon-block" data-tool="summarize">
                                                <span class="tool-icon"><img src="${summarizerUrl}" alt="Summarize" style="width:32px;height:32px;object-fit:contain;display:block;" /></span>
                                                <div class="tool-label" data-translate="summarize">Summarize</div>
                                            </div>
                                            <div class="tool-icon-block disabled-tool">
                                                <span class="tool-icon" style="position: relative; display: flex; align-items: center; justify-content: center;">
                                                    <img src="${simplifierUrl}" alt="Simplify" style="width:32px;height:32px;object-fit:contain;display:block;opacity:0.4;" />
                                                    <svg width="32" height="32" style="position:absolute;top:0;left:0;pointer-events:none;" xmlns="http://www.w3.org/2000/svg">
                                                        <line x1="4" y1="28" x2="28" y2="4" stroke="#ff4444" stroke-width="2.5" stroke-linecap="round" />
                                                    </svg>
                                                </span>
                                                <div class="tool-label" style="color: #888;" data-translate="soon">Soon</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div id="screen-settings" class="screen">
                                <h1 class="title" data-translate="settings">Settings</h1>
                                <div class="settings-description" style="
                                    background: rgba(160, 150, 255, 0.08);
                                    border-radius: 16px;
                                    box-shadow: 0 2px 12px #715cff11;
                                    padding: 22px 20px 18px 20px;
                                    margin: 24px 50px 24px 50px;
                                    max-width: 420px;
                                    color: var(--color-text);
                                    font-size: 16px;
                                    line-height: 1.7;
                                    text-align: left;
                                    display: flex;
                                    align-items: flex-start;
                                    gap: 14px;
                                " data-translate="settings_main_info"></div>
                            </div>

                            <div id="screen-account" class="screen">
                                <h1 class="title" data-translate="settings">Settings</h1>
                                <div style="padding: 0 32px 32px 32px; max-width: 400px; margin: 0 auto;">
                                    <h2 class="section-title" style="margin-bottom: 18px;" data-translate="account">Account</h2>
                                    <div style="background: var(--color-container); border-radius: 12px; border: 1px solid var(--color-border); padding: 20px 20px 16px 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
                                        <img id="user-avatar" class="account-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0b0b0'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M12 14c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z'/%3E%3C/svg%3E" alt="avatar" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; background: #fff; border: 1px solid var(--color-border);" />
                                        <div style="display: flex; flex-direction: column;">
                                            <div id="user-name" class="account-name" style="font-size: 17px; font-weight: 600; color: var(--color-text); margin-bottom: 2px;"></div>
                                            <div id="user-email" class="account-email" style="font-size: 14px; color: #b0b0b0; max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title=""></div>
                                        </div>
                                    </div>
                                    <h2 class="section-title" style="margin-bottom: 18px;" data-translate="pro_plan">Pro plan</h2>
                                    <div style="background: var(--color-container); border-radius: 12px; border: 1px solid var(--color-border); padding: 20px 20px 16px 20px; margin-bottom: 28px;">
                                        <div style="font-size: 15px; color: #b0b0b0; margin-bottom: 10px;" data-translate="no_pro_plan">You have no pro plan yet!</div>
                                        <button class="account-btn account-btn-pro" style="color: #6F58D5; background: none; border: none; font-size: 15px; font-weight: 300; padding: 0; cursor: pointer; text-align: left;" data-translate="activate">Activate</button>
                                    </div>
                                    <h2 class="section-title" style="margin-bottom: 18px;" data-translate="actions">Actions</h2>
                                    <div style="background: var(--color-container); border-radius: 12px; border: 1px solid var(--color-border); padding: 0px 20px 0px 20px; margin-bottom: 28px;">
                                        <button id="logout-btn" class="account-btn account-btn-logout" style="max-width: 180px; background: none; color: #ff5252; border: none; border-radius: 20px; padding: 10px 0 10px 0px; font-size: 15px; font-weight: 300; cursor: pointer; text-align: left;" data-translate="logout">Logout</button>
                                    </div>
                                </div>
                            </div>

                            <div id="screen-appereance" class="screen">
                                <div style="padding: 0 40px; height: 100%;">
                                    <h1 class="title" data-translate="settings">Settings</h1>
                                    <div class="settings-scroll-area" style="overflow-y: auto; height: calc(100% - 70px); padding-right: 8px; margin-right: -8px;">
                                        <div class="settings-section">
                                            <h2 class="section-title" data-translate="appearance">Appereance</h2>
                                            <div class="settings-group">
                                                <div class="setting-item">
                                                    <span data-translate="theme">Theme</span>
                                                    <div class="custom-dropdown" id="theme-dropdown">
                                                        <div class="custom-dropdown-selected" id="theme-dropdown-selected" data-translate-key="system">System</div>
                                                        <div class="custom-dropdown-list" id="theme-dropdown-list">
                                                            <div class="custom-dropdown-option" data-value="system" data-translate="system">System</div>
                                                            <div class="custom-dropdown-option" data-value="light" data-translate="light">Light</div>
                                                            <div class="custom-dropdown-option" data-value="dark" data-translate="dark">Dark</div>
                                                        </div>
                                                    </div>
                                                    <select id="theme-select" style="display:none">
                                                        <option value="system">System</option>
                                                        <option value="light">Light</option>
                                                        <option value="dark">Dark</option>
                                                    </select>
                                                </div>
                                                <div class="setting-item">
                                                    <span data-translate="language">Language</span>
                                                    <div class="custom-dropdown" id="language-dropdown">
                                                        <div class="custom-dropdown-selected" id="language-dropdown-selected" data-translate-key="english"></div>
                                                        <div class="custom-dropdown-list" id="language-dropdown-list">
                                                            <div class="custom-dropdown-option" data-value="en">English</div>
                                                            <div class="custom-dropdown-option" data-value="ru">Русский</div>
                                                            <div class="custom-dropdown-option" data-value="es">Español</div>
                                                        </div>
                                                    </div>
                                                    <select id="language-select" style="display:none">
                                                        <option value="en">English</option>
                                                        <option value="ru">Русский</option>
                                                        <option value="es">Español</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    
                                        <div class="settings-section">
                                            <div class="section-title-container">
                                                <h2 class="section-title" data-translate="icon">Icon</h2>
                                                <label class="switch">
                                                    <input type="checkbox" checked>
                                                    <span class="slider round"></span>
                                                </label>
                                            </div>
                                            <div class="settings-group">
                                                 <div class="setting-item">
                                                    <span data-translate="location">Location</span>
                                                    <div class="custom-dropdown" id="icon-location-dropdown">
                                                        <div class="custom-dropdown-selected" id="icon-location-dropdown-selected" data-translate-key="bottom">Bottom</div>
                                                        <div class="custom-dropdown-list" id="icon-location-dropdown-list">
                                                            <div class="custom-dropdown-option" data-value="Bottom" data-translate="bottom">Bottom</div>
                                                            <div class="custom-dropdown-option" data-value="Top" data-translate="top">Top</div>
                                                        </div>
                                                    </div>
                                                    <select id="icon-location-select" style="display:none">
                                                        <option value="Bottom">Bottom</option>
                                                        <option value="Top">Top</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    
                                        <div class="settings-section">
                                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                                <h2 class="section-title" style="margin-bottom: 0;" data-translate="hide_icon_on">Hide icon on</h2>
                                                <button id="add-hide-icon-url-btn" class="add-hide-icon-btn">+</button>
                                            </div>
                                            <div id="hide-icon-chips-list" style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;"></div>
                                            <div id="hide-icon-input-wrap" style="margin-top: 10px; display: none;">
                                                <input id="hide-icon-input" type="text" placeholder="example.com" class="hide-icon-input" />
                                                <button id="hide-icon-input-confirm" class="hide-icon-input-confirm">Add</button>
                                            </div>
                                        </div>
                                    
                                        <div class="settings-section">
                                            <h2 class="section-title" data-translate="sidebar">Sidebar</h2>
                                            <div class="settings-group">
                                                 <div class="setting-item">
                                                    <span data-translate="location">Location</span>
                                                    <div class="custom-dropdown" id="sidebar-location-dropdown">
                                                        <div class="custom-dropdown-selected" id="sidebar-location-dropdown-selected" data-translate-key="right">Right</div>
                                                        <div class="custom-dropdown-list" id="sidebar-location-dropdown-list">
                                                            <div class="custom-dropdown-option" data-value="right" data-translate="right">Right</div>
                                                            <div class="custom-dropdown-option" data-value="left" data-translate="left">Left</div>
                                                        </div>
                                                    </div>
                                                    <select id="sidebar-location-select" style="display:none">
                                                        <option value="right">Right</option>
                                                        <option value="left">Left</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="settings-section">
                                            <div class="section-title-container">
                                                <h2 class="section-title" data-translate="selection_tooltip">Selection tooltip</h2>
                                                <label class="switch">
                                                <input type="checkbox" id="selection-tooltip-toggle" checked>
                                                <span class="slider round"></span>
                                                </label>
                                            </div>
                                            <div class="settings-group selection-tooltip-group">
                                                <div class="setting-item selection-tooltip-item">
                                                <span data-translate="hide_tooltip_on">Hide tooltip on</span>
                                                <button id="add-hide-tooltip-url-btn" class="add-hide-icon-btn">+</button>
                                                </div>
                                                <div id="hide-tooltip-chips-list" style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;"></div>
                                                <div id="hide-tooltip-input-wrap" style="margin-top: 10px; display: none;">
                                                <input id="hide-tooltip-input" type="text" placeholder="example.com" class="hide-icon-input" />
                                                <button id="hide-tooltip-input-confirm" class="hide-icon-input-confirm">Add</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                    
                            </div>

                            <nav class="settings_dock">
                                <button class="settings__dock__btn" title="Account" data-screen="screen-account" style="position: relative; padding: 0; background: transparent;">
                                    <img class="settings-dock-icon" src="${accountUrl}" alt="Account" style="width: 44px; height: 44px; object-fit: contain; border-radius: 50%;" />
                                </button>
                                <button class="settings__dock__btn" title="Appereance" data-screen="screen-appereance" style="position: relative; padding: 0; background: transparent;">
                                    <img class="settings-dock-icon" src="${appereanceUrl}" alt="Appereance" style="width: 44px; height: 44px; object-fit: contain; border-radius: 50%;" />
                                </button>
                            </nav>

                            <nav class="dock">
                                <button class="dock__btn" title="Notes" data-screen="screen-notes">
                                    <img class="dock-icon" src="${notesUrl}" alt="Notes" style="width:28px;height:28px;object-fit:contain;display:block;" />
                                </button>
                                <button class="dock__btn" title="Chat" data-screen="screen-chat">
                                    <img class="dock-icon" src="${chatUrl}" alt="Chat" style="width:28px;height:28px;object-fit:contain;display:block;" />
                                </button>
                                <button class="dock__btn" title="Voice" data-screen="screen-voice">
                                    <img class="dock-icon" src="${voiceUrl}" alt="Voice" style="width:28px;height:28px;object-fit:contain;display:block;" />
                                </button>
                                <button class="dock__btn" title="Translate" data-screen="screen-translate">
                                    <img class="dock-icon" src="${translateUrl}" alt="Translate" style="width:28px;height:28px;object-fit:contain;display:block;" />
                                </button>
                                <button class="tools_button" title="Tools">
                                    <img class="dock-icon" src="${toolsUrl}" alt="Tools" style="width:28px;height:28px;object-fit:contain;display:block;" />
                                </button>
                                <button class="dock__btn" title="Settings" data-screen="screen-settings">
                                    <img class="dock-icon" src="${settingsUrl}" alt="Settings" style="width:28px;height:28px;object-fit:contain;display:block;" />
                                </button>
                            </nav>
                        </div>
                    `;

                // Инициализируем компоненты
                AuthComponent.initAuth(iframeDoc);
                NavigationComponent.initNavigation(iframeDoc);
                NotesComponent.initNotes(iframeDoc);
                // NotesComponent.initNoteDetail(iframeDoc);
                NotesComponent.initCalendar(iframeDoc).catch(console.error);
                TranslateService.initTranslate(iframeDoc);
                VoiceService.initVoice(iframeDoc);
                ToolsComponent.initTools(iframeDoc);
                AccountComponent.initAuth(iframeDoc);
                ChatComponent.initChat(iframeDoc);

                // Initialize translations for the iframe document
                TranslationService.updateAllTranslations(iframeDoc);

                // Добавляем обработчик для кнопки закрытия
                const closeBtn = iframeDoc.getElementById('close-sidebar');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => this.closeSidebar());
                }

                // Add logout button handler
                const logoutBtn = iframeDoc.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async () => {
                        await AuthService.logout();
                        window.location.reload();
                    });
                }

                // --- Модалка выбора языка для PageTranslateService ---
                if (!iframeDoc.getElementById('page-translate-lang-modal')) {
                    const langModal = iframeDoc.createElement('div');
                    langModal.id = 'page-translate-lang-modal';
                    langModal.className = 'tools-modal-overlay';
                    // Генерируем опции из массива languages
                    langModal.innerHTML = `
                      <div class="modal-content" style="max-width:320px;">
                        <div class="modal-header">
                          <div class="modal-title">${TranslationService.translate('select_language')}</div>
                          <button class="modal-close" id="close-lang-modal">×</button>
                        </div>
                        <div style="margin-bottom:18px;">
                          <div class="custom-dropdown" id="lang-modal-dropdown">
                            <div class="custom-dropdown-selected" id="lang-modal-dropdown-selected">English</div>
                            <div class="custom-dropdown-list" id="lang-modal-dropdown-list">
                              <div class="custom-dropdown-option" data-value="en">English</div>
                              <div class="custom-dropdown-option" data-value="ru">Русский</div>
                              <div class="custom-dropdown-option" data-value="es">Español</div>
                            </div>
                          </div>
                        </div>
                        <button id="page-translate-confirm" style="width:100%;background:#715CFF;color:#fff;padding:10px 0;border:none;border-radius:8px;font-size:16px;cursor:pointer;">${TranslationService.translate('translate_webpage')}</button>
                        <div id="page-translate-loader" style="display:none;justify-content:center;align-items:center;margin-top:18px;">
                          <div class="loader-circle" style="width:36px;height:36px;border:4px solid #eee;border-top:4px solid #715CFF;border-radius:50%;animation:spin 1s linear infinite;"></div>
                        </div>
                      </div>
                      <style>
                        @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
                      </style>
                    `;
                    iframeDoc.body.appendChild(langModal);
                }

                // --- Глобальный overlay-лоадер для перевода страницы ---
                if (!iframeDoc.getElementById('global-page-translate-loader')) {
                    const loaderOverlay = iframeDoc.createElement('div');
                    loaderOverlay.id = 'global-page-translate-loader';
                    loaderOverlay.style.cssText = `
                        display: none; position: fixed; z-index: 99999; top: 0; left: 0; width: 100vw; height: 100vh;
                        background: rgba(0,0,0,0.35); justify-content: center; align-items: center; flex-direction: column;`;
                    loaderOverlay.innerHTML = `
                        <div class="loader-circle" style="width:56px;height:56px;border:6px solid #eee;border-top:6px solid #715CFF;border-radius:50%;animation:spin 1s linear infinite;"></div>
                        <div style="margin-top:18px;color:#fff;font-size:18px;font-weight:500;letter-spacing:0.5px;" data-translate="loading">Loading... , please wait</div>
                        <style>@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }</style>
                    `;
                    iframeDoc.body.appendChild(loaderOverlay);
                }

                // --- Модальное окно для создания события ---
                if (!iframeDoc.getElementById('calendar-create-event-modal')) {
                    const eventModal = iframeDoc.createElement('div');
                    eventModal.id = 'calendar-create-event-modal';
                    eventModal.className = 'tools-modal-overlay';
                    eventModal.style.display = 'none';
                    eventModal.innerHTML = `
                        <div class="modal-content tools-modal-content" style="max-width: 400px;">
                            <div class="modal-header">
                                <div class="modal-title" data-translate="create_new_event"></div>
                                <button id="calendar-modal-close" class="modal-close">&times;</button>
                            </div>
                            <div style="padding: 16px;">
                                <div style="margin-bottom: 12px;">
                                    <label style="display: block; margin-bottom: 6px; font-size: 14px;" data-translate="event_title"></label>
                                    <input type="text" id="calendar-event-title" style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg); color: var(--color-text);">
                                </div>
                                <div style="margin-bottom: 12px;">
                                    <label style="display: block; margin-bottom: 6px; font-size: 14px;" data-translate="event_description"></label>
                                    <textarea id="calendar-event-details" style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg); color: var(--color-text); height: 80px; max-height: 120px; resize: none;"></textarea>
                                </div>
                                <div style="margin-bottom: 12px;">
                                    <label style="display: block; margin-bottom: 6px; font-size: 14px;" data-translate="event_location_optional"></label>
                                    <input type="text" id="calendar-event-location" style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg); color: var(--color-text);">
                                </div>
                                <div style="margin-bottom: 12px;">
                                    <label style="display: block; margin-bottom: 6px; font-size: 14px;" data-translate="time_label"></label>
                                    <input type="time" id="calendar-event-time" value="12:00" style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg); color: var(--color-text);">
                                </div>
                                <div style="margin-bottom: 16px;">
                                    <label style="display: block; margin-bottom: 6px; font-size: 14px;" data-translate="reminder_label"></label>
                                    <select id="calendar-event-reminder" style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg); color: var(--color-text);">
                                        <option value="0" data-translate="no_reminder"></option>
                                        <option value="5" data-translate="reminder_5"></option>
                                        <option value="15" data-translate="reminder_15"></option>
                                        <option value="30" data-translate="reminder_30"></option>
                                        <option value="60" data-translate="reminder_60"></option>
                                    </select>
                                </div>
                                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                                    <button id="calendar-event-cancel-btn" style="padding: 8px 16px; border: none; border-radius: 6px; background: var(--color-container); color: var(--color-text); cursor: pointer;" data-translate="cancel"></button>
                                    <button id="calendar-event-save-btn" style="padding: 8px 16px; border: none; border-radius: 6px; background: var(--color-active); color: #fff; cursor: pointer;" data-translate="save_event"></button>
                                </div>
                            </div>
                        </div>
                    `;
                    iframeDoc.body.appendChild(eventModal);
                }

                // Логика показа/скрытия и запуска перевода
                const toolsModal = iframeDoc.getElementById('tools-modal');
                const langModal = iframeDoc.getElementById('page-translate-lang-modal');
                if (toolsModal && langModal) {
                    const translateBlock = Array.from(toolsModal.querySelectorAll('.tool-icon-block')).find(block =>
                        block.querySelector('.tool-label')?.textContent?.toLowerCase() === 'translate');
                    if (translateBlock) {
                        (translateBlock as HTMLElement).addEventListener('click', () => {
                            toolsModal.classList.remove('active');
                            langModal.classList.add('active');
                        });
                    }
                    // Кнопка Translate webpage на экране перевода
                    const translatePageBtn = iframeDoc.getElementById('translate-page-btn');
                    if (translatePageBtn) {
                        translatePageBtn.addEventListener('click', () => {
                            langModal.classList.add('active');
                        });
                    }
                    const closeLangModal = iframeDoc.getElementById('close-lang-modal');
                    if (closeLangModal) {
                        closeLangModal.addEventListener('click', () => {
                            langModal.classList.remove('active');
                        });
                    }
                    const confirmBtn = iframeDoc.getElementById('page-translate-confirm');
                    if (confirmBtn) {
                        confirmBtn.addEventListener('click', async () => {
                            // используем выбранный язык из selectedLang
                            const lang = selectedLang;
                            const token = await AuthService.getToken();
                            console.log("START TRANSLATE PAGE!!!" + token);

                            // Запускаем режим перевода
                            PageTranslateService.toggleTranslateMode(lang, token || undefined);

                            // Скрываем модалку выбора языка
                            if (langModal) {
                                langModal.classList.remove('active');
                            }
                        });
                    }
                }

                // --- Смена иконок при активации вкладки ---
                const dockButtons = iframeDoc.querySelectorAll('.dock__btn, .tools_button, .settings__dock__btn');
                const settingsDock = iframeDoc.querySelector('.settings_dock') as HTMLElement | null;
                function updateSettingsDockVisibility() {
                    if (!iframeDoc) return;
                    const screens = ['screen-settings', 'screen-account', 'screen-appereance'];
                    const isVisible = screens.some(id => {
                        const el = iframeDoc.getElementById(id);
                        return el && el.classList.contains('active');
                    });
                    if (settingsDock) settingsDock.style.display = isVisible ? 'flex' : 'none';
                }
                // Вызываем при старте
                updateSettingsDockVisibility();
                // И при каждом клике на dock-кнопки
                dockButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        dockButtons.forEach(b => {
                            b.classList.remove('active');
                            // dock
                            const img = b.querySelector('.dock-icon') as HTMLImageElement | null;
                            if (img) {
                                switch (b.getAttribute('data-screen') || (b.classList.contains('tools_button') ? 'tools' : '')) {
                                    case 'screen-notes': img.src = notesUrl; break;
                                    case 'screen-chat': img.src = chatUrl; break;
                                    case 'screen-voice': img.src = voiceUrl; break;
                                    case 'screen-translate': img.src = translateUrl; break;
                                    case 'screen-settings': img.src = settingsUrl; break;
                                    case 'tools': img.src = toolsUrl; break;
                                }
                            }
                            // settings dock
                            const sImg = b.querySelector('.settings-dock-icon') as HTMLImageElement | null;
                            if (sImg) {
                                switch (b.getAttribute('data-screen')) {
                                    case 'screen-account': sImg.src = accountUrl; break;
                                    case 'screen-appereance': sImg.src = appereanceUrl; break;
                                }
                            }
                        });
                        btn.classList.add('active');
                        // dock
                        const img = btn.querySelector('.dock-icon') as HTMLImageElement | null;
                        if (img) {
                            switch (btn.getAttribute('data-screen') || (btn.classList.contains('tools_button') ? 'tools' : '')) {
                                case 'screen-notes': img.src = notesActiveUrl; break;
                                case 'screen-chat': img.src = chatActiveUrl; break;
                                case 'screen-voice': img.src = voiceActiveUrl; break;
                                case 'screen-translate': img.src = translateActiveUrl; break;
                                case 'screen-settings': img.src = settingsActiveUrl; break;
                                case 'tools': img.src = toolsActiveUrl; break;
                            }
                        }
                        // settings dock
                        const sImg = btn.querySelector('.settings-dock-icon') as HTMLImageElement | null;
                        if (sImg) {
                            switch (btn.getAttribute('data-screen')) {
                                case 'screen-account': sImg.src = accountActiveUrl; break;
                                case 'screen-appereance': sImg.src = appereanceActiveUrl; break;
                            }
                        }
                        updateSettingsDockVisibility();
                        // --- сохраняем текущий экран ---
                        const screenId = btn.getAttribute('data-screen') || (btn.classList.contains('tools_button') ? 'screen-tools' : 'screen-home');
                        (this as any).currentScreen = screenId;
                    });
                });
                // Следим за изменением классов у .screen (например, при программном переключении)
                const screensToWatch = ['screen-settings', 'screen-account', 'screen-appereance'];
                screensToWatch.forEach(id => {
                    const el = iframeDoc.getElementById(id);
                    if (el) {
                        new MutationObserver(updateSettingsDockVisibility).observe(el, { attributes: true, attributeFilter: ['class'] });
                    }
                });

                // --- ВОССТАНАВЛИВАЕМ АКТИВНЫЙ ЭКРАН ---
                if (this.currentScreen && this.currentScreen !== 'screen-home') {
                    const allScreens = iframeDoc.querySelectorAll('.screen');
                    allScreens.forEach(screen => screen.classList.remove('active'));
                    const targetScreen = iframeDoc.getElementById(this.currentScreen);
                    if (targetScreen) targetScreen.classList.add('active');
                }

                // Микрофонная кнопка — управление напрямую через VoiceService
                const micToggleBtn = iframeDoc.getElementById('mic-toggle-btn');
                const micToggleIcon = iframeDoc.getElementById('mic-toggle-icon');
                const voiceOnUrl = chrome.runtime.getURL('public/voice-active.png');
                const voiceOffUrl = chrome.runtime.getURL('public/voice.png');
                let micBtnInteracted = false;
                function updateMicBtn() {
                    if (!micToggleBtn || !micToggleIcon) return;
                    micToggleIcon.innerHTML = '';
                    if (!micBtnInteracted) {
                        micToggleBtn.style.background = '#ff4444';
                    } else if (VoiceService.isListening()) {
                        micToggleBtn.style.background = '#ff4444';
                    } else {
                        micToggleBtn.style.background = '#1A1A1A';
                    }
                    if (VoiceService.isListening()) {
                        micToggleIcon.innerHTML = `<img src="${voiceOnUrl}" alt="mic on" style="width:32px;height:32px;object-fit:contain;display:block;" />`;
                    } else {
                        micToggleIcon.innerHTML = `
                            <img src="${voiceOffUrl}" alt="mic off" style="width:32px;height:32px;object-fit:contain;display:block;" />
                            <svg width="32" height="32" style="position:absolute;top:0;left:0;pointer-events:none;" xmlns="http://www.w3.org/2000/svg">
                                <line x1="6" y1="26" x2="26" y2="6" stroke="#ff4444" stroke-width="4" stroke-linecap="round" />
                            </svg>
                        `;
                    }
                }
                if (micToggleBtn && micToggleIcon) {
                    micToggleBtn.addEventListener('click', async () => {
                        micBtnInteracted = true;
                        if (VoiceService.isListening()) {
                            VoiceService.stopListening();
                        } else {
                            await VoiceService.startListening();
                        }
                        setTimeout(updateMicBtn, 100);
                    });
                    updateMicBtn();
                }

                const locationSelect = iframeDoc.getElementById('sidebar-location-select') as HTMLSelectElement | null;
                if (locationSelect) {
                    locationSelect.value = this.sidebarPosition;
                    locationSelect.addEventListener('change', (e) => {
                        const newPosition = (e.target as HTMLSelectElement).value as 'left' | 'right';
                        this.setSidebarPosition(newPosition);
                    });
                }

                // --- Icon location select logic ---
                const iconLocationSelect = iframeDoc.getElementById('icon-location-select') as HTMLSelectElement | null;
                if (iconLocationSelect) {
                    iconLocationSelect.value = this.floatingButtonPosition;
                    iconLocationSelect.addEventListener('change', (e) => {
                        const newPosition = (e.target as HTMLSelectElement).value as 'Bottom' | 'Top';
                        this.setFloatingButtonPosition(newPosition);
                    });
                }

                // --- Hide icon on logic ---
                const chipsList = iframeDoc.getElementById('hide-icon-chips-list');
                const addBtn = iframeDoc.getElementById('add-hide-icon-url-btn');
                const inputWrap = iframeDoc.getElementById('hide-icon-input-wrap');
                const input = iframeDoc.getElementById('hide-icon-input') as HTMLInputElement | null;
                const confirmBtn = iframeDoc.getElementById('hide-icon-input-confirm');

                const renderChips = () => {
                    if (!chipsList) return;
                    chipsList.innerHTML = '';
                    this.hideIconOn.forEach((url, idx) => {
                        const chip = iframeDoc.createElement('div');
                        chip.className = 'chip';
                        chip.innerHTML = `<span>${url}</span><button class="close-chip" data-idx="${idx}">&times;</button>`;
                        chipsList.appendChild(chip);
                    });
                    // Add remove listeners
                    chipsList.querySelectorAll('.close-chip').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const idx = +(btn as HTMLElement).getAttribute('data-idx')!;
                            this.hideIconOn.splice(idx, 1);
                            chrome.storage.local.set({ hideIconOn: this.hideIconOn });
                            renderChips();
                            this.initializeFloatingButton();
                        });
                    });
                };

                renderChips();

                if (addBtn && inputWrap && input && confirmBtn) {
                    addBtn.addEventListener('click', () => {
                        inputWrap.style.display = 'flex';
                        input.value = '';
                        input.focus();
                    });
                    confirmBtn.addEventListener('click', () => {
                        let val = input.value.trim();
                        // Попробуем извлечь домен через URL
                        let domain = '';
                        try {
                            if (!/^https?:\/\//.test(val)) val = 'https://' + val;
                            const urlObj = new URL(val);
                            domain = urlObj.hostname.replace(/^www\./, '');
                        } catch {
                            // Если невалидный URL, просто берем как есть, убираем www
                            domain = val.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
                        }
                        if (domain && !this.hideIconOn.includes(domain)) {
                            this.hideIconOn.push(domain);
                            chrome.storage.local.set({ hideIconOn: this.hideIconOn });
                            renderChips();
                            this.initializeFloatingButton();
                        }
                        inputWrap.style.display = 'none';
                    });
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            confirmBtn.click();
                        } else if (e.key === 'Escape') {
                            inputWrap.style.display = 'none';
                        }
                    });
                }

                // --- Theme select logic ---
                const themeSelect = iframeDoc.getElementById('theme-select') as HTMLSelectElement | null;

                // Helper to get current theme (light/dark)
                const getCurrentTheme = (theme: 'system' | 'light' | 'dark') => {
                    if (theme === 'system') {
                        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                    }
                    return theme;
                };

                const updateHomeScreenIcon = () => {
                    if (!iframeDoc) return;
                    const homeIcon = iframeDoc.getElementById('home-megan-icon') as HTMLImageElement;
                    if (!homeIcon) return;
                    homeIcon.src = iconUrl;
                };

                // Helper to update all dock and settings icons based on theme and active state
                const updateSidebarIcons = (theme: 'system' | 'light' | 'dark') => {
                    const currentTheme = getCurrentTheme(theme);
                    // Dock icons
                    const dockButtons = iframeDoc.querySelectorAll('.dock__btn, .tools_button');
                    dockButtons.forEach(btn => {
                        const img = btn.querySelector('.dock-icon') as HTMLImageElement | null;
                        if (!img) return;
                        const isActive = btn.classList.contains('active');
                        const screen = btn.getAttribute('data-screen') || (btn.classList.contains('tools_button') ? 'tools' : '');
                        if (currentTheme === 'light') {
                            switch (screen) {
                                case 'screen-notes': img.src = isActive ? notesActiveWhiteUrl : notesWhiteUrl; break;
                                case 'screen-chat': img.src = isActive ? chatActiveWhiteUrl : chatWhiteUrl; break;
                                case 'screen-voice': img.src = isActive ? voiceActiveWhiteUrl : voiceWhiteUrl; break;
                                case 'screen-translate': img.src = isActive ? translateActiveWhiteUrl : translateWhiteUrl; break;
                                case 'screen-settings': img.src = isActive ? settingsActiveWhiteUrl : settingsWhiteUrl; break;
                                case 'tools': img.src = isActive ? toolsActiveWhiteUrl : toolsWhiteUrl; break;
                            }
                        } else {
                            switch (screen) {
                                case 'screen-notes': img.src = isActive ? notesActiveUrl : notesUrl; break;
                                case 'screen-chat': img.src = isActive ? chatActiveUrl : chatUrl; break;
                                case 'screen-voice': img.src = isActive ? voiceActiveUrl : voiceUrl; break;
                                case 'screen-translate': img.src = isActive ? translateActiveUrl : translateUrl; break;
                                case 'screen-settings': img.src = isActive ? settingsActiveUrl : settingsUrl; break;
                                case 'tools': img.src = isActive ? toolsActiveUrl : toolsUrl; break;
                            }
                        }
                    });
                    // Settings dock icons
                    const settingsDockButtons = iframeDoc.querySelectorAll('.settings__dock__btn');
                    settingsDockButtons.forEach(btn => {
                        const img = btn.querySelector('.settings-dock-icon') as HTMLImageElement | null;
                        if (!img) return;
                        const isActive = btn.classList.contains('active');
                        const screen = btn.getAttribute('data-screen');
                        if (currentTheme === 'light') {
                            switch (screen) {
                                case 'screen-account': img.src = isActive ? accountActiveWhiteUrl : accountWhiteUrl; break;
                                case 'screen-appereance': img.src = isActive ? appereanceActiveWhiteUrl : appereanceWhiteUrl; break;
                            }
                        } else {
                            switch (screen) {
                                case 'screen-account': img.src = isActive ? accountActiveUrl : accountUrl; break;
                                case 'screen-appereance': img.src = isActive ? appereanceActiveUrl : appereanceUrl; break;
                            }
                        }
                    });
                };
                const setThemeClass = (theme: 'system' | 'light' | 'dark') => {
                    let t = theme;
                    if (t === 'system') {
                        t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                    }
                    iframeDoc.body.classList.remove('theme-light', 'theme-dark');
                    iframeDoc.body.classList.add('theme-' + t);
                    updateSidebarIcons(theme);
                    updateHomeScreenIcon();
                    this.updateFloatingButtonTheme();
                    // Синхронизируем тему на основном body для floating button
                    document.body.classList.remove('theme-light', 'theme-dark');
                    document.body.classList.add('theme-' + t);
                };
                if (themeSelect) {
                    themeSelect.value = this.theme;
                    setThemeClass(this.theme);
                    themeSelect.addEventListener('change', (e) => {
                        const newTheme = (e.target as HTMLSelectElement).value as 'system' | 'light' | 'dark';
                        this.theme = newTheme;
                        chrome.storage.local.set({ sidebarTheme: newTheme });
                        setThemeClass(newTheme);
                    });
                    // Listen to system theme changes if system selected
                    if (this.theme === 'system') {
                        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
                            setThemeClass('system');
                        });
                    }
                }
                // --- Update icons on dock button click ---
                const allDockButtons = iframeDoc.querySelectorAll('.dock__btn, .tools_button, .settings__dock__btn');
                allDockButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        allDockButtons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        updateSidebarIcons(this.theme);
                        updateSettingsDockVisibility();
                    });
                });

                // --- Icon toggle switch logic ---
                const iconSwitch = iframeDoc.querySelector('.switch input[type="checkbox"]') as HTMLInputElement | null;
                if (iconSwitch) {
                    // Инициализация состояния из chrome.storage.local
                    chrome.storage.local.get(['floatingButtonEnabled'], (result) => {
                        const enabled = result.floatingButtonEnabled !== false; // по умолчанию true
                        iconSwitch.checked = enabled;
                        this.toggleFloatingButton(enabled);
                    });
                    iconSwitch.addEventListener('change', () => {
                        const enabled = iconSwitch.checked;
                        chrome.storage.local.set({ floatingButtonEnabled: enabled });
                        this.toggleFloatingButton(enabled);
                    });
                }

                // --- Custom dropdown logic ---
                function setupCustomDropdown(
                    dropdownId: string,
                    selectId: string
                ) {
                    if (!iframeDoc) return;
                    const dropdown = iframeDoc.getElementById(dropdownId);
                    const selected = iframeDoc.getElementById(dropdownId + '-selected');
                    const list = iframeDoc.getElementById(dropdownId + '-list');
                    const select = iframeDoc.getElementById(selectId) as HTMLSelectElement | null;
                    if (!dropdown || !selected || !list || !select) return;
                    // Открытие/закрытие
                    selected.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdown.classList.toggle('open');
                    });
                    // Клик по опции
                    list.querySelectorAll('.custom-dropdown-option').forEach(opt => {
                        opt.addEventListener('click', () => {
                            const value = opt.getAttribute('data-value');
                            selected.textContent = opt.textContent;
                            if (value) select.value = value;
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                            dropdown.classList.remove('open');
                        });
                    });
                    // Клик вне — закрыть
                    iframeDoc.addEventListener('click', () => dropdown.classList.remove('open'));
                    // Синхронизация select -> кастом
                    select.addEventListener('change', () => {
                        const val = select.value;
                        const found = Array.from(list.querySelectorAll('.custom-dropdown-option')).find(opt => opt.getAttribute('data-value') === val);
                        if (found) selected.textContent = found.textContent;
                    });
                    // Инициализация значения
                    const val = select.value;
                    const found = Array.from(list.querySelectorAll('.custom-dropdown-option')).find(opt => opt.getAttribute('data-value') === val);
                    if (found) selected.textContent = found.textContent;
                }
                setupCustomDropdown('theme-dropdown', 'theme-select');
                setupCustomDropdown('icon-location-dropdown', 'icon-location-select');
                setupCustomDropdown('sidebar-location-dropdown', 'sidebar-location-select');
                setupCustomDropdown('language-dropdown', 'language-select');

                // --- Позиционирование dock и settings_dock ---
                function updateDockPositions(position: 'left' | 'right') {
                    if (!iframeDoc) return;
                    const dock = iframeDoc.querySelector('.dock') as HTMLElement | null;
                    const settingsDock = iframeDoc.querySelector('.settings_dock') as HTMLElement | null;
                    if (dock) {
                        if (position === 'left') {
                            dock.style.left = '0px';
                            dock.style.right = '';
                            dock.style.borderRadius = '0 56px 56px 0';
                        } else {
                            dock.style.right = '0px';
                            dock.style.left = '';
                            dock.style.borderRadius = '56px 0 0 56px';
                        }
                    }
                    if (settingsDock) {
                        if (position === 'left') {
                            settingsDock.style.right = '';
                            settingsDock.style.left = '420px';
                            settingsDock.style.borderRadius = '48px 0 0 48px';
                        } else {
                            settingsDock.style.left = '0px';
                            settingsDock.style.right = '';
                            settingsDock.style.borderRadius = '0 48px 48px 0';
                        }
                    }
                }
                updateDockPositions(this.sidebarPosition);

                // --- Language select logic ---
                const languageSelect = iframeDoc.getElementById('language-select') as HTMLSelectElement | null;
                if (languageSelect) {
                    languageSelect.value = this.language;

                    // Initialize custom dropdown with correct language
                    const dropdownSelected = iframeDoc.getElementById('language-dropdown-selected');
                    if (dropdownSelected) {
                        const selectedOption = languageSelect.options[languageSelect.selectedIndex];
                        dropdownSelected.textContent = selectedOption.textContent;
                        // Update the data-translate-key attribute to match the current language
                        const languageKey = this.language === 'en' ? 'english' : this.language === 'ru' ? 'russian' : 'spanish';
                        dropdownSelected.setAttribute('data-translate-key', languageKey);
                    }

                    languageSelect.addEventListener('change', (e) => {
                        const newLanguage = (e.target as HTMLSelectElement).value as Language;
                        this.language = newLanguage;
                        chrome.storage.local.set({ sidebarLanguage: newLanguage });

                        // Update TranslationService and all translations
                        TranslationService.setLanguage(newLanguage, iframeDoc);

                        // Update dropdown selected text
                        const dropdownSelected = iframeDoc.getElementById('language-dropdown-selected');
                        if (dropdownSelected) {
                            const selectedOption = languageSelect.options[languageSelect.selectedIndex];
                            dropdownSelected.textContent = selectedOption.textContent;
                            // Update the data-translate-key attribute
                            const languageKey = newLanguage === 'en' ? 'english' : newLanguage === 'ru' ? 'russian' : 'spanish';
                            dropdownSelected.setAttribute('data-translate-key', languageKey);
                        }

                        console.log('Language changed to:', newLanguage);
                    });
                }

                // --- Set avatar background according to theme ---
                function setAvatarBgByTheme() {
                    if (!iframeDoc) return;
                    const avatarDiv = iframeDoc.querySelector('.avatar') as HTMLElement | null;
                    if (!avatarDiv) return; function setAvatarBgByTheme() {
                        if (!iframeDoc) return;
                        const avatarDiv = iframeDoc.querySelector('.avatar') as HTMLElement | null;
                        if (!avatarDiv) return;
                        const body = iframeDoc.body;
                        if (body.classList.contains('theme-light')) {
                            avatarDiv.style.background = '#fff';
                        } else if (body.classList.contains('theme-dark')) {
                            avatarDiv.style.background = '#000';
                        } else {
                            // fallback: system
                            const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
                            avatarDiv.style.background = isLight ? '#fff' : '#000';
                        }
                    }
                    setAvatarBgByTheme();
                    const body = iframeDoc.body;
                    if (body.classList.contains('theme-light')) {
                        avatarDiv.style.background = '#fff';
                    } else if (body.classList.contains('theme-dark')) {
                        avatarDiv.style.background = '#000';
                    } else {
                        // fallback: system
                        const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
                        avatarDiv.style.background = isLight ? '#fff' : '#000';
                    }
                }
                setAvatarBgByTheme();
                // Listen for theme changes
                const observer = new MutationObserver(setAvatarBgByTheme);
                observer.observe(iframeDoc.body, { attributes: true, attributeFilter: ['class'] });

                // ... existing code ...
                TranslateService.initTranslate(iframeDoc);

                // --- Custom dropdowns for translate screen ---
                const srcSel = iframeDoc.getElementById('sourceLanguage') as HTMLSelectElement;
                const tgtSel = iframeDoc.getElementById('targetLanguage') as HTMLSelectElement;
                const srcDropdown = iframeDoc.getElementById('source-lang-dropdown');
                const srcDropdownSelected = iframeDoc.getElementById('source-lang-dropdown-selected');
                const srcDropdownList = iframeDoc.getElementById('source-lang-dropdown-list');
                const tgtDropdown = iframeDoc.getElementById('target-lang-dropdown');
                const tgtDropdownSelected = iframeDoc.getElementById('target-lang-dropdown-selected');
                const tgtDropdownList = iframeDoc.getElementById('target-lang-dropdown-list');

                if (srcDropdown && srcDropdownSelected && srcDropdownList && srcSel) {
                    // Fill custom dropdown for source
                    srcDropdownList.innerHTML = '';
                    languages.forEach(({ code, name }) => {
                        const opt = iframeDoc.createElement('div');
                        opt.className = 'custom-dropdown-option';
                        opt.setAttribute('data-value', code);
                        let displayName = name;
                        if (code !== 'auto') {
                            let key = '';
                            switch (code) {
                                case 'en': key = 'english'; break;
                                case 'zh': key = 'chinese'; break;
                                case 'hi': key = 'hindi'; break;
                                case 'es': key = 'spanish'; break;
                                case 'fr': key = 'french'; break;
                                case 'ar': key = 'arabic'; break;
                                case 'bn': key = 'bengali'; break;
                                case 'ru': key = 'russian'; break;
                                case 'pt': key = 'portuguese'; break;
                                case 'ur': key = 'urdu'; break;
                                case 'id': key = 'indonesian'; break;
                                case 'de': key = 'german'; break;
                                case 'ja': key = 'japanese'; break;
                                case 'sw': key = 'swahili'; break;
                                case 'mr': key = 'marathi'; break;
                                case 'te': key = 'telugu'; break;
                                case 'tr': key = 'turkish'; break;
                                case 'ta': key = 'tamil'; break;
                                case 'vi': key = 'vietnamese'; break;
                                case 'ko': key = 'korean'; break;
                                case 'fa': key = 'persian'; break;
                                case 'it': key = 'italian'; break;
                                case 'pl': key = 'polish'; break;
                                case 'uk': key = 'ukrainian'; break;
                                case 'ro': key = 'romanian'; break;
                                case 'nl': key = 'dutch'; break;
                                case 'th': key = 'thai'; break;
                                case 'gu': key = 'gujarati'; break;
                                case 'pa': key = 'punjabi'; break;
                                case 'ml': key = 'malayalam'; break;
                                case 'kn': key = 'kannada'; break;
                                case 'jv': key = 'javanese'; break;
                                case 'my': key = 'burmese'; break;
                                case 'el': key = 'greek'; break;
                                case 'hu': key = 'hungarian'; break;
                                case 'cs': key = 'czech'; break;
                                case 'sv': key = 'swedish'; break;
                                case 'fi': key = 'finnish'; break;
                                case 'no': key = 'norwegian'; break;
                                case 'da': key = 'danish'; break;
                                case 'he': key = 'hebrew'; break;
                                case 'sr': key = 'serbian'; break;
                                case 'sk': key = 'slovak'; break;
                                case 'bg': key = 'bulgarian'; break;
                                case 'hr': key = 'croatian'; break;
                                case 'lt': key = 'lithuanian'; break;
                                case 'sl': key = 'slovenian'; break;
                                case 'et': key = 'estonian'; break;
                                case 'lv': key = 'latvian'; break;
                                case 'fil': key = 'filipino'; break;
                                case 'kk': key = 'kazakh'; break;
                                case 'az': key = 'azerbaijani'; break;
                                case 'uz': key = 'uzbek'; break;
                                case 'am': key = 'amharic'; break;
                                case 'ne': key = 'nepali'; break;
                                case 'si': key = 'sinhala'; break;
                                case 'km': key = 'khmer'; break;
                                case 'lo': key = 'lao'; break;
                                case 'mn': key = 'mongolian'; break;
                                case 'hy': key = 'armenian'; break;
                                case 'ka': key = 'georgian'; break;
                                case 'sq': key = 'albanian'; break;
                                case 'bs': key = 'bosnian'; break;
                                case 'mk': key = 'macedonian'; break;
                                case 'af': key = 'afrikaans'; break;
                                case 'zu': key = 'zulu'; break;
                                case 'xh': key = 'xhosa'; break;
                                case 'st': key = 'sesotho'; break;
                                case 'yo': key = 'yoruba'; break;
                                case 'ig': key = 'igbo'; break;
                                case 'ha': key = 'hausa'; break;
                                case 'so': key = 'somali'; break;
                                case 'ps': key = 'pashto'; break;
                                case 'tg': key = 'tajik'; break;
                                case 'ky': key = 'kyrgyz'; break;
                                case 'tt': key = 'tatar'; break;
                                case 'be': key = 'belarusian'; break;
                                case 'eu': key = 'basque'; break;
                                case 'gl': key = 'galician'; break;
                                case 'ca': key = 'catalan'; break;
                                case 'is': key = 'icelandic'; break;
                                case 'ga': key = 'irish'; break;
                                case 'mt': key = 'maltese'; break;
                                case 'lb': key = 'luxembourgish'; break;
                                case 'fo': key = 'faroese'; break;
                                case 'cy': key = 'welsh'; break;
                                default: key = '';
                            }
                            if (key) {
                                displayName = TranslationService.translate(key);
                            }
                        }
                        opt.textContent = displayName;
                        opt.addEventListener('click', () => {
                            srcDropdownSelected.textContent = displayName;
                            srcSel.value = code;
                            srcSel.dispatchEvent(new Event('change', { bubbles: true }));
                            srcDropdown.classList.remove('open');
                        });
                        srcDropdownList.appendChild(opt);
                    });
                    // Open/close logic
                    srcDropdownSelected.addEventListener('click', (e) => {
                        e.stopPropagation();
                        srcDropdown.classList.toggle('open');
                    });
                    iframeDoc.addEventListener('click', () => srcDropdown.classList.remove('open'));
                    // Sync custom with select
                    srcSel.addEventListener('change', () => {
                        const found = Array.from(srcDropdownList.children).find(opt => opt.getAttribute('data-value') === srcSel.value);
                        if (found) srcDropdownSelected.textContent = found.textContent;
                    });
                    // Init
                    const found = Array.from(srcDropdownList.children).find(opt => opt.getAttribute('data-value') === srcSel.value);
                    if (found) srcDropdownSelected.textContent = found.textContent;
                }
                if (tgtDropdown && tgtDropdownSelected && tgtDropdownList && tgtSel) {
                    // Fill custom dropdown for target (exclude auto)
                    tgtDropdownList.innerHTML = '';
                    languages.filter(l => l.code !== 'auto').forEach(({ code, name }) => {
                        const opt = iframeDoc.createElement('div');
                        opt.className = 'custom-dropdown-option';
                        opt.setAttribute('data-value', code);
                        let displayName = name;
                        // --- та же логика, что и выше ---
                        if (code !== 'auto') {
                            let key = '';
                            switch (code) {
                                case 'en': key = 'english'; break;
                                case 'zh': key = 'chinese'; break;
                                case 'hi': key = 'hindi'; break;
                                case 'es': key = 'spanish'; break;
                                case 'fr': key = 'french'; break;
                                case 'ar': key = 'arabic'; break;
                                case 'bn': key = 'bengali'; break;
                                case 'ru': key = 'russian'; break;
                                case 'pt': key = 'portuguese'; break;
                                case 'ur': key = 'urdu'; break;
                                case 'id': key = 'indonesian'; break;
                                case 'de': key = 'german'; break;
                                case 'ja': key = 'japanese'; break;
                                case 'sw': key = 'swahili'; break;
                                case 'mr': key = 'marathi'; break;
                                case 'te': key = 'telugu'; break;
                                case 'tr': key = 'turkish'; break;
                                case 'ta': key = 'tamil'; break;
                                case 'vi': key = 'vietnamese'; break;
                                case 'ko': key = 'korean'; break;
                                case 'fa': key = 'persian'; break;
                                case 'it': key = 'italian'; break;
                                case 'pl': key = 'polish'; break;
                                case 'uk': key = 'ukrainian'; break;
                                case 'ro': key = 'romanian'; break;
                                case 'nl': key = 'dutch'; break;
                                case 'th': key = 'thai'; break;
                                case 'gu': key = 'gujarati'; break;
                                case 'pa': key = 'punjabi'; break;
                                case 'ml': key = 'malayalam'; break;
                                case 'kn': key = 'kannada'; break;
                                case 'jv': key = 'javanese'; break;
                                case 'my': key = 'burmese'; break;
                                case 'el': key = 'greek'; break;
                                case 'hu': key = 'hungarian'; break;
                                case 'cs': key = 'czech'; break;
                                case 'sv': key = 'swedish'; break;
                                case 'fi': key = 'finnish'; break;
                                case 'no': key = 'norwegian'; break;
                                case 'da': key = 'danish'; break;
                                case 'he': key = 'hebrew'; break;
                                case 'sr': key = 'serbian'; break;
                                case 'sk': key = 'slovak'; break;
                                case 'bg': key = 'bulgarian'; break;
                                case 'hr': key = 'croatian'; break;
                                case 'lt': key = 'lithuanian'; break;
                                case 'sl': key = 'slovenian'; break;
                                case 'et': key = 'estonian'; break;
                                case 'lv': key = 'latvian'; break;
                                case 'fil': key = 'filipino'; break;
                                case 'kk': key = 'kazakh'; break;
                                case 'az': key = 'azerbaijani'; break;
                                case 'uz': key = 'uzbek'; break;
                                case 'am': key = 'amharic'; break;
                                case 'ne': key = 'nepali'; break;
                                case 'si': key = 'sinhala'; break;
                                case 'km': key = 'khmer'; break;
                                case 'lo': key = 'lao'; break;
                                case 'mn': key = 'mongolian'; break;
                                case 'hy': key = 'armenian'; break;
                                case 'ka': key = 'georgian'; break;
                                case 'sq': key = 'albanian'; break;
                                case 'bs': key = 'bosnian'; break;
                                case 'mk': key = 'macedonian'; break;
                                case 'af': key = 'afrikaans'; break;
                                case 'zu': key = 'zulu'; break;
                                case 'xh': key = 'xhosa'; break;
                                case 'st': key = 'sesotho'; break;
                                case 'yo': key = 'yoruba'; break;
                                case 'ig': key = 'igbo'; break;
                                case 'ha': key = 'hausa'; break;
                                case 'so': key = 'somali'; break;
                                case 'ps': key = 'pashto'; break;
                                case 'tg': key = 'tajik'; break;
                                case 'ky': key = 'kyrgyz'; break;
                                case 'tt': key = 'tatar'; break;
                                case 'be': key = 'belarusian'; break;
                                case 'eu': key = 'basque'; break;
                                case 'gl': key = 'galician'; break;
                                case 'ca': key = 'catalan'; break;
                                case 'is': key = 'icelandic'; break;
                                case 'ga': key = 'irish'; break;
                                case 'mt': key = 'maltese'; break;
                                case 'lb': key = 'luxembourgish'; break;
                                case 'fo': key = 'faroese'; break;
                                case 'cy': key = 'welsh'; break;
                                default: key = '';
                            }
                            if (key) {
                                displayName = TranslationService.translate(key);
                            }
                        }
                        opt.textContent = displayName;
                        opt.addEventListener('click', () => {
                            tgtDropdownSelected.textContent = displayName;
                            tgtSel.value = code;
                            tgtSel.dispatchEvent(new Event('change', { bubbles: true }));
                            tgtDropdown.classList.remove('open');
                        });
                        tgtDropdownList.appendChild(opt);
                    });
                    // Open/close logic
                    tgtDropdownSelected.addEventListener('click', (e) => {
                        e.stopPropagation();
                        tgtDropdown.classList.toggle('open');
                    });
                    iframeDoc.addEventListener('click', () => tgtDropdown.classList.remove('open'));
                    // Sync custom with select
                    tgtSel.addEventListener('change', () => {
                        const found = Array.from(tgtDropdownList.children).find(opt => opt.getAttribute('data-value') === tgtSel.value);
                        if (found) tgtDropdownSelected.textContent = found.textContent;
                    });
                    // Init
                    const found = Array.from(tgtDropdownList.children).find(opt => opt.getAttribute('data-value') === tgtSel.value);
                    if (found) tgtDropdownSelected.textContent = found.textContent;
                }


                // --- Swap logic: update both selects and custom dropdowns ---
                const swapBtn = iframeDoc.getElementById('swapLangs');
                if (swapBtn && srcSel && tgtSel && srcDropdownSelected && tgtDropdownSelected && srcDropdownList && tgtDropdownList) {
                    swapBtn.addEventListener('click', () => {
                        if (srcSel.value === 'auto') return;
                        [srcSel.value, tgtSel.value] = [tgtSel.value, srcSel.value];
                        srcSel.dispatchEvent(new Event('change', { bubbles: true }));
                        tgtSel.dispatchEvent(new Event('change', { bubbles: true }));
                    });
                }

                // After TranslateService.initTranslate(iframeDoc);, add:
                const srcTxt = iframeDoc.getElementById('sourceText');
                const translateBtn = iframeDoc.getElementById('translateButton');
                const translatedTxt = iframeDoc.getElementById('translatedText');
                if (srcTxt && translateBtn) {
                    srcTxt.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            (translateBtn as HTMLElement).click();
                        }
                    });
                    // --- Auto-resize logic (fixed scroll) ---
                    srcTxt.addEventListener('input', function () {
                        this.style.height = 'auto';
                        const minHeight = Math.round(window.innerHeight * 0.10); // 10vh
                        const maxHeight = Math.round(window.innerHeight * 0.35); // 35vh
                        let newHeight = Math.max(this.scrollHeight, minHeight);
                        if (newHeight > maxHeight) newHeight = maxHeight;
                        this.style.height = newHeight + 'px';
                        this.style.overflowY = this.scrollHeight > maxHeight ? 'auto' : 'hidden';
                    });
                    // Инициализация при старте
                    srcTxt.dispatchEvent(new Event('input'));
                }
                // --- Auto-resize logic for translatedText ---
                if (translatedTxt) {
                    translatedTxt.addEventListener('input', function () {
                        this.style.height = 'auto';
                        const minHeight = Math.round(window.innerHeight * 0.10); // 10vh
                        const maxHeight = Math.round(window.innerHeight * 0.35); // 35vh
                        let newHeight = Math.max(this.scrollHeight, minHeight);
                        if (newHeight > maxHeight) newHeight = maxHeight;
                        this.style.height = newHeight + 'px';
                        this.style.overflowY = this.scrollHeight > maxHeight ? 'auto' : 'hidden';
                    });
                    // Инициализация при старте
                    translatedTxt.dispatchEvent(new Event('input'));
                }

                // // --- Улучшенная логика открытия tools-модалки по ховеру ---
                // const toolsButtonHoverBtn = iframeDoc.querySelector('.tools_button');
                // const toolsModalHoverModal = iframeDoc.getElementById('tools-modal');
                // let toolsModalHoverFlag = false;
                // let toolsButtonHoverFlag = false;
                // let toolsModalCloseTimeoutId: number | null = null;
                // if (toolsButtonHoverBtn && toolsModalHoverModal) {
                //     toolsButtonHoverBtn.addEventListener('mouseenter', () => {
                //         toolsButtonHoverFlag = true;
                //         if (toolsModalCloseTimeoutId) {
                //             clearTimeout(toolsModalCloseTimeoutId);
                //             toolsModalCloseTimeoutId = null;
                //         }
                //         if (!toolsModalHoverModal.classList.contains('active')) {
                //             toolsModalHoverModal.classList.add('active');
                //         }
                //     });
                //     toolsButtonHoverBtn.addEventListener('mouseleave', () => {
                //         toolsButtonHoverFlag = false;
                //         toolsModalCloseTimeoutId = window.setTimeout(() => {
                //             if (!toolsModalHoverFlag && !toolsButtonHoverFlag) {
                //                 toolsModalHoverModal.classList.remove('active');
                //             }
                //         }, 120);
                //     });
                //     toolsModalHoverModal.addEventListener('mouseenter', () => {
                //         toolsModalHoverFlag = true;
                //         if (toolsModalCloseTimeoutId) {
                //             clearTimeout(toolsModalCloseTimeoutId);
                //             toolsModalCloseTimeoutId = null;
                //         }
                //         if (!toolsModalHoverModal.classList.contains('active')) {
                //             toolsModalHoverModal.classList.add('active');
                //         }
                //     });
                //     toolsModalHoverModal.addEventListener('mouseleave', () => {
                //         toolsModalHoverFlag = false;
                //         toolsModalCloseTimeoutId = window.setTimeout(() => {
                //             if (!toolsModalHoverFlag && !toolsButtonHoverFlag) {
                //                 toolsModalHoverModal.classList.remove('active');
                //             }
                //         }, 120);
                //     });
                //     // Отключить клик
                //     toolsButtonHoverBtn.addEventListener('click', (e) => {
                //         e.preventDefault();
                //         e.stopPropagation();
                //     });
                // }

                const langDropdown = iframeDoc.getElementById('lang-modal-dropdown');
                const langSelected = iframeDoc.getElementById('lang-modal-dropdown-selected');
                const langList = iframeDoc.getElementById('lang-modal-dropdown-list');
                let selectedLang = 'en';

                // --- lang-modal-dropdown-list ---
                if (langList) {
                    langList.innerHTML = '';
                    languages
                        .filter(l => l.code !== 'auto')
                        .forEach(({ code, name }) => {
                            const opt = iframeDoc.createElement('div');
                            opt.className = 'custom-dropdown-option';
                            opt.setAttribute('data-value', code);
                            let displayName = name;
                            if (code !== 'auto') {
                                let key = '';
                                switch (code) {
                                    case 'en': key = 'english'; break;
                                    case 'zh': key = 'chinese'; break;
                                    case 'hi': key = 'hindi'; break;
                                    case 'es': key = 'spanish'; break;
                                    case 'fr': key = 'french'; break;
                                    case 'ar': key = 'arabic'; break;
                                    case 'bn': key = 'bengali'; break;
                                    case 'ru': key = 'russian'; break;
                                    case 'pt': key = 'portuguese'; break;
                                    case 'ur': key = 'urdu'; break;
                                    case 'id': key = 'indonesian'; break;
                                    case 'de': key = 'german'; break;
                                    case 'ja': key = 'japanese'; break;
                                    case 'sw': key = 'swahili'; break;
                                    case 'mr': key = 'marathi'; break;
                                    case 'te': key = 'telugu'; break;
                                    case 'tr': key = 'turkish'; break;
                                    case 'ta': key = 'tamil'; break;
                                    case 'vi': key = 'vietnamese'; break;
                                    case 'ko': key = 'korean'; break;
                                    case 'fa': key = 'persian'; break;
                                    case 'it': key = 'italian'; break;
                                    case 'pl': key = 'polish'; break;
                                    case 'uk': key = 'ukrainian'; break;
                                    case 'ro': key = 'romanian'; break;
                                    case 'nl': key = 'dutch'; break;
                                    case 'th': key = 'thai'; break;
                                    case 'gu': key = 'gujarati'; break;
                                    case 'pa': key = 'punjabi'; break;
                                    case 'ml': key = 'malayalam'; break;
                                    case 'kn': key = 'kannada'; break;
                                    case 'jv': key = 'javanese'; break;
                                    case 'my': key = 'burmese'; break;
                                    case 'el': key = 'greek'; break;
                                    case 'hu': key = 'hungarian'; break;
                                    case 'cs': key = 'czech'; break;
                                    case 'sv': key = 'swedish'; break;
                                    case 'fi': key = 'finnish'; break;
                                    case 'no': key = 'norwegian'; break;
                                    case 'da': key = 'danish'; break;
                                    case 'he': key = 'hebrew'; break;
                                    case 'sr': key = 'serbian'; break;
                                    case 'sk': key = 'slovak'; break;
                                    case 'bg': key = 'bulgarian'; break;
                                    case 'hr': key = 'croatian'; break;
                                    case 'lt': key = 'lithuanian'; break;
                                    case 'sl': key = 'slovenian'; break;
                                    case 'et': key = 'estonian'; break;
                                    case 'lv': key = 'latvian'; break;
                                    case 'fil': key = 'filipino'; break;
                                    case 'kk': key = 'kazakh'; break;
                                    case 'az': key = 'azerbaijani'; break;
                                    case 'uz': key = 'uzbek'; break;
                                    case 'am': key = 'amharic'; break;
                                    case 'ne': key = 'nepali'; break;
                                    case 'si': key = 'sinhala'; break;
                                    case 'km': key = 'khmer'; break;
                                    case 'lo': key = 'lao'; break;
                                    case 'mn': key = 'mongolian'; break;
                                    case 'hy': key = 'armenian'; break;
                                    case 'ka': key = 'georgian'; break;
                                    case 'sq': key = 'albanian'; break;
                                    case 'bs': key = 'bosnian'; break;
                                    case 'mk': key = 'macedonian'; break;
                                    case 'af': key = 'afrikaans'; break;
                                    case 'zu': key = 'zulu'; break;
                                    case 'xh': key = 'xhosa'; break;
                                    case 'st': key = 'sesotho'; break;
                                    case 'yo': key = 'yoruba'; break;
                                    case 'ig': key = 'igbo'; break;
                                    case 'ha': key = 'hausa'; break;
                                    case 'so': key = 'somali'; break;
                                    case 'ps': key = 'pashto'; break;
                                    case 'tg': key = 'tajik'; break;
                                    case 'ky': key = 'kyrgyz'; break;
                                    case 'tt': key = 'tatar'; break;
                                    case 'be': key = 'belarusian'; break;
                                    case 'eu': key = 'basque'; break;
                                    case 'gl': key = 'galician'; break;
                                    case 'ca': key = 'catalan'; break;
                                    case 'is': key = 'icelandic'; break;
                                    case 'ga': key = 'irish'; break;
                                    case 'mt': key = 'maltese'; break;
                                    case 'lb': key = 'luxembourgish'; break;
                                    case 'fo': key = 'faroese'; break;
                                    case 'cy': key = 'welsh'; break;
                                    default: key = '';
                                }
                                if (key) {
                                    displayName = TranslationService.translate(key);
                                }
                            }
                            opt.textContent = displayName;
                            langList.appendChild(opt);
                        });
                }

                // Генерируем список языков из массива languages
                if (langList) {
                    langList.innerHTML = '';
                    languages
                        .filter(l => l.code !== 'auto')
                        .forEach(l => {
                            const opt = iframeDoc.createElement('div');
                            opt.className = 'custom-dropdown-option';
                            opt.setAttribute('data-value', l.code);
                            opt.textContent = l.name;
                            langList.appendChild(opt);
                        });
                }

                // Навешиваем обработчики на кастомный dropdown
                if (langDropdown && langSelected && langList) {
                    langSelected.addEventListener('click', (e) => {
                        e.stopPropagation();
                        langDropdown.classList.toggle('open');
                    });
                    langList.querySelectorAll('.custom-dropdown-option').forEach(opt => {
                        opt.addEventListener('click', () => {
                            selectedLang = opt.getAttribute('data-value') || 'en';
                            langSelected.textContent = opt.textContent;
                            langDropdown.classList.remove('open');
                        });
                    });
                    iframeDoc.addEventListener('click', () => langDropdown.classList.remove('open'));
                }

                // --- После создания элементов аккаунта ---
                const userAvatar = iframeDoc.getElementById('user-avatar');
                const userName = iframeDoc.getElementById('user-name');
                const userEmail = iframeDoc.getElementById('user-email');
                const openAccountPage = () => {
                    window.open('https://yourmegan.me/account', '_blank');
                };
                if (userAvatar) userAvatar.style.cursor = 'pointer';
                if (userName) userName.style.cursor = 'pointer';
                if (userEmail) userEmail.style.cursor = 'pointer';
                if (userAvatar) userAvatar.addEventListener('click', openAccountPage);
                if (userName) userName.addEventListener('click', openAccountPage);
                if (userEmail) userEmail.addEventListener('click', openAccountPage);

                // Кнопка Activate (Pro)
                const activateBtn = iframeDoc.querySelector('.account-btn-pro') as HTMLElement | null;
                if (activateBtn) {
                    activateBtn.addEventListener('click', () => {
                        window.open('https://yourmegan.me/', '_blank');
                    });
                    activateBtn.style.cursor = 'pointer';
                }

                // --- ONBOARDING ---
                chrome.storage.local.get(['onboardingShown'], (result) => {
                    if (!result.onboardingShown) {
                        AuthService.getToken().then(token => {
                            if (token) {
                                this.showOnboarding(iframeDoc);
                            }
                        });
                    }
                });

                // ... existing code ...

                // --- Read page aloud button logic ---
                const readPageBtn = iframeDoc.getElementById('read-page-aloud-btn');
                if (readPageBtn) {
                    // Эффект нажатия через изменение background
                    const origBg = readPageBtn.style.background;
                    const origBoxShadow = readPageBtn.style.boxShadow;
                    // Цвета для light/dark
                    const getActiveBg = () => {
                        const body = iframeDoc.body;
                        if (body.classList.contains('theme-light')) {
                            return '#EDEDED'; // чуть темнее light
                        } else {
                            return '#212121'; // чуть темнее dark
                        }
                    };
                    readPageBtn.addEventListener('mousedown', () => {
                        readPageBtn.style.background = getActiveBg();
                        readPageBtn.style.boxShadow = '0 2px 8px #715cff33';
                    });
                    readPageBtn.addEventListener('mouseup', () => {
                        readPageBtn.style.background = origBg;
                        readPageBtn.style.boxShadow = origBoxShadow;
                    });
                    readPageBtn.addEventListener('mouseleave', () => {
                        readPageBtn.style.background = origBg;
                        readPageBtn.style.boxShadow = origBoxShadow;
                    });
                    readPageBtn.addEventListener('click', async () => {
                        // --- Проверка, нужно ли показывать предупреждение ---
                        chrome.storage.local.get(['readAloudWarningDisabled'], (result) => {
                            if (result.readAloudWarningDisabled) {
                                // --- Запуск озвучки без модалки ---
                                (async () => {
                                    let pageText = '';
                                    try {
                                        pageText = Array.from(document.body.querySelectorAll('*'))
                                            .filter(el => el.childNodes.length && (el as HTMLElement).offsetParent !== null)
                                            .map(el => el.textContent)
                                            .join(' ');
                                        pageText = pageText.replace(/\s+/g, ' ').trim();
                                    } catch (e) {
                                        pageText = document.title;
                                    }
                                    if (!pageText) pageText = document.title;
                                    const statusBubble = iframeDoc.getElementById('voice-status-bubble');
                                    showGlobalNotification(TranslationService.translate('text_synthesizing_wait'), 'success');
                                    try {
                                        const audioBase64 = await VoiceService.readTextAloud(pageText, TranslationService.getLanguage(), statusBubble || undefined);
                                        console.log('audioBase64:', audioBase64);
                                        if (audioBase64) {
                                            insertVoiceAudioPlayer(iframeDoc, audioBase64);
                                            showNotification(TranslationService.translate('voice_playback'), 'success');
                                        } else {
                                            showNotification(TranslationService.translate('could_not_synthesize_audio'), 'error');
                                        }
                                    } catch (err) {
                                        if (err && typeof err === 'object' && 'status' in err && err.status === 429) {
                                            showNotification(TranslationService.translate('tokens_exhausted'), 'error');
                                        } else {
                                            showNotification(TranslationService.translate('could_not_synthesize_audio'), 'error');
                                        }
                                    }
                                })();
                                return;
                            }

                            // --- Модальное предупреждение ---
                            let modal = iframeDoc.getElementById('read-aloud-warning-modal');
                            if (!modal) {
                                modal = iframeDoc.createElement('div');
                                modal.id = 'read-aloud-warning-modal';
                                modal.innerHTML = `
                                    <div class="tools-modal-overlay read-aloud-fade" style="z-index:2147483648;display:flex;justify-content:center;align-items:center;">
                                        <div class="modal-content tools-modal-content" style="max-width:400px;text-align:center;">
                                            <div id="read-aloud-warning-text" style="margin-bottom:24px;font-size:15px;line-height:1.6;"></div>
                                            <label style="display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:18px;cursor:pointer;font-size:14px;">
                                                <input type="checkbox" id="read-aloud-warning-checkbox" style="width:16px;height:16px;cursor:pointer;" />
                                                <span data-translate="dont_show_again">Don't show again</span>
                                            </label>
                                            <div style="display:flex;gap:18px;justify-content:center;">
                                                <button id="read-aloud-warning-ok" style="background:var(--color-active);color:#fff;padding:10px 32px;border:none;border-radius:8px;font-size:15px;cursor:pointer;box-shadow:0 2px 12px #715cff33;">OK</button>
                                                <button id="read-aloud-warning-cancel" style="background:var(--color-container);color:var(--color-text);border:1px solid var(--color-border);padding:10px 32px;border-radius:8px;font-size:15px;cursor:pointer;box-shadow:0 2px 12px #0002;">Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                    <style>
                                    .read-aloud-fade { opacity: 0; visibility: hidden; transition: opacity 0.25s, visibility 0.25s; }
                                    .read-aloud-fade.active { opacity: 1; visibility: visible; }
                                    </style>
                                `;
                                iframeDoc.body.appendChild(modal);
                            }
                            // Установить текст предупреждения с переводом
                            const warningText = iframeDoc.getElementById('read-aloud-warning-text');
                            if (warningText) warningText.textContent = TranslationService.translate('read_page_aloud_warning');
                            // Перевод для чекбокса
                            const dontShowAgainLabel = modal.querySelector('label span[data-translate="dont_show_again"]');
                            if (dontShowAgainLabel) dontShowAgainLabel.textContent = TranslationService.translate('dont_show_again');
                            // Плавное появление модалки
                            const overlay = modal.querySelector('.read-aloud-fade');
                            if (overlay) {
                                overlay.classList.remove('active');
                                // Триггерим reflow для анимации
                                void (overlay as HTMLElement).offsetWidth;
                                setTimeout(() => overlay.classList.add('active'), 10);
                            }
                            modal.style.display = 'flex';
                            // Кнопки и чекбокс
                            const okBtn = iframeDoc.getElementById('read-aloud-warning-ok');
                            const cancelBtn = iframeDoc.getElementById('read-aloud-warning-cancel');
                            const checkbox = iframeDoc.getElementById('read-aloud-warning-checkbox') as HTMLInputElement | null;
                            // Обработчик OK
                            if (okBtn) okBtn.onclick = async () => {
                                if (overlay) overlay.classList.remove('active');
                                setTimeout(() => { modal.style.display = 'none'; }, 250);
                                if (checkbox && checkbox.checked) {
                                    chrome.storage.local.set({ readAloudWarningDisabled: true });
                                }
                                let pageText = '';
                                try {
                                    pageText = Array.from(document.body.querySelectorAll('*'))
                                        .filter(el => el.childNodes.length && (el as HTMLElement).offsetParent !== null)
                                        .map(el => el.textContent)
                                        .join(' ');
                                    pageText = pageText.replace(/\s+/g, ' ').trim();
                                } catch (e) {
                                    pageText = document.title;
                                }
                                if (!pageText) pageText = document.title;
                                const statusBubble = iframeDoc.getElementById('voice-status-bubble');
                                showGlobalNotification(TranslationService.translate('text_synthesizing_wait'), 'success');
                                try {
                                    const audioBase64 = await VoiceService.readTextAloud(pageText, TranslationService.getLanguage(), statusBubble || undefined);
                                    if (audioBase64) {
                                        insertVoiceAudioPlayer(iframeDoc, audioBase64);
                                        showNotification(TranslationService.translate('voice_playback'), 'success');
                                    } else {
                                        showNotification(TranslationService.translate('could_not_synthesize_audio'), 'error');
                                    }
                                } catch (err) {
                                    if (err && typeof err === 'object' && 'status' in err && err.status === 429) {
                                        showNotification(TranslationService.translate('tokens_exhausted'), 'error');
                                    } else {
                                        showNotification(TranslationService.translate('could_not_synthesize_audio'), 'error');
                                    }
                                }
                            };
                            // Обработчик Cancel
                            if (cancelBtn) cancelBtn.onclick = () => {
                                if (overlay) overlay.classList.remove('active');
                                setTimeout(() => { modal.style.display = 'none'; }, 250);
                                if (checkbox && checkbox.checked) {
                                    chrome.storage.local.set({ readAloudWarningDisabled: true });
                                }
                            };
                        });
                    });
                }

                // --- CSS: исправить стили для #translatedText и #translatedText.expanded ---
                // Найти и заменить:
                // #translatedText { height: 0; opacity: 0; padding: 0 10px; overflow: hidden; ... }
                // #translatedText.expanded { height: 100px; opacity: 1; padding: 10px; ... }
                // на:
                // #translatedText {
                //   height: 0;
                //   opacity: 0;
                //   padding: 0 10px;
                //   overflow: hidden;
                //   transition: height .25s ease, opacity .25s ease, padding .25s ease;
                //   border: 1px solid var(--color-border);
                // }
                // #translatedText.expanded {
                //   height: auto !important;
                //   opacity: 1;
                //   padding: 10px;
                //   overflow-y: auto;
                //   min-height: 10vh;
                //   max-height: 35vh;
                //   resize: none;
                // }

                // --- JS: auto-resize для translatedText ---
                if (translatedTxt) {
                    function autoResizeTranslated() {
                        if (!translatedTxt) return;
                        translatedTxt.style.height = 'auto';
                        const minHeight = Math.round(window.innerHeight * 0.10); // 10vh
                        const maxHeight = Math.round(window.innerHeight * 0.35); // 35vh
                        let newHeight = Math.max(translatedTxt.scrollHeight, minHeight);
                        if (newHeight > maxHeight) newHeight = maxHeight;
                        translatedTxt.style.height = newHeight + 'px';
                        translatedTxt.style.overflowY = 'auto'; // всегда показывать скролл при необходимости
                    }
                    translatedTxt.addEventListener('input', autoResizeTranslated);
                    // auto-resize при каждом изменении value (например, после перевода)
                    const origSet = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(translatedTxt), 'value')?.set;
                    if (origSet) {
                        Object.defineProperty(translatedTxt, 'value', {
                            set(v) {
                                origSet.call(this, v);
                                autoResizeTranslated();
                            },
                            get() {
                                return this.textContent;
                            }
                        });
                    } else {
                        // fallback: MutationObserver
                        new MutationObserver(autoResizeTranslated).observe(translatedTxt, { attributes: true, childList: true, subtree: true });
                    }
                    // Инициализация при старте
                    autoResizeTranslated();
                }

                // ... существующий HTML ...
                // Найди строку:
                // </div> // конец .settings-scroll-area
                // и перед ней вставь:


                // ... JS-логика (после блока hide icon on logic) ...
                // --- Selection tooltip toggle logic ---
                const selectionTooltipSwitch = iframeDoc.getElementById('selection-tooltip-toggle') as HTMLInputElement | null;
                if (selectionTooltipSwitch) {
                    chrome.storage.local.get(['selectionTooltipEnabled'], (result) => {
                        const enabled = result.selectionTooltipEnabled !== false; // по умолчанию true
                        selectionTooltipSwitch.checked = enabled;
                    });
                    selectionTooltipSwitch.addEventListener('change', () => {
                        const enabled = selectionTooltipSwitch.checked;
                        chrome.storage.local.set({ selectionTooltipEnabled: enabled });
                    });
                }
                // --- Hide tooltip on logic ---
                const hideTooltipChipsList = iframeDoc.getElementById('hide-tooltip-chips-list');
                const addTooltipBtn = iframeDoc.getElementById('add-hide-tooltip-url-btn');
                const tooltipInputWrap = iframeDoc.getElementById('hide-tooltip-input-wrap');
                const tooltipInput = iframeDoc.getElementById('hide-tooltip-input') as HTMLInputElement | null;
                const tooltipConfirmBtn = iframeDoc.getElementById('hide-tooltip-input-confirm');
                let hideTooltipOn: string[] = [];
                const renderTooltipChips = () => {
                    if (!hideTooltipChipsList) return;
                    hideTooltipChipsList.innerHTML = '';
                    hideTooltipOn.forEach((url, idx) => {
                        const chip = iframeDoc.createElement('div');
                        chip.className = 'chip';
                        chip.innerHTML = `<span>${url}</span><button class="close-chip" data-idx="${idx}">&times;</button>`;
                        hideTooltipChipsList.appendChild(chip);
                    });
                    // Add remove listeners
                    hideTooltipChipsList.querySelectorAll('.close-chip').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const idx = +(btn as HTMLElement).getAttribute('data-idx')!;
                            hideTooltipOn.splice(idx, 1);
                            chrome.storage.local.set({ hideTooltipOn });
                            renderTooltipChips();
                        });
                    });
                };
                chrome.storage.local.get(['hideTooltipOn'], (result) => {
                    hideTooltipOn = Array.isArray(result.hideTooltipOn) ? result.hideTooltipOn : [];
                    renderTooltipChips();
                });
                if (addTooltipBtn && tooltipInputWrap && tooltipInput && tooltipConfirmBtn) {
                    addTooltipBtn.addEventListener('click', () => {
                        tooltipInputWrap.style.display = 'flex';
                        tooltipInput.value = '';
                        tooltipInput.focus();
                    });
                    tooltipConfirmBtn.addEventListener('click', () => {
                        let val = tooltipInput.value.trim();
                        let domain = '';
                        try {
                            if (!/^https?:\/\//.test(val)) val = 'https://' + val;
                            const urlObj = new URL(val);
                            domain = urlObj.hostname.replace(/^www\./, '');
                        } catch {
                            domain = val.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
                        }
                        if (domain && !hideTooltipOn.includes(domain)) {
                            hideTooltipOn.push(domain);
                            chrome.storage.local.set({ hideTooltipOn });
                            renderTooltipChips();
                        }
                        tooltipInputWrap.style.display = 'none';
                    });
                    tooltipInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            tooltipConfirmBtn.click();
                        } else if (e.key === 'Escape') {
                            tooltipInputWrap.style.display = 'none';
                        }
                    });
                }
            }

            // Устанавливаем src для загрузки iframe
            iframe.src = 'about:blank';
            this.sidebar = iframe;
            resolve();
        });
    }

    private finishOpeningSidebar(): void {
        setTimeout(() => {
            if (this.sidebar && this.sidebarContainer) {
                // Сохраняем оригинальные стили перед изменением
                this.saveOriginalStyles();

                // Применяем стили для сжатия контента
                this.applySidebarStyles();

                // Показываем сайдбар
                this.sidebarContainer.classList.add('open');
                if (this.sidebarPosition === 'left') {
                    (this.sidebar as HTMLElement).style.left = '0';
                } else {
                    (this.sidebar as HTMLElement).style.right = '0';
                }

                this.sidebarOpen = true;

                // Сдвигаем floating button к левой части сайдбара
                if (this.floatingContainer) {
                    if (this.sidebarPosition === 'left') {
                        this.floatingContainer.style.left = this.sidebarWidth;
                    } else {
                        this.floatingContainer.style.right = this.sidebarWidth;
                    }
                }

                // Update floating button state
                this.updateFloatingButtonState();

                // Принудительно вызываем событие resize для адаптации элементов
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 100);

                // Дополнительно через 300ms для завершения анимации
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 350);
            }
        }, 50);
    }

    public openSidebar(): void {
        if (!this.sidebar) {
            this.createSidebar().then(() => {
                this.finishOpeningSidebar();
            });
        } else {
            this.finishOpeningSidebar();
        }
    }

    public closeSidebar(): void {
        if (this.sidebar && this.sidebarContainer) {
            // Скрываем сайдбар
            this.sidebarContainer.classList.remove('open');
            if (this.sidebarPosition === 'left') {
                (this.sidebar as HTMLElement).style.left = `-${this.sidebarWidth}`;
            } else {
                (this.sidebar as HTMLElement).style.right = `-${this.sidebarWidth}`;
            }

            // Восстанавливаем оригинальные стили
            this.removeSidebarStyles();

            this.sidebarOpen = false;

            // Возвращаем floating button к правому краю
            if (this.floatingContainer) {
                if (this.sidebarPosition === 'left') {
                    this.floatingContainer.style.left = '0';
                } else {
                    this.floatingContainer.style.right = '0';
                }
            }

            // Update floating button state
            this.updateFloatingButtonState();

            // Принудительно вызываем событие resize
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
        }
    }

    public toggleSidebar(): void {
        this.updateFloatingButtonTheme();
        if (this.sidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    public isOpen(): boolean {
        return this.sidebarOpen;
    }

    public setSidebarPosition(position: 'left' | 'right'): void {
        if (this.sidebarPosition === position) return;
        const wasOpen = this.isOpen();

        // --- сохраняем активный экран перед удалением сайдбара ---
        if (this.sidebar) {
            const iframe = this.sidebar as HTMLIFrameElement;
            const iframeDoc = iframe.contentDocument;
            if (iframeDoc) {
                const activeScreen = iframeDoc.querySelector('.screen.active');
                if (activeScreen) {
                    this.currentScreen = activeScreen.id;
                }
            }
        }

        if (wasOpen) {
            this.removeSidebarStyles();
        }

        this.sidebarPosition = position;
        chrome.storage.local.set({ sidebarPosition: position });

        this.cleanup();
        this.initializeFloatingButton();

        if (wasOpen) {
            this.sidebarOpen = false;
            this.openSidebar();
        }
    }

    private saveOriginalStyles(): void {
        const elementsToModify = [
            document.documentElement,
            document.body,
            ...Array.from(document.body.children)
        ];

        elementsToModify.forEach(element => {
            this.originalStyles.set(element, element.getAttribute('style') || '');
        });
    }

    private restoreOriginalStyles(): void {
        this.originalStyles.forEach((originalStyle, element) => {
            if (originalStyle) {
                element.setAttribute('style', originalStyle);
            } else {
                element.removeAttribute('style');
            }
        });
    }

    public applySidebarStyles(): void {
        const contentWidth = `calc(100vw - ${this.sidebarWidth})`;

        if (this.sidebarPosition === 'left') {
            const bodyStyle = `
                position: relative !important;
                left: ${this.sidebarWidth} !important;
                width: ${contentWidth} !important;
                transition: left 0.3s ease, width 0.3s ease !important;
                box-sizing: border-box !important;
                overflow-x: hidden !important;
            `;
            document.body.style.cssText += bodyStyle;
            document.documentElement.style.cssText += `overflow-x: hidden !important;`;

        } else { // right
            // Стили для HTML и body
            const htmlStyle = `
                    width: ${contentWidth} !important;
                    max-width: ${contentWidth} !important;
                    overflow-x: hidden !important;
                    transition: width 0.3s ease !important;
                `;

            const bodyStyle = `
                    width: ${contentWidth} !important;
                    max-width: ${contentWidth} !important;
                    margin: 0 !important;
                    padding-right: 0 !important;
                    box-sizing: border-box !important;
                    overflow-x: hidden !important;
                    transition: width 0.3s ease !important;
                `;

            // Применяем стили
            document.documentElement.style.cssText += htmlStyle;
            document.body.style.cssText += bodyStyle;

            // Обрабатываем прямые дочерние элементы body
            Array.from(document.body.children).forEach((child: Element) => {
                if (child.id === 'chrome-extension-sidebar-container' ||
                    child.id === 'chrome-extension-floating-container') return;

                const element = child as HTMLElement;
                const computedStyle = window.getComputedStyle(element);

                // Сохраняем текущие стили если еще не сохранены
                if (!this.originalStyles.has(element)) {
                    this.originalStyles.set(element, element.getAttribute('style') || '');
                }

                // Применяем новые стили
                const newStyle = `
                        max-width: ${contentWidth} !important;
                        width: ${contentWidth} !important;
                        box-sizing: border-box !important;
                    `;

                element.style.cssText += newStyle;

                // Специальная обработка для фиксированных элементов
                if (computedStyle.position === 'fixed') {
                    element.style.maxWidth = contentWidth + ' !important';
                }
            });
        }


        // Adjust floating button position when sidebar is open
        if (this.floatingContainer) {
            if (this.sidebarPosition === 'left') {
                this.floatingContainer.style.left = this.sidebarWidth;
            } else {
                this.floatingContainer.style.right = this.sidebarWidth;
            }
        }
    }

    private removeSidebarStyles(): void {
        document.documentElement.classList.remove('extension-sidebar-open');
        this.restoreOriginalStyles();
        this.originalStyles.clear();

        // Возвращаем floating button к правому краю
        if (this.floatingContainer) {
            if (this.sidebarPosition === 'left') {
                this.floatingContainer.style.left = '0';
            } else {
                this.floatingContainer.style.right = '0';
            }
        }
    }

    public setFloatingButtonPosition(position: 'Bottom' | 'Top'): void {
        if (this.floatingButtonPosition === position) return;
        this.floatingButtonPosition = position;
        chrome.storage.local.set({ floatingButtonPosition: position });
        if (this.sidebarOpen) {
            this.removeSidebarStyles();
        }
        this.initializeFloatingButton();
        if (this.sidebarOpen) {
            this.openSidebar();
        }
    }

    // Вспомогательная функция для получения текущей темы (light/dark)
    private getCurrentTheme(): 'light' | 'dark' {
        if (this.theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        return this.theme;
    }

    // Обновление цвета floatingButton в зависимости от темы
    private updateFloatingButtonTheme(): void {
        if (!this.floatingButton || !this.floatingContainer) return;
        const theme = this.getCurrentTheme();
        const isLight = theme === 'light';

        this.floatingButton.style.background = isLight ? '#FAFAFA' : '#151515';
        if (isLight) {
            this.floatingButton.style.border = '1px solid #E9E9E9';
        } else {
            this.floatingButton.style.border = '2px solid rgba(255,255,255,0.08)';
        }

        // Update action buttons theme
        const updateActionButtonTheme = (buttonInfo: { button: HTMLElement, icon: HTMLImageElement }, iconName: string) => {
            if (buttonInfo) {
                buttonInfo.icon.src = chrome.runtime.getURL(`public/${iconName}${isLight ? '-white' : ''}.png`);
                buttonInfo.button.style.background = isLight ? '#FAFAFA' : '#232323';
                buttonInfo.button.style.border = isLight ? '1px solid #E9E9E9' : '1px solid #333';
            }
        };

        updateActionButtonTheme(this.actionButtons.chat, 'chat');
        updateActionButtonTheme(this.actionButtons.translate, 'translate');

        if (this.actionButtons.voice) {
            this.updateVoiceActionButtonState();
        }

        // Update hover shadow
        const styleElement = document.querySelector('style[data-floating-button-hover]');
        if (styleElement && styleElement.textContent) {
            if (isLight) {
                styleElement.textContent = styleElement.textContent.replace(
                    /box-shadow: 0 4px 12px rgba\(0,0,0,0\.15\)/g,
                    'box-shadow: 0 4px 12px rgba(0,0,0,0.1)'
                );
            } else {
                styleElement.textContent = styleElement.textContent.replace(
                    /box-shadow: 0 4px 12px rgba\(0,0,0,0\.1\)/g,
                    'box-shadow: 0 4px 12px rgba(0,0,0,0.15)'
                );
            }
        }
    }

    private updateVoiceActionButtonState(): void {
        if (!this.actionButtons.voice) return;

        const { button, icon } = this.actionButtons.voice;
        const isLight = this.getCurrentTheme() === 'light';
        const isListening = VoiceService.isListening();

        let iconFile;
        if (isLight) {
            iconFile = isListening ? 'voice-white-active.png' : 'voice-white.png';
        } else {
            iconFile = isListening ? 'voice-active.png' : 'voice.png';
        }

        icon.src = chrome.runtime.getURL(`public/${iconFile}`);

        if (isListening) {
            button.style.background = '#ff4444';
            button.style.border = '1px solid #ff4444';
        } else {
            button.style.background = isLight ? '#FAFAFA' : '#232323';
            button.style.border = isLight ? '1px solid #E9E9E9' : '1px solid #333';
        }
    }

    /**
     * Показывает или скрывает floatingButton
     * @param visible true — показать, false — скрыть
     */
    public toggleFloatingButton(visible: boolean): void {
        this.floatingButtonVisible = visible;
        if (visible) {
            this.initializeFloatingButton();
        } else {
            if (this.floatingContainer) {
                this.floatingContainer.remove();
                this.floatingContainer = null;
                this.floatingButton = null;
            }
        }
    }

    public navigateTo(screenId: string): void {
        this.currentScreen = screenId;
        if (!this.sidebarOpen) {
            this.openSidebar();
        }

        // Use a timeout to ensure the iframe is ready, especially if opening for the first time
        setTimeout(() => {
            if (!this.sidebar) return;
            const iframe = this.sidebar as HTMLIFrameElement;
            const iframeDoc = iframe.contentDocument;
            if (!iframeDoc) return;

            const button = iframeDoc.querySelector(`.dock__btn[data-screen="${screenId}"]`) as HTMLElement | null;
            if (button) {
                button.click();
            }
        }, this.sidebarOpen ? 0 : 400); // Wait longer if sidebar needs to open
    }

    private showOnboarding(iframeDoc: Document) {
        if (iframeDoc.getElementById('onboarding-modal')) return;
        // Создаём overlay для затемнения
        let overlay = iframeDoc.getElementById('onboarding-overlay') as HTMLElement | null;
        if (!overlay) {
            overlay = iframeDoc.createElement('div');
            overlay.id = 'onboarding-overlay';
            overlay.style.cssText = `
                position: fixed; left: 0; top: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.85); z-index: 2147483647; pointer-events: none; transition: background 0.2s;`;
            iframeDoc.body.appendChild(overlay);
        }
        const modal = iframeDoc.createElement('div');
        modal.id = 'onboarding-modal';
        modal.style.cssText = `
            position: fixed; z-index: 2147483648; top: 0; left: 0; width: 100vw; height: 100vh;
            background: none; display: flex; align-items: center; justify-content: center; pointer-events: none;`;
        iframeDoc.body.appendChild(modal);

        // Добавим стили для подсветки и dock
        if (!iframeDoc.getElementById('onboarding-highlight-style')) {
            const style = iframeDoc.createElement('style');
            style.id = 'onboarding-highlight-style';
            style.textContent = `
                .onboarding-highlight {
                    box-shadow: 0 0 0 4px #715CFF, 0 4px 16px #715cff99 !important;
                    z-index: 2147483648 !important;
                    position: relative;
                }
                .onboarding-dock-visible, .onboarding-tools-visible {
                    z-index: 2147483649 !important;
                    pointer-events: auto !important;
                    filter: none !important;
                }
            `;
            iframeDoc.head.appendChild(style);
        }

        let prevBtn: HTMLElement | null = null;
        let prevDock: HTMLElement | null = null;
        let prevToolsBtn: HTMLElement | null = null;

        const renderStep = (stepIdx: number) => {
            // Убрать подсветку с предыдущей кнопки и dock
            if (prevBtn) prevBtn.classList.remove('onboarding-highlight');
            if (prevDock) prevDock.classList.remove('onboarding-dock-visible');
            if (prevToolsBtn) prevToolsBtn.classList.remove('onboarding-tools-visible');
            modal.innerHTML = '';
            modal.style.pointerEvents = 'none';
            let step = this.onboardingSteps[stepIdx];
            let content = document.createElement('div');
            content.style.background = 'var(--color-container,#232323)';
            content.style.color = 'var(--color-text,#fff)';
            content.style.borderRadius = '18px';
            content.style.boxShadow = '0 8px 32px #0008';
            content.style.padding = '36px 32px 28px 32px';
            content.style.maxWidth = '340px';
            content.style.width = '100%';
            content.style.textAlign = 'center';
            content.style.border = '1px solid var(--color-border,#ececec)';
            content.style.position = 'fixed';
            content.style.zIndex = '2147483648';
            content.style.margin = '0';
            content.style.pointerEvents = 'auto';

            if (step.isWelcome) {
                // Приветствие — по центру
                overlay.style.background = 'rgba(0,0,0,0.65)';
                modal.style.justifyContent = 'center';
                modal.style.alignItems = 'center';
                content.innerHTML = `
                    <div style='font-size: 32px; margin-bottom: 12px;'>👋</div>
                    <h2 style='font-size: 24px; font-weight: 700; margin-bottom: 10px;'>${step.title}</h2>
                    <div style='font-size: 15px; margin-bottom: 24px; opacity: 0.85;'>${step.desc}</div>
                    <button id='onboarding-next-btn' style='background: #715CFF; color: #fff; border: none; border-radius: 8px; padding: 12px 0; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; max-width: 220px;'>Start tour</button>
                `;
                content.style.position = 'relative';
                content.style.left = '0';
                content.style.top = '0';
                modal.appendChild(content);
                const nextBtn = content.querySelector('#onboarding-next-btn');
                if (nextBtn) {
                    nextBtn.addEventListener('click', () => renderStep(stepIdx + 1));
                }
                prevBtn = null;
                prevDock = null;
                prevToolsBtn = null;
                return;
            }

            // Для остальных шагов — overlay темнее
            overlay.style.background = 'rgba(0,0,0,0.85)';
            modal.style.justifyContent = 'flex-start';
            modal.style.alignItems = 'flex-start';
            let btn: HTMLElement | null = null;
            let dock: HTMLElement | null = null;
            let toolsBtn: HTMLElement | null = null;
            dock = iframeDoc.querySelector('.dock') as HTMLElement | null;
            if (dock) dock.classList.add('onboarding-dock-visible');
            if (step.isTools) {
                toolsBtn = iframeDoc.querySelector('.tools_button') as HTMLElement | null;
                if (toolsBtn) toolsBtn.classList.add('onboarding-tools-visible');
                btn = toolsBtn;
            } else {
                btn = iframeDoc.querySelector(`.dock__btn[data-screen="${step.screenId}"]`) as HTMLElement | null;
            }
            if (btn) {
                btn.classList.add('onboarding-highlight');
                prevBtn = btn;
                prevDock = dock;
                prevToolsBtn = toolsBtn;
                // Позиционируем модалку справа или слева от кнопки
                const rect = btn.getBoundingClientRect();
                const sidebarDock = iframeDoc.querySelector('.dock') as HTMLElement | null;
                const dockLeft = sidebarDock && sidebarDock.style.left === '0px';
                const modalWidth = 340;
                const modalHeight = 220;
                let top = rect.top + rect.height / 2 - modalHeight / 2;
                top = Math.max(16, Math.min(window.innerHeight - modalHeight - 16, top));
                let left;
                if (dockLeft) {
                    // dock слева — модалка справа
                    left = rect.right + 16;
                } else {
                    // dock справа — модалка слева
                    left = rect.left - modalWidth - 16;
                }
                // Если не влезает — fallback в центр
                if (left < 0 || left + modalWidth > window.innerWidth) {
                    left = Math.max(0, (window.innerWidth - modalWidth) / 2);
                }
                content.style.position = 'fixed';
                content.style.left = left + 'px';
                content.style.top = top + 'px';
            } else {
                // fallback: по центру
                content.style.position = 'fixed';
                content.style.left = (window.innerWidth / 2 - 170) + 'px';
                content.style.top = (window.innerHeight / 2 - 110) + 'px';
            }
            content.innerHTML = `
                <div style='font-size: 32px; margin-bottom: 12px;'>${stepIdx} / ${this.onboardingSteps.length - 1}</div>
                <h2 style='font-size: 22px; font-weight: 700; margin-bottom: 10px;'>${step.title}</h2>
                <div style='font-size: 15px; margin-bottom: 24px; opacity: 0.85;'>${step.desc}</div>
                <button id='onboarding-next-btn' style='background: #715CFF; color: #fff; border: none; border-radius: 8px; padding: 12px 0; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; max-width: 220px;'>${stepIdx === this.onboardingSteps.length - 1 ? 'Finish' : 'Next'}</button>
            `;
            modal.appendChild(content);
            const nextBtn = content.querySelector('#onboarding-next-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (btn) btn.classList.remove('onboarding-highlight');
                    if (dock) dock.classList.remove('onboarding-dock-visible');
                    if (toolsBtn) toolsBtn.classList.remove('onboarding-tools-visible');
                    if (stepIdx === this.onboardingSteps.length - 1) {
                        modal.remove();
                        if (overlay) overlay.remove();
                        chrome.storage.local.set({ onboardingShown: true });
                    } else {
                        renderStep(stepIdx + 1);
                    }
                });
            }
        };
        renderStep(0);
    }
}

export function updateUserAvatar() {
    const avatarImg = document.getElementById('user-avatar') as HTMLImageElement | null;
    if (avatarImg) {
        avatarImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0b0b0'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M12 14c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z'/%3E%3C/svg%3E";
    }
}

async function fetchViaBackground(url: string, options: RequestInit): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                type: "NOTES_FETCH",
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

function loadUserData(doc: Document) {
    AuthService.getToken().then(token => {
        if (token) {
            const API_URL = import.meta.env.VITE_API_URL;
            fetchViaBackground(`${API_URL}/me`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(userData => {
                    const avatarImg = doc.getElementById('user-avatar') as HTMLImageElement | null;
                    if (avatarImg) {
                        avatarImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0b0b0'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M12 14c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z'/%3E%3C/svg%3E";
                    }
                    const nameDiv = doc.getElementById('user-name');
                    if (nameDiv) nameDiv.textContent = userData.name || '';
                    const emailDiv = doc.getElementById('user-email');
                    if (emailDiv) {
                        emailDiv.textContent = userData.email || '';
                        emailDiv.title = userData.email || '';
                    }
                });
        }
    });
}

// Делаем функцию глобальной для вызова из NavigationComponent
(window as any).loadUserData = loadUserData;

// Вставка плеера для озвучки сайта
function insertVoiceAudioPlayer(iframeDoc: Document, audioBase64: string) {
    // Добавляем стили только один раз
    if (!iframeDoc.getElementById('megan-voice-popup-audio-style')) {
        const style = iframeDoc.createElement('style');
        style.id = 'megan-voice-popup-audio-style';
        style.textContent = `
            .megan-voice-popup-audio-wrap {
                border-radius: 12px;
                box-shadow: 0 2px 8px #0002;
                margin: 18px auto 0 auto;
                max-width: 98%;
                background: transparent;
                padding: 0;
                overflow: hidden;
                min-height: 40px;
                min-width: 350px;
            }
            .megan-voice-popup-audio-wrap audio {
                width: 100%;
                background: transparent;
                outline: none;
                border-radius: 12px;
                box-shadow: none;
                display: block;
            }
            body.theme-dark .megan-voice-popup-audio-wrap audio {
                background: #232323;
                color-scheme: dark;
            }
            body.theme-dark .megan-voice-popup-audio-wrap audio::-webkit-media-controls-panel {
                background: #292929;
                border-radius: 12px;
            }
            body.theme-dark .megan-voice-popup-audio-wrap audio::-webkit-media-controls-current-time-display,
            body.theme-dark .megan-voice-popup-audio-wrap audio::-webkit-media-controls-time-remaining-display {
                color: #eee;
            }
            body.theme-light .megan-voice-popup-audio-wrap audio,
            body.theme-light .megan-voice-popup-audio-wrap audio::-webkit-media-controls-panel {
                background: #fff;
                color-scheme: light;
            }
            body.theme-light .megan-voice-popup-audio-wrap audio::-webkit-media-controls-current-time-display,
            body.theme-light .megan-voice-popup-audio-wrap audio::-webkit-media-controls-time-remaining-display {
                color: #232323;
            }
        `;
        iframeDoc.head.appendChild(style);
    }
    // Удаляем старый плеер
    let wrap = iframeDoc.getElementById('voice-audio-player-wrap');
    if (wrap) wrap.remove();
    wrap = iframeDoc.createElement('div');
    wrap.className = 'megan-voice-popup-audio-wrap';
    wrap.id = 'voice-audio-player-wrap';
    const audio = iframeDoc.createElement('audio');
    audio.id = 'voice-audio-player';
    audio.controls = true;
    audio.src = 'data:audio/mp3;base64,' + audioBase64;
    wrap.appendChild(audio);
    // Вставляем wrap после #voice-waveform-container
    const waveform = iframeDoc.getElementById('voice-waveform-container');
    if (waveform && waveform.parentNode) {
        waveform.parentNode.insertBefore(wrap, waveform.nextSibling);
    }
    // Автоматически воспроизводим аудио
    setTimeout(() => { try { audio.play(); } catch (e) { } }, 0);
}

// ... existing code ...
// Всплывающее уведомление в стиле content-enhanced.ts
function showNotification(message: string, type: 'success' | 'error' = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.megan-notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = 'megan-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483647;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: 'Poppins', 'Inter', Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        color: #fff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 1px solid;
        animation: meganNotificationSlideIn 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;

    if (type === 'success') {
        notification.style.background = '#10B981';
        notification.style.borderColor = '#059669';
    } else {
        notification.style.background = '#EF4444';
        notification.style.borderColor = '#DC2626';
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'meganNotificationSlideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}
// Добавить стили для анимации notification, если не добавлены
if (!document.getElementById('megan-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'megan-notification-styles';
    style.textContent = `
        @keyframes meganNotificationSlideIn {
            from { opacity: 0; transform: translateX(100%); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes meganNotificationSlideOut {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);
}
// ... existing code ...
// Использовать showNotification для ошибок/успеха TTS:
// В обработчике OK и автозапуске после вызова VoiceService.readTextAloud:
// if (audioBase64) { insertVoiceAudioPlayer(...); showNotification('Озвучка страницы готова!', 'success'); } else { showNotification('Ошибка озвучивания страницы', 'error'); }
// ... existing code ...

// Показывать notification о запуске TTS в основном окне, если sidebar в iframe
function showGlobalNotification(message: string, type: 'success' | 'error' = 'success') {
    try {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'SHOW_NOTIFICATION', message, notifType: type }, '*');
        } else {
            showNotification(message, type);
        }
    } catch (e) {
        showNotification(message, type);
    }
}