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

    constructor() {
        this.initializeFloatingButton();
    }

    public initializeFloatingButton(): void {
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




        // Apply styles to the floating button
        this.floatingButton.style.cssText = `
            position: fixed;
            top: 50%;
            right: 0;
            transform: translateY(-50%) scale(1);
            width: 44px;
            height: 44px;
            background: #151515;
            border-radius: 22px 0 0 22px;
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
            border-right: none;
            padding: 0;
            gap: 0;
            pointer-events: auto;
        `;

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
        }
        if (this.sidebarContainer) {
            this.sidebarContainer.remove();
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
        iframe.style.cssText = `
                position: fixed;
                top: 0;
                right: -25vw;
                width: 25vw;
                height: 100vh;
                border: none;
                z-index: 2147483647;
                transition: right 0.3s ease;
                box-shadow: -2px 0 10px rgba(0,0,0,0.1);
                background: white;
            `;

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
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        
                        body {
                            font-family: 'Inter', sans-serif;
                            background: #000;
                            color: #fff;
                            height: 100vh;
                            overflow: hidden;
                        }
                        
                        .sidebar {
                            position: relative;
                            width: 100%;
                            height: 100%;
                            padding: 32px 24px 24px;
                        }
                        
                        .title {
                            font-size: 22px;
                            font-weight: 600;
                            margin-bottom: 16px;
                            text-align: center;
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
                            border: 1px solid #ccc;
                            resize: none;
                            box-sizing: border-box;
                            background-color: #151515;
                            color: #ffffff;
                            border: 1px solid #1F1D1D;
                        }
                        
                        textarea:focus {
                            border:1px solid #A48FFF;
                            outline: none;
                            width: 100%;
                            height: 100px;
                        }

                        textarea[readonly] {
                            background-color: #151515;
                            color: #ffffff;
                        }

                        select option {
                            background-color: #151515;
                            color: #ffffff;
                            border: 1px solid #1F1D1D;
                        }

                        select {
                            background-color: #151515;
                            color: #ffffff;
                            border: 1px solid #1F1D1D;
                        }

                        .translate-controls {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            margin-top: 16px;
                            flex-wrap: wrap;
                            background-color: #151515
                        }

                            .language-select {
                            flex: 1;
                            padding: 6px 8px;
                            border-radius: 8px;
                            border: 1px solid #ccc;
                            font-size: 14px;
                            background-color: #151515;
                            border: 1px solid #1F1D1D;
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
                            background-color: #6F58D5;
                            color: white;
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
                            top: 330px;
                            left: 0px;
                            width: 72px;
                            padding: 32px 0;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 24px;
                            background: #151515;
                            border-radius: 0 72px 72px 0;
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
                            background: #715CFF;
                            box-shadow: 0 0 8px var(--btn-active);
                        }

                        .settings__dock__btn.active svg {
                            stroke: #fff;
                        }

                        .dock{
                            position:fixed;                /* остаётся на экране при скролле */
                            top:435px;                       /* вертикальный центр */
                            right:0px;                    /* отступ от края страницы */
                            transform:translateY(-50%);
                            width:72px;
                            padding:32px 0;                /* внутренние отступы сверху‑снизу */
                            display:flex;
                            flex-direction:column;
                            align-items:center;
                            gap:24px;                      /* расстояние между иконками */
                            background:#151515;
                            border-radius:72px 0 0 72px;
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
                            background:#715CFF;
                            box-shadow:0 0 8px var(--btn-active);
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
                            background: rgba(255,255,255,.04);
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
                            background: #151515;
                            border-radius: 12px;
                            padding: 24px;
                            width: 70%;
                            max-width: 350px;
                            left: 35px;
                            position: absolute;
                            border: 1px solid #1F1D1D;
                            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                        }

                        .modal-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 10px;
                        }

                        .modal-title {
                            font-size: 12px;
                            font-weight: 300;
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
                        }
                        #translatedText.expanded {
                            height: 100px;          /* конечная высота */
                            opacity: 1;
                            padding: 10px;
                            border: 1px solid #1F1D1D;
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
                        }
                        .page-translate-btn {
                            flex: 0 0 auto;
                            width: calc(50% - 8px);      /* столько же, сколько селект языка */
                        }

                        #back-to-notes {
                            background: #000000;
                            color: #C5C5C5;
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
                            background: #181818 !important;
                            color: #fff !important;
                            border-radius: 18px !important;
                            box-shadow: 0 8px 32px rgba(0,0,0,0.45);
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
                        }
                        .tool-icon {
                            font-size: 32px;
                            margin-bottom: 2px;
                        }
                        .tool-label {
                            font-size: 12px;
                            color: #fff;
                        }
                        .modal-title {
                            font-size: 22px;
                            font-weight: 600;
                            margin-bottom: 8px;
                            color: #fff;
                        }

                        .tool-icon-block {
                            cursor: pointer;
                        }
                        .tool-icon-block:hover {
                            background: #232323;
                            border-radius: 10px;
                            transition: background 0.2s;
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
                        }

                        #voice-status-bubble {
                            background: #2c2c2e;
                            color: #a48fff;
                            padding: 8px 16px;
                            border-radius: 20px;
                            margin-bottom: 40px;
                            font-size: 14px;
                            display: inline-block;
                        }

                        #voice-waveform-container {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 60px;
                            gap: 3px;
                            margin-bottom: 40px;
                            width: 100%;
                        }

                        .waveform-bar {
                            width: 4px;
                            background-color: #6c757d;
                            border-radius: 2px;
                            transition: height 0.1s ease;
                        }

                        #voice-result {
                            font-size: 16px;
                            color: #fff;
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
                            <div style="position: relative; display: flex; align-items: stretch; margin-bottom: 12px;">
                                <textarea id="note-input" placeholder="What do you want to save?" style="flex: 1; padding-right: 60px;"></textarea>
                                <button id="save-note"
                                    style="position: absolute; right: 12px; bottom: 12px; height: 32px; padding: 0 16px; border-radius: 8px; background: #715CFF; color: #fff; border: none; cursor: pointer; z-index: 2;">
                                    Save
                                </button>
                            </div>
                            <input id="notes-search" type="text" placeholder="Search" style="width: 100%; margin-bottom: 12px; padding: 10px 14px; border-radius: 8px; border: 1px solid #232323; background: #151515; color: #fff; font-size: 15px;" />
                            <div id="notes-list"></div>
                        </div>

                        
                        <div id="screen-note-detail" class="screen" style="overflow-y: auto; max-height: 80vh;">
                            <h1 class="title">Notes</h1>
                            <div style="display: flex; align-items: center; margin-bottom: 18px;">
                                <button id="back-to-notes" style="background: none; color: #aaa; border: none; font-size: 15px; border-radius: 8px; padding: 4px 10px; cursor: pointer;">← Back</button>
                                <div style="margin-left: auto; display: flex; gap: 8px;">
                                    <button id="update-note" style="background: #715CFF; color: #fff; border: none; border-radius: 8px; padding: 0 18px; height: 38px; font-size: 15px; font-weight: 600; cursor: pointer;">Save</button>
                                    <button id="delete-note" style="background: #2d2d2d; color: #ff4444; border: none; border-radius: 8px; padding: 0 18px; height: 38px; font-size: 15px; cursor: pointer;">Delete</button>
                                </div>
                            </div>
                            <div style="
                                background: #232323;
                                border-radius: 14px;
                                box-shadow: 0 2px 12px #0002;
                                margin-bottom: 18px;
                                margin-top: 18px;
                            ">
                                <input id="note-title" placeholder="Title" style="
                                    width: 100%;
                                    background: #1A1A1A;
                                    color: #fff;
                                    border: 1px solid #333;
                                    border-radius: 8px;
                                    padding: 10px 12px;
                                    font-size: 19px;
                                ">
                                <textarea id="note-body" style="
                                    width: 100%;
                                    min-height: 120px;
                                    background: #151515;
                                    color: #fff;
                                    border: 1px solid #333;
                                    border-radius: 8px;
                                    padding: 12px;
                                    font-size: 15px;
                                    resize: vertical;
                                "></textarea>
                            </div>
                        </div>

                        <div id="screen-chat" class="screen">
                            <h1 class="title">Chat</h1>
                            <div id="chat-container" style="flex: 1 1 0; display: flex; flex-direction: column; background: #000000; border-radius: 8px; overflow-y: auto; gap: 12px; margin-bottom: 16px; min-height: 0; max-height: 80vh; margin-right: 72px; margin-left: 4px;"></div>
                            <form id="chat-form" style="display: flex; flex-direction: column; gap: 0; align-items: stretch; margin-top: auto; width: 100%; position: relative;">
                                <div class="chat-actions" style="display: flex; justify-content: flex-end; gap: 4px; margin-bottom: 4px;">
                                    <button type="button" id="chat-new" style="background: none; border: none; border-radius: 0; padding: 0; height: 40px; width: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><img src="${newChatUrl}" alt="New Chat" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;" /></button>
                                    <button type="button" id="chat-history" style="background: none; border: none; border-radius: 0; padding: 0; height: 40px; width: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><img src="${historyUrl}" alt="History" style="width:24px;height:24px;object-fit:contain;vertical-align:middle;" /></button>
                                </div>
                                <div style="position: relative; width: 100%; display: flex; align-items: flex-end; gap: 8px;">
                                    <textarea id="chat-input" placeholder="Ask whatever you want..." rows="1" style="width: 100%; min-width: 0; flex: 1; resize: none; border-radius: 12px; border: 1.5px solid #232323; background: #151515; color: #fff; padding: 12px 80px 12px 14px; font-size: 15px; transition: border 0.2s; height: 100px; min-height: 100px; margin: 0 0 0 16px;"></textarea>
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
                            <p id="voice-status-bubble">I'm waiting to hear your pretty voice!</p>
                            <div id="voice-waveform-container">
                                <!-- Bars will be generated by JS -->
                            </div>
                            <p id="voice-result"></p>
                        </div>

                        <div id="screen-translate" class="screen">
                            <h1 id="translate-top-row ">Translate</h1>

                            <div class="translate-controls">
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
                                        <div class="tool-icon-block">
                                            <span class="tool-icon"><img src="${simplifierUrl}" alt="Simplify" style="width:32px;height:32px;object-fit:contain;display:block;" /></span>
                                            <div class="tool-label">Simplify</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="tools-section" style="margin-top:32px;">
                                    <div class="modal-title" style="font-size:20px;">Hotbar tools</div>
                                    <div class="tools-section-title">Here is tools that is in your hotbar</div>
                                    <div class="tools-icons-row">
                                        <div class="tool-icon-block">
                                            <span class="tool-icon"><img src="${simplifierUrl}" alt="Simplify" style="width:32px;height:32px;object-fit:contain;display:block;" /></span>
                                            <div class="tool-label">Simplify</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="screen-settings" class="screen">
                            <h1 class="title">Settings</h1>
                        </div>

                        <div id="screen-account" class="screen">
                            <h1 class="title">Account</h1>
                            <form id="login-form" class="auth-form">
                                <div class="form-group">
                                    <label for="email-input">Email</label>
                                    <input type="email" id="email-input" required placeholder="Enter your email">
                                </div>
                                <div class="form-group">
                                    <label for="password-input">Password</label>
                                    <input type="password" id="password-input" required placeholder="Enter your password">
                                </div>
                                <div id="auth-error" class="error-message" style="display: none;"></div>
                                <button type="submit" class="login-button" id="login-button">Log In</button>
                                <button type="button" class="login-button" id="logout-button" style="display: none; margin-top: 8px;">Log out</button>
                            </form>
                        </div>

                        <div id="screen-appereance" class="screen">
                            <h1 class="title">Настройки</h1>
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
            NavigationComponent.initNavigation(iframeDoc);
            NotesComponent.initNotes(iframeDoc);
            // NotesComponent.initNoteDetail(iframeDoc);
            TranslateService.initTranslate(iframeDoc);
            VoiceService.initVoice(iframeDoc);
            ToolsComponent.initTools(iframeDoc);
            AccountComponent.initAuth(iframeDoc);
            AuthComponent.initAuth(iframeDoc);
            ChatComponent.initChat(iframeDoc);

            // Добавляем обработчик для кнопки закрытия
            const closeBtn = iframeDoc.getElementById('close-sidebar');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeSidebar());
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
                        const loaderOverlay = iframeDoc.getElementById('global-page-translate-loader');
                        // Показываем глобальный лоадер поверх всего
                        if (loaderOverlay) loaderOverlay.style.display = 'flex';
                        (confirmBtn as HTMLButtonElement).disabled = true;
                        // Получаем токен и только потом вызываем перевод
                        const token = await AuthService.getToken();
                        console.log("TRANSLATE PAGE!!!" + token)
                        await PageTranslateService.translatePage(lang, token || undefined);
                        // Скрываем лоадер и активируем кнопку
                        if (loaderOverlay) loaderOverlay.style.display = 'none';
                        (confirmBtn as HTMLButtonElement).disabled = false;
                        // Скрываем модалку выбора языка только после завершения перевода
                        langModal.classList.remove('active');
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
        };

        // Устанавливаем src для загрузки iframe
        iframe.src = 'about:blank';
        this.sidebar = iframe;
    }

    public openSidebar(): void {
        if (!this.sidebar) {
            this.createSidebar();
        }

        if (this.sidebar) {
            // Сохраняем оригинальные стили перед изменением
            this.saveOriginalStyles();

            // Применяем стили для сжатия контента
            this.applySidebarStyles();

            // Показываем сайдбар
            this.sidebar.classList.add('open');
            (this.sidebar as HTMLElement).style.right = '0';

            this.sidebarOpen = true;

            // Сдвигаем floating button к левой части сайдбара
            if (this.floatingButton) {
                this.floatingButton.style.right = '25vw';
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
    }

    public closeSidebar(): void {
        if (this.sidebar) {
            // Скрываем сайдбар
            this.sidebar.classList.remove('open');
            (this.sidebar as HTMLElement).style.right = '-25vw';

            // Восстанавливаем оригинальные стили
            this.removeSidebarStyles();

            this.sidebarOpen = false;

            // Возвращаем floating button к правому краю
            if (this.floatingButton) {
                this.floatingButton.style.right = '0';
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
        const contentWidth = '75vw';

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

        // Adjust floating button position when sidebar is open
        if (this.floatingButton) {
            this.floatingButton.style.right = '340px';
        }
    }

    private removeSidebarStyles(): void {
        document.documentElement.classList.remove('extension-sidebar-open');
        this.restoreOriginalStyles();
        this.originalStyles.clear();

        // Возвращаем floating button к правому краю
        if (this.floatingButton) {
            this.floatingButton.style.right = '0';
        }
    }
}

export function updateUserAvatar(avatarUrl: string | null) {
    const avatarImg = document.getElementById('user-avatar') as HTMLImageElement;
    console.log('Avatar URL:', avatarUrl);
    console.log('Avatar element:', avatarImg);

    if (avatarImg) {
        avatarImg.src = avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
        console.log('New avatar src:', avatarImg.src);
    } else {
        console.error('Avatar element not found!');
    }
}

// После успешной авторизации
fetch('/api/me')
    .then(response => response.json())
    .then(userData => {
        const avatarImg = document.getElementById('user-avatar') as HTMLImageElement;
        if (avatarImg && userData.avatar) {
            avatarImg.src = userData.avatar;
        }
    }); 