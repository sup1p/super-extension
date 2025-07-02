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
            if (!this.hideIconOn.includes('example.com')) {
                this.hideIconOn.push('example.com');
                chrome.storage.local.set({ hideIconOn: this.hideIconOn });
            }
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
        this.floatingButton.innerHTML = `
            <img id="floating-btn-avatar-img" src="${iconUrl}" alt="icon" style="width:28px;height:28px;object-fit:cover;display:block;border-radius:50%;margin:auto;" />
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
            `;
        } else {
            this.floatingContainer.style.cssText = commonStyles + `right: 0;`;
            this.floatingButton.style.cssText = buttonStyles + `
                border-radius: 22px 0 0 22px;
                border-right: none;
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
                                width: 100%;
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
                                right: 16px;
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
                                position:absolute; top:16px; right:24px;
                                background:#262626; color:#ccc; padding:8px 18px;
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
                                margin-top: 20px;
                            }

                            /* контейнер исходного текста для размещения кнопки */
                            .source-wrapper {
                                position: relative;
                            }
                            .translate-btn-inside {
                                position: absolute;
                                right: 12px;
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
                                width: calc(50% - 8px);
                                background: var(--color-container);
                                color: var(--color-active);
                                border: 1px solid var(--color-border);
                                border-radius: 8px;
                                font-weight: 600;
                                transition: background 0.2s, color 0.2s;
                            }
                            .page-translate-btn:hover {
                                background: var(--color-active);
                                color: #fff;
                            }

                            #back-to-notes {
                                background: var(--color-container);
                                color: var(--color-text);
                                border: none;
                                cursor: pointer;
                            }

                            #note-body {
                                min-height: 120px;
                                overflow: hidden;
                                resize: none;
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
                                justify-content: space-between;
                                align-items: center;
                                padding: 14px 16px;
                                border-bottom: 1px solid var(--color-border);
                                font-size: 14px;
                            }
                            .setting-item:last-child {
                                border-bottom: none;
                            }
                            .setting-item span {
                                color: var(--color-text);
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
                                border: 1.5px solid var(--color-active);
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
                                max-height: 70vh;
                                overflow-y: auto;
                                scrollbar-width: none; /* Firefox */
                            }
                            #notes-list::-webkit-scrollbar {
                                display: none; /* Chrome, Safari, Opera */
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
                            }
                            .notes-detail-body:focus {
                                border: 1.5px solid var(--color-active);
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
                                width: 160px;
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
                                scrollbar-width: thin;
                                scrollbar-color: var(--color-active) var(--color-container);
                            }
                            #chat-container::-webkit-scrollbar {
                                width: 7px;
                                background: var(--color-container);
                            }
                            #chat-container::-webkit-scrollbar-thumb {
                                background: var(--color-active);
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
                        </style>
                    `;

                // --- ICON URLS ---
                const iconUrl = chrome.runtime.getURL('public/icon.png');
                const iconWhiteUrl = chrome.runtime.getURL('public/icon-white-bg.png');
                const iconBlackUrl = chrome.runtime.getURL('public/icon-black-bg.png');

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
                            <button class="close-btn" id="close-sidebar">×</button>

                            <div id="screen-home" class="screen active">
                                <div class="megan-card" style="box-shadow: 0 8px 32px rgb(84, 57, 202); border-radius: 24px; padding: 40px 36px 32px 36px; max-width: 340px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 18px; border: 1px solid var(--color-border, #ececec); background: var(--color-bg);">
                                    <div class="avatar" style="width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                                        <img id="home-megan-icon" src="${iconUrl}" alt="Megan Icon" style="width: 48px; height: 48px; object-fit: contain; border-radius: 50%;" />
                                    </div>
                                    <h1 class="title gradient-text" style="font-family: 'Playfair Display', serif; font-size: 44px; font-weight: 700; margin-bottom: 0; text-align: center;">Megan</h1>
                                    <p class="intro" style="line-height: 1.6; font-size: 16px; color: var(--color-text, #232323); text-align: center; margin-top: 0; margin-bottom: 0; opacity: 0.85;"><span data-translate="megan_intro">Hello! I'm your AI assistant — Megan, here to help you work smarter and faster.</span><br><br><span data-translate="megan_capabilities">I can summarize, rewrite, translate, generate content and assist with research 24/7.</span><br><br><span class="gradient-text" style="font-family: 'Playfair Display', serif; font-weight: 700; font-size: 24px;" data-translate="lets_get_started">Let's get things done!</span></p>
                                </div>
                            </div>

                            <div id="screen-notes" class="screen">
                                <h1 class="title" data-translate="notes">Notes</h1>
                                <div class="notes-input-row" style="position: relative; display: flex; align-items: stretch; margin-bottom: 12px;">
                                    <textarea id="note-input" data-translate="note_placeholder" placeholder="What do you want to save?" class="notes-textarea"></textarea>
                                    <button id="save-note" class="notes-save-btn" data-translate="save">Save</button>
                                </div>
                                <input id="notes-search" type="text" data-translate="search" placeholder="Search" class="notes-search-input" />
                                <div id="notes-list"></div>
                            </div>

                            
                            <div id="screen-note-detail" class="screen" style="overflow-y: auto; max-height: 80vh;">
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
                                <div id="chat-container" style="flex: 1 1 0; display: flex; flex-direction: column; background: var(--color-bg); border-radius: 8px; overflow-y: auto; gap: 12px; margin-bottom: 16px; min-height: 0; max-height: 80vh; margin-right: 60px; margin-left: 4px;"></div>
                                <form id="chat-form" style="display: flex; flex-direction: column; gap: 0; align-items: stretch; margin-top: auto; width: 100%; position: relative;">
                                    <div class="chat-actions" style="display: flex; justify-content: flex-end; gap: 4px; margin-bottom: 4px;">
                                        <button type="button" id="chat-new" style="background: none; border: none; border-radius: 0; padding: 0; height: 40px; width: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><img src="${newChatUrl}" alt="New Chat" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;" /></button>
                                        <button type="button" id="chat-history" style="background: none; border: none; border-radius: 0; padding: 0; height: 40px; width: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><img src="${historyUrl}" alt="History" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;" /></button>
                                    </div>
                                    <div style="position: relative; width: 100%; display: flex; align-items: flex-end; gap: 8px;">
                                        <textarea id="chat-input" data-translate="chat_placeholder" placeholder="Ask whatever you want..." rows="1" style="width: 100%; min-width: 0; flex: 1; resize: none; border-radius: 12px; border: 1.5px solid var(--color-border); background: var(--color-container); color: var(--color-text); padding: 12px 80px 12px 14px; font-size: 15px; transition: border 0.2s; height: 100px; min-height: 100px; margin: 0 0 0 16px;"></textarea>
                                        <button type="submit" id="chat-send" style="position: absolute; right: 24px; bottom: 18px; background: #715CFF; color: #fff; border: none; border-radius: 10px; padding: 0 18px; height: 40px; font-weight: 600; font-size: 15px; cursor: pointer; z-index: 2;" data-translate="send">Send</button>
                                    </div>
                                </form>
                                <style>
                                    /* Стили только для чата */
                                    #chat-input:focus {
                                        border: 1.5px solid #A48FFF !important;
                                        outline: none;
                                    }
                                    #chat-container::-webkit-scrollbar {
                                        width: 8px;
                                        background: #232323;
                                    }
                                    #chat-container::-webkit-scrollbar-thumb {
                                        background: #333;
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
                                </style>
                            </div>

                            <div id="screen-voice" class="screen">
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
                                <h1 id="translate-top-row" data-translate="translate">Translate</h1>
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
                                    <div class="translate-top-row">
                                        <button id="translate-page-btn" class="page-translate-btn" data-translate="translate_webpage">Translate webpage •</button>
                                    </div>
                                    <div class="source-wrapper">
                                        <textarea id="sourceText" data-translate="type_here" placeholder="Type here..."></textarea>
                                        <button id="translateButton" class="translate-btn translate-btn-inside" data-translate="translate">Translate</button>
                                    </div>
                                    <textarea id="translatedText" readonly data-translate="translation_placeholder" placeholder="Translation will appear here..."></textarea>
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
                                            <div class="tool-icon-block">
                                                <span class="tool-icon"><img src="${translateUrl}" alt="Translate" style="width:32px;height:32px;object-fit:contain;display:block;" /></span>
                                                <div class="tool-label" data-translate="translate">Translate</div>
                                            </div>
                                            <div class="tool-icon-block">
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
                                    <div class="tools-section" style="margin-top:32px;">
                                        <div class="modal-title" style="font-size:20px;" data-translate="hotbar_tools">Hotbar tools</div>
                                        <div class="tools-section-title" data-translate="hotbar_tools_desc">Here is tools that is in your hotbar</div>
                                        <div class="tools-icons-row">
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
                            </div>

                            <div id="screen-account" class="screen">
                                <h1 class="title" data-translate="settings">Settings</h1>
                                <div style="padding: 0 32px 32px 32px; max-width: 340px; margin: 0 auto;">
                                    <h2 class="section-title" style="margin-bottom: 18px;" data-translate="account">Account</h2>
                                    <div style="background: var(--color-container); border-radius: 20px; border: 1px solid var(--color-border); padding: 20px 20px 16px 20px; display: flex; align-items: center; gap: 16px; margin-bottom: 28px;">
                                        <img id="user-avatar" class="account-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0b0b0'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M12 14c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z'%3E%3C/svg%3E" alt="avatar" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; background: #fff; border: 1px solid var(--color-border);" />
                                        <div style="display: flex; flex-direction: column;">
                                            <div id="user-name" class="account-name" style="font-size: 17px; font-weight: 600; color: var(--color-text); margin-bottom: 2px;"></div>
                                            <div id="user-email" class="account-email" style="font-size: 14px; color: #b0b0b0;"></div>
                                        </div>
                                    </div>
                                    <h2 class="section-title" style="margin-bottom: 18px;" data-translate="pro_plan">Pro plan</h2>
                                    <div style="background: var(--color-container); border-radius: 20px; border: 1px solid var(--color-border); padding: 20px 20px 16px 20px; margin-bottom: 28px;">
                                        <div style="font-size: 15px; color: #b0b0b0; margin-bottom: 10px;" data-translate="no_pro_plan">You have no pro plan yet!</div>
                                        <button class="account-btn account-btn-pro" style="color: #6F58D5; background: none; border: none; font-size: 15px; font-weight: 300; padding: 0; cursor: pointer; text-align: left;" data-translate="activate">Activate</button>
                                    </div>
                                    <h2 class="section-title" style="margin-bottom: 18px;" data-translate="actions">Actions</h2>
                                    <div style="background: var(--color-container); border-radius: 20px; border: 1px solid var(--color-border); padding: 0px 20px 0px 20px; margin-bottom: 28px;">
                                        <button id="logout-btn" class="account-btn account-btn-logout" style="max-width: 180px; background: none; color: #ff5252; border: none; border-radius: 20px; padding: 10px 0 10px 0px; font-size: 15px; font-weight: 300; cursor: pointer; text-align: left;" data-translate="logout">Logout</button>
                                    </div>
                                </div>
                            </div>

                            <div id="screen-appereance" class="screen">
                                <div style="padding: 0 60px; height: 100%;">
                                    <h1 class="title" data-translate="settings">Settings</h1>
                                    <div style="overflow-y: auto; height: calc(100% - 70px); padding-right: 8px; margin-right: -8px;">
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
                    const options = languages
                        .filter(l => l.code !== 'auto')
                        .map(l => `<option value="${l.code}">${l.name}</option>`) // без auto
                        .join('');
                    langModal.innerHTML = `
                      <div class="modal-content" style="max-width:320px;">
                        <div class="modal-header">
                          <div class="modal-title">Select language</div>
                          <button class="modal-close" id="close-lang-modal">×</button>
                        </div>
                        <div style="margin-bottom:18px;">
                          <select id="page-translate-lang-select" style="width:100%;padding:8px 12px;border-radius:8px;">
                            ${options}
                          </select>
                        </div>
                        <button id="page-translate-confirm" style="width:100%;background:#715CFF;color:#fff;padding:10px 0;border:none;border-radius:8px;font-size:16px;cursor:pointer;">Translate</button>
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
                    const closeLangModal = iframeDoc.getElementById('close-lang-modal');
                    if (closeLangModal) {
                        closeLangModal.addEventListener('click', () => {
                            langModal.classList.remove('active');
                        });
                    }
                    const confirmBtn = iframeDoc.getElementById('page-translate-confirm');
                    if (confirmBtn) {
                        confirmBtn.addEventListener('click', async () => {
                            const select = iframeDoc.getElementById('page-translate-lang-select') as HTMLSelectElement;
                            const lang = select.value;

                            const token = await AuthService.getToken();
                            console.log("START TRANSLATE PAGE!!!" + token);

                            // Запускаем режим перевода
                            PageTranslateService.startTranslation(lang, token || undefined);

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

                const updateHomeScreenIcon = (theme: 'system' | 'light' | 'dark') => {
                    if (!iframeDoc) return;
                    const homeIcon = iframeDoc.getElementById('home-megan-icon') as HTMLImageElement;
                    if (!homeIcon) return;
                    const currentTheme = getCurrentTheme(theme);
                    homeIcon.src = currentTheme === 'light' ? iconWhiteUrl : iconBlackUrl;
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
                    updateHomeScreenIcon(theme);
                    this.updateFloatingButtonTheme();
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
                        opt.textContent = name;
                        opt.addEventListener('click', () => {
                            srcDropdownSelected.textContent = name;
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
                        opt.textContent = name;
                        opt.addEventListener('click', () => {
                            tgtDropdownSelected.textContent = name;
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
                if (srcTxt && translateBtn) {
                    srcTxt.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            (translateBtn as HTMLElement).click();
                        }
                    });
                }

                // --- Улучшенная логика открытия tools-модалки по ховеру ---
                const toolsButtonHoverBtn = iframeDoc.querySelector('.tools_button');
                const toolsModalHoverModal = iframeDoc.getElementById('tools-modal');
                let toolsModalHoverFlag = false;
                let toolsButtonHoverFlag = false;
                let toolsModalCloseTimeoutId: number | null = null;
                if (toolsButtonHoverBtn && toolsModalHoverModal) {
                    toolsButtonHoverBtn.addEventListener('mouseenter', () => {
                        toolsButtonHoverFlag = true;
                        if (toolsModalCloseTimeoutId) {
                            clearTimeout(toolsModalCloseTimeoutId);
                            toolsModalCloseTimeoutId = null;
                        }
                        if (!toolsModalHoverModal.classList.contains('active')) {
                            toolsModalHoverModal.classList.add('active');
                        }
                    });
                    toolsButtonHoverBtn.addEventListener('mouseleave', () => {
                        toolsButtonHoverFlag = false;
                        toolsModalCloseTimeoutId = window.setTimeout(() => {
                            if (!toolsModalHoverFlag && !toolsButtonHoverFlag) {
                                toolsModalHoverModal.classList.remove('active');
                            }
                        }, 120);
                    });
                    toolsModalHoverModal.addEventListener('mouseenter', () => {
                        toolsModalHoverFlag = true;
                        if (toolsModalCloseTimeoutId) {
                            clearTimeout(toolsModalCloseTimeoutId);
                            toolsModalCloseTimeoutId = null;
                        }
                        if (!toolsModalHoverModal.classList.contains('active')) {
                            toolsModalHoverModal.classList.add('active');
                        }
                    });
                    toolsModalHoverModal.addEventListener('mouseleave', () => {
                        toolsModalHoverFlag = false;
                        toolsModalCloseTimeoutId = window.setTimeout(() => {
                            if (!toolsModalHoverFlag && !toolsButtonHoverFlag) {
                                toolsModalHoverModal.classList.remove('active');
                            }
                        }, 120);
                    });
                    // Отключить клик
                    toolsButtonHoverBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
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
}

export function updateUserAvatar(avatarUrl: string | null) {
    const avatarImg = document.getElementById('user-avatar') as HTMLImageElement | null;
    console.log('Avatar URL:', avatarUrl);
    console.log('Avatar element:', avatarImg);

    if (avatarImg) {
        avatarImg.src = avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
        console.log('New avatar src:', avatarImg.src);
    } else {
        console.error('Avatar element not found!');
    }
}

function loadUserData(doc: Document) {
    AuthService.getToken().then(token => {
        if (token) {
            const API_URL = import.meta.env.VITE_API_URL;
            fetch(`${API_URL}/me`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(response => response.json())
                .then(userData => {
                    const avatarImg = doc.getElementById('user-avatar') as HTMLImageElement | null;
                    if (avatarImg) {
                        if (userData.avatar) {
                            avatarImg.src = userData.avatar;
                        } else {
                            avatarImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0b0b0'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M12 14c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z'%3E%3C/svg%3E";
                        }
                    }
                    const nameDiv = doc.getElementById('user-name');
                    if (nameDiv) nameDiv.textContent = userData.name || '';
                    const emailDiv = doc.getElementById('user-email');
                    if (emailDiv) emailDiv.textContent = userData.email || '';
                });
        }
    });
}

// Делаем функцию глобальной для вызова из NavigationComponent
(window as any).loadUserData = loadUserData;