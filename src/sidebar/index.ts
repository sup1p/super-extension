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

export class Sidebar {
    private sidebar: HTMLElement | null = null;
    private sidebarContainer: HTMLElement | null = null;
    private floatingButton: HTMLElement | null = null;
    private originalStyles: Map<Element, string> = new Map();
    private sidebarOpen = false;
    private sidebarWidth = '480px';
    private sidebarPosition: 'left' | 'right' = 'right';
    private floatingButtonPosition: 'Bottom' | 'Top' = 'Bottom';
    private hideIconOn: string[] = [];
    private theme: 'system' | 'light' | 'dark' = 'system';

    constructor() {
        chrome.storage.local.get(['sidebarPosition', 'floatingButtonPosition', 'hideIconOn', 'sidebarTheme'], (result) => {
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
            if (this.floatingButton) this.floatingButton.remove();
            this.floatingButton = null;
            return;
        }
        // Remove existing button if it exists
        if (this.floatingButton) {
            this.floatingButton.remove();
        }

        // Create the floating button
        this.floatingButton = document.createElement('div');
        this.floatingButton.id = 'chrome-extension-floating-button';
        const iconUrl = chrome.runtime.getURL('public/icon.png');
        this.floatingButton.innerHTML = `
            <img id="floating-btn-avatar-img" src="${iconUrl}" alt="icon" style="width:28px;height:28px;object-fit:cover;display:block;border-radius:50%;margin:auto;" />
        `;

        const topValue = this.floatingButtonPosition === 'Top' ? '25%' : '75%';
        const commonStyles = `
            position: fixed;
            top: ${topValue};
            transform: translateY(-50%) scale(1);
            width: 44px;
            height: 44px;
            background: #151515;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: none;
            z-index: 2147483648;
            transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            color: white;
            user-select: none;
            border: 2px solid rgba(255,255,255,0.08);
            padding: 0;
            gap: 0;
            pointer-events: auto;
        `;

        if (this.sidebarPosition === 'left') {
            this.floatingButton.style.cssText = commonStyles + `
                left: 0;
                border-radius: 0 22px 22px 0;
                border-left: none;
            `;
        } else {
            this.floatingButton.style.cssText = commonStyles + `
                right: 0;
                border-radius: 22px 0 0 22px;
                border-right: none;
            `;
        }

        // Add click handler
        this.floatingButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleSidebar();
        });

        // Add the button to the page
        document.body.appendChild(this.floatingButton);
    }

    public cleanup(): void {
        if (this.floatingButton) {
            this.floatingButton.remove();
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

    private createSidebar(): void {
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
                            font-family: 'Inter', sans-serif;
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
                            box-shadow: 0 4px 24px rgba(0,0,0,.45);
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

                            box-shadow:0 4px 24px rgba(0,0,0,.45);
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
                    </style>
                `;

            // --- ICON URLS ---
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

            const summarizerUrl = chrome.runtime.getURL('public/summarizer.png');
            const simplifierUrl = chrome.runtime.getURL('public/simplifier.png');

            const historyUrl = chrome.runtime.getURL('public/history.png');
            const newChatUrl = chrome.runtime.getURL('public/new-chat.png');

            const accountUrl = chrome.runtime.getURL('public/account.png');
            const appereanceUrl = chrome.runtime.getURL('public/appereance.png');

            const accountActiveUrl = chrome.runtime.getURL('public/account-active.png');
            const appereanceActiveUrl = chrome.runtime.getURL('public/appereance-active.png');


            iframeDoc.body.innerHTML = `
                    <div class="sidebar">
                        <button class="close-btn" id="close-sidebar">×</button>

                        <div id="screen-home" class="screen active">
                            <h1 class="title">"Notitile"</h1>
                            <div class="avatar">😊</div>
                            <p class="intro">Hello! I'm your AI assistant — "notitile", here to help you work smarter and faster. I can summarize, rewrite, translate, generate content and assist with research 24/7. Let's get things done.</p>
                        </div>

                        <div id="screen-notes" class="screen">
                            <h1 class="title">Notes</h1>
                            <div class="notes-input-row" style="position: relative; display: flex; align-items: stretch; margin-bottom: 12px;">
                                <textarea id="note-input" placeholder="What do you want to save?" class="notes-textarea"></textarea>
                                <button id="save-note" class="notes-save-btn">Save</button>
                            </div>
                            <input id="notes-search" type="text" placeholder="Search" class="notes-search-input" />
                            <div id="notes-list"></div>
                        </div>

                        
                        <div id="screen-note-detail" class="screen" style="overflow-y: auto; max-height: 80vh;">
                            <h1 class="title">Notes</h1>
                            <div class="notes-detail-header">
                                <button id="back-to-notes" class="notes-detail-back">← Back</button>
                                <div class="notes-detail-btns">
                                    <button id="update-note" class="notes-detail-btn">Save</button>
                                    <button id="delete-note" class="notes-detail-btn notes-detail-btn-delete">Delete</button>
                                </div>
                            </div>
                            <div class="notes-detail-container">
                                <input id="note-title" placeholder="Title" class="notes-detail-title">
                                <textarea id="note-body" class="notes-detail-body"></textarea>
                            </div>
                        </div>

                        <div id="screen-chat" class="screen">
                            <h1 class="title">Chat</h1>
                            <div id="chat-container" style="flex: 1 1 0; display: flex; flex-direction: column; background: var(--color-bg); border-radius: 8px; overflow-y: auto; gap: 12px; margin-bottom: 16px; min-height: 0; max-height: 80vh; margin-right: 72px; margin-left: 4px;"></div>
                            <form id="chat-form" style="display: flex; flex-direction: column; gap: 0; align-items: stretch; margin-top: auto; width: 100%; position: relative;">
                                <div class="chat-actions" style="display: flex; justify-content: flex-end; gap: 4px; margin-bottom: 4px;">
                                    <button type="button" id="chat-new" style="background: none; border: none; border-radius: 0; padding: 0; height: 40px; width: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><img src="${newChatUrl}" alt="New Chat" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;" /></button>
                                    <button type="button" id="chat-history" style="background: none; border: none; border-radius: 0; padding: 0; height: 40px; width: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><img src="${historyUrl}" alt="History" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;" /></button>
                                </div>
                                <div style="position: relative; width: 100%; display: flex; align-items: flex-end; gap: 8px;">
                                    <textarea id="chat-input" placeholder="Ask whatever you want..." rows="1" style="width: 100%; min-width: 0; flex: 1; resize: none; border-radius: 12px; border: 1.5px solid var(--color-border); background: var(--color-container); color: var(--color-text); padding: 12px 80px 12px 14px; font-size: 15px; transition: border 0.2s; height: 100px; min-height: 100px; margin: 0 0 0 16px;"></textarea>
                                    <button type="submit" id="chat-send" style="position: absolute; right: 24px; bottom: 18px; background: #715CFF; color: #fff; border: none; border-radius: 10px; padding: 0 18px; height: 40px; font-weight: 600; font-size: 15px; cursor: pointer; z-index: 2;">Send</button>
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
                            <h1 class="title">Let's talk!</h1>
                            <button id="mic-toggle-btn" style="margin-bottom: 18px; background: #1A1A1A; color: #fff; border: none; border-radius: 50%; width: 56px; height: 56px; font-size: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; position: relative;">
                                <span id="mic-toggle-icon" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; position: relative;"></span>
                            </button>
                            <p id="voice-status-bubble">I'm waiting to hear your pretty voice!</p>
                            <div id="voice-waveform-container">
                                <!-- Bars will be generated by JS -->
                            </div>
                            <p id="voice-result"></p>
                        </div>

                        <div id="screen-translate" class="screen">
                            <h1 id="translate-top-row ">Translate</h1>


                            <div class="translate-lang-row">
                                <select id="sourceLanguage" class="language-select"></select>
                                <span id="swapLangs" title="Swap languages">↔</span>
                                <select id="targetLanguage" class="language-select"></select>
                            </div>


                            <div class="translate-top-row">
                                <button id="translate-page-btn" class="page-translate-btn">Translate webpage •</button>
                            </div>

                            <div class="source-wrapper">
                                <textarea id="sourceText" placeholder="Type here..."></textarea>
                                <button id="translateButton" class="translate-btn translate-btn-inside">Translate</button>
                            </div>

                            <textarea id="translatedText" readonly placeholder="Translation will appear here..."></textarea>
                        </div>

                        <div id="screen-tools" class="screen">
                        </div>

                        <div id="tools-modal" class="tools-modal-overlay">
                            <div class="modal-content tools-modal-content">
                                <div class="modal-header">
                                    <div class="modal-title">All tools</div>
                                </div>
                                <div class="tools-section">
                                    <div class="tools-section-title">Here is the all available tools</div>
                                    <div class="tools-icons-row">
                                        <div class="tool-icon-block">
                                            <span class="tool-icon"><img src="${translateUrl}" alt="Translate" style="width:32px;height:32px;object-fit:contain;display:block;" /></span>
                                            <div class="tool-label">Translate</div>
                                        </div>
                                        <div class="tool-icon-block">
                                            <span class="tool-icon"><img src="${summarizerUrl}" alt="Summarize" style="width:32px;height:32px;object-fit:contain;display:block;" /></span>
                                            <div class="tool-label">Summarize</div>
                                        </div>
                                        <div class="tool-icon-block disabled-tool">
                                            <span class="tool-icon" style="position: relative; display: flex; align-items: center; justify-content: center;">
                                                <img src="${simplifierUrl}" alt="Simplify" style="width:32px;height:32px;object-fit:contain;display:block;opacity:0.4;" />
                                                <svg width="32" height="32" style="position:absolute;top:0;left:0;pointer-events:none;" xmlns="http://www.w3.org/2000/svg">
                                                    <line x1="4" y1="28" x2="28" y2="4" stroke="#ff4444" stroke-width="2.5" stroke-linecap="round" />
                                                </svg>
                                            </span>
                                            <div class="tool-label" style="color: #888;">Soon</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="tools-section" style="margin-top:32px;">
                                    <div class="modal-title" style="font-size:20px;">Hotbar tools</div>
                                    <div class="tools-section-title">Here is tools that is in your hotbar</div>
                                    <div class="tools-icons-row">
                                        <div class="tool-icon-block disabled-tool">
                                             <span class="tool-icon" style="position: relative; display: flex; align-items: center; justify-content: center;">
                                                <img src="${simplifierUrl}" alt="Simplify" style="width:32px;height:32px;object-fit:contain;display:block;opacity:0.4;" />
                                                <svg width="32" height="32" style="position:absolute;top:0;left:0;pointer-events:none;" xmlns="http://www.w3.org/2000/svg">
                                                    <line x1="4" y1="28" x2="28" y2="4" stroke="#ff4444" stroke-width="2.5" stroke-linecap="round" />
                                                </svg>
                                            </span>
                                            <div class="tool-label" style="color: #888;">Soon</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="screen-settings" class="screen">
                            <h1 class="title">Settings</h1>
                        </div>

                        <div id="screen-account" class="screen">
                            <h1 class="title">Settings</h1>
                            <div class="account-section">
                                <div class="account-card">
                                    <div class="account-card-title">Account</div>
                                    <div class="account-card-content">
                                        <img id="user-avatar" class="account-avatar" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0b0b0'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M12 14c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z'/%3E%3C/svg%3E" alt="avatar" />
                                        <div class="account-info">
                                            <div id="user-name" class="account-name"></div>
                                            <div id="user-email" class="account-email"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="account-card">
                                    <div class="account-card-title">Pro plan</div>
                                    <div class="account-card-content account-pro">
                                        <div class="account-pro-text">You have no pro plan yet!</div>
                                        <a href="#" class="account-btn account-btn-pro">Activate</a>
                                    </div>
                                </div>
                                <button id="logout-btn" class="account-btn account-btn-logout">Logout</button>
                            </div>
                        </div>

                        <div id="screen-appereance" class="screen">
                            <div style="padding: 0 60px; height: 100%;">
                                <h1 class="title">Settings</h1>
                                <div style="overflow-y: auto; height: calc(100% - 70px); padding-right: 8px; margin-right: -8px;">
                                    <div class="settings-section">
                                        <h2 class="section-title">Appereance</h2>
                                        <div class="settings-group">
                                            <div class="setting-item">
                                                <span>Theme</span>
                                                <select id="theme-select">
                                                    <option value="system">System</option>
                                                    <option value="light">Light</option>
                                                    <option value="dark">Dark</option>
                                                </select>
                                            </div>
                                            <div class="setting-item">
                                                <span>Zoom</span>
                                                <select>
                                                    <option>100%</option>
                                                    <option>90%</option>
                                                    <option>110%</option>
                                                    <option>125%</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                
                                    <div class="settings-section">
                                        <div class="section-title-container">
                                            <h2 class="section-title">Icon</h2>
                                            <label class="switch">
                                                <input type="checkbox" checked>
                                                <span class="slider round"></span>
                                            </label>
                                        </div>
                                        <div class="settings-group">
                                             <div class="setting-item">
                                                <span>Location</span>
                                                <select id="icon-location-select">

                                                    <option value="Bottom">Bottom</option>
                                                    <option value="Top">Top</option>
                                                    
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                
                                    <div class="settings-section">
                                        <div style="display: flex; align-items: center; justify-content: space-between;">
                                            <h2 class="section-title" style="margin-bottom: 0;">Hide icon on</h2>
                                            <button id="add-hide-icon-url-btn" class="add-hide-icon-btn">+</button>
                                        </div>
                                        <div id="hide-icon-chips-list" style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;"></div>
                                        <div id="hide-icon-input-wrap" style="margin-top: 10px; display: none;">
                                            <input id="hide-icon-input" type="text" placeholder="example.com" class="hide-icon-input" />
                                            <button id="hide-icon-input-confirm" class="hide-icon-input-confirm">Add</button>
                                        </div>
                                    </div>
                                
                                    <div class="settings-section">
                                        <h2 class="section-title">Sidebar</h2>
                                        <div class="settings-group">
                                             <div class="setting-item">
                                                <span>Location</span>
                                                <select id="sidebar-location-select">
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
                    <div style="margin-top:18px;color:#fff;font-size:18px;font-weight:500;letter-spacing:0.5px;">Loading... , please wait</div>
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
            const setThemeClass = (theme: 'system' | 'light' | 'dark') => {
                let t = theme;
                if (t === 'system') {
                    t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                }
                iframeDoc.body.classList.remove('theme-light', 'theme-dark');
                iframeDoc.body.classList.add('theme-' + t);
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
        };

        // Устанавливаем src для загрузки iframe
        iframe.src = 'about:blank';
        this.sidebar = iframe;
    }

    public openSidebar(): void {
        if (!this.sidebar) {
            this.createSidebar();
        }

        setTimeout(() => {
            if (this.sidebar) {
                // Сохраняем оригинальные стили перед изменением
                this.saveOriginalStyles();

                // Применяем стили для сжатия контента
                this.applySidebarStyles();

                // Показываем сайдбар
                this.sidebar.classList.add('open');
                if (this.sidebarPosition === 'left') {
                    (this.sidebar as HTMLElement).style.left = '0';
                } else {
                    (this.sidebar as HTMLElement).style.right = '0';
                }

                this.sidebarOpen = true;

                // Сдвигаем floating button к левой части сайдбара
                if (this.floatingButton) {
                    if (this.sidebarPosition === 'left') {
                        this.floatingButton.style.left = this.sidebarWidth;
                    } else {
                        this.floatingButton.style.right = this.sidebarWidth;
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

    public closeSidebar(): void {
        if (this.sidebar) {
            // Скрываем сайдбар
            this.sidebar.classList.remove('open');
            if (this.sidebarPosition === 'left') {
                (this.sidebar as HTMLElement).style.left = `-${this.sidebarWidth}`;
            } else {
                (this.sidebar as HTMLElement).style.right = `-${this.sidebarWidth}`;
            }

            // Восстанавливаем оригинальные стили
            this.removeSidebarStyles();

            this.sidebarOpen = false;

            // Возвращаем floating button к правому краю
            if (this.floatingButton) {
                if (this.sidebarPosition === 'left') {
                    this.floatingButton.style.left = '0';
                } else {
                    this.floatingButton.style.right = '0';
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
                    child.id === 'chrome-extension-floating-button') return;

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
        if (this.floatingButton) {
            if (this.sidebarPosition === 'left') {
                this.floatingButton.style.left = this.sidebarWidth;
            } else {
                this.floatingButton.style.right = this.sidebarWidth;
            }
        }
    }

    private removeSidebarStyles(): void {
        document.documentElement.classList.remove('extension-sidebar-open');
        this.restoreOriginalStyles();
        this.originalStyles.clear();

        // Возвращаем floating button к правому краю
        if (this.floatingButton) {
            if (this.sidebarPosition === 'left') {
                this.floatingButton.style.left = '0';
            } else {
                this.floatingButton.style.right = '0';
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
            fetch('http://localhost:8000/me', { headers: { 'Authorization': `Bearer ${token}` } })
                .then(response => response.json())
                .then(userData => {
                    const avatarImg = doc.getElementById('user-avatar') as HTMLImageElement | null;
                    if (avatarImg) {
                        if (userData.avatar) {
                            avatarImg.src = userData.avatar;
                        } else {
                            avatarImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0b0b0'%3E%3Ccircle cx='12' cy='8' r='4'/%3E%3Cpath d='M12 14c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z'/%3E%3C/svg%3E";
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