import { Sidebar } from './sidebar';
import { AuthService } from './services/auth';

// Initialize the sidebar
const sidebarInstance = new Sidebar();
(window as any).sidebarInstance = sidebarInstance;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'toggleSidebar') {
        sidebarInstance.toggleSidebar();
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Ensure floating button is present when page becomes visible
        if (!document.getElementById('chrome-extension-floating-button')) {
            sidebarInstance.initializeFloatingButton();
        }
    }
});

// Cleanup function for page unload
window.addEventListener('beforeunload', () => {
    sidebarInstance.cleanup();
});


chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'VIDEO_CONTROL') {
        // Универсальный поиск медиа-элементов
        let media: HTMLMediaElement | null = document.querySelector('video');
        if (!media) media = document.querySelector('audio');

        // Определение платформы
        const hostname = window.location.hostname;
        const isVK = hostname.includes('vk.com');
        const isSpotify = hostname.includes('spotify.com');
        const isAppleMusic = hostname.includes('music.apple.com');


        // Обработка команд
        switch (message.command) {
            case 'play':
                if (isVK) {
                    const playBtn = document.querySelector('.AudioPlayerMini__play') as HTMLElement;
                    if (playBtn) playBtn.click();
                } else if (isSpotify) {
                    const playPauseBtn = document.querySelector('[data-testid="control-button-playpause"]') as HTMLElement;
                    if (playPauseBtn) playPauseBtn.click();
                } else if (isAppleMusic) {
                    const playBtn = document.querySelector('.playback-play__play') as HTMLElement;
                    if (playBtn) playBtn.click();
                } else if (media) media.play();
                break;
            case 'pause':
                if (isVK) {
                    const pauseBtn = document.querySelector('.AudioPlayerMini__pause') as HTMLElement;
                    if (pauseBtn) pauseBtn.click();
                } else if (isSpotify) {
                    const playPauseBtn = document.querySelector('[data-testid="control-button-playpause"]') as HTMLElement;
                    if (playPauseBtn) playPauseBtn.click();
                } else if (isAppleMusic) {
                    const pauseBtn = document.querySelector('.playback-play__pause') as HTMLElement;
                    if (pauseBtn) pauseBtn.click();
                } else if (media) media.pause();
                break;
            case 'toggle':
                if (isVK) {
                    // Логика toggle для VK: если есть кнопка паузы - нажимаем её, иначе - кнопку play
                    const pauseBtn = document.querySelector('.AudioPlayerMini__pause') as HTMLElement;
                    const playBtn = document.querySelector('.AudioPlayerMini__play') as HTMLElement;
                    if (pauseBtn) {
                        pauseBtn.click(); // Если играет - ставим на паузу
                    } else if (playBtn) {
                        playBtn.click(); // Если на паузе - запускаем
                    }
                } else if (isSpotify) {
                    const playPauseBtn = document.querySelector('[data-testid="control-button-playpause"]') as HTMLElement;
                    if (playPauseBtn) playPauseBtn.click();
                } else if (isAppleMusic) {
                    // Логика toggle для Apple Music: если есть кнопка паузы - нажимаем её, иначе - кнопку play
                    const pauseBtn = document.querySelector('.playback-play__pause') as HTMLElement;
                    const playBtn = document.querySelector('.playback-play__play') as HTMLElement;
                    if (pauseBtn) {
                        pauseBtn.click(); // Если играет - ставим на паузу
                    } else if (playBtn) {
                        playBtn.click(); // Если на паузе - запускаем
                    }
                } else if (media) {
                    media.paused ? media.play() : media.pause();
                }
                break;
            case 'forward':
                if (media) media.currentTime += 20;
                break;
            case 'backward':
                if (media) media.currentTime -= 20;
                break;
            case 'next':
                if (isVK) {
                    const nextBtn = document.querySelector('.AudioPlayerMini__next') as HTMLElement;
                    if (nextBtn) {
                        nextBtn.click();
                        setTimeout(() => nextBtn.click(), 100);
                        setTimeout(() => nextBtn.click(), 200);
                    }
                } else if (isSpotify) {
                    const nextBtn = document.querySelector('[data-testid="control-button-skip-forward"]') as HTMLElement;
                    if (nextBtn) {
                        nextBtn.click();
                        setTimeout(() => nextBtn.click(), 100);
                        setTimeout(() => nextBtn.click(), 200);
                    }
                } else if (isAppleMusic) {
                    const nextBtn = document.querySelector('.button--next') as HTMLElement;
                    if (nextBtn) {
                        nextBtn.click();
                        setTimeout(() => nextBtn.click(), 100);
                        setTimeout(() => nextBtn.click(), 200);
                    }
                } else if (window.location.hostname.includes('youtube.com')) {
                    const nextButton = document.querySelector('.ytp-next-button') as HTMLElement | null;
                    if (nextButton) nextButton.click();
                } else if (media) {
                    // Для аудио/видео: попытка найти следующий элемент
                    const medias = Array.from(document.querySelectorAll('video, audio')) as HTMLMediaElement[];
                    const idx = medias.indexOf(media);
                    if (idx !== -1 && idx < medias.length - 1) {
                        media.pause();
                        medias[idx + 1].play();
                    }
                }
                break;
            case 'prev':
                if (isVK) {
                    const prevBtn = document.querySelector('.AudioPlayerMini__prev') as HTMLElement;
                    if (prevBtn) {
                        prevBtn.click();
                        setTimeout(() => prevBtn.click(), 100);
                        setTimeout(() => prevBtn.click(), 200);
                    }
                } else if (isSpotify) {
                    const prevBtn = document.querySelector('[data-testid="control-button-skip-back"]') as HTMLElement;
                    if (prevBtn) {
                        prevBtn.click();
                        setTimeout(() => prevBtn.click(), 100);
                        setTimeout(() => prevBtn.click(), 200);
                    }
                } else if (isAppleMusic) {
                    const prevBtn = document.querySelector('.button--previous') as HTMLElement;
                    if (prevBtn) {
                        prevBtn.click();
                        setTimeout(() => prevBtn.click(), 100);
                        setTimeout(() => prevBtn.click(), 200);
                    }
                } else if (window.location.hostname.includes('youtube.com')) {
                    const prevButton = document.querySelector('.ytp-prev-button') as HTMLElement | null;
                    if (prevButton) {
                        prevButton.click();
                        setTimeout(() => prevButton.click(), 50);
                    }
                } else if (media) {
                    const medias = Array.from(document.querySelectorAll('video, audio')) as HTMLMediaElement[];
                    const idx = medias.indexOf(media);
                    if (idx > 0) {
                        media.pause();
                        medias[idx - 1].play();
                    }
                }
                break;
            case 'volume_down': {
                if (media) {
                    media.volume = Math.max(0, media.volume - 0.1);
                }
                break;
            }
            case 'volume_up': {
                if (media) {
                    media.volume = Math.min(1, media.volume + 0.1);
                }
                break;
            }
        }
    } else if (message.type === 'HAS_VIDEO') {
        // Проверяем наличие видео, аудио или платформенных элементов управления
        const hasVideo = !!document.querySelector('video');
        const hasAudio = !!document.querySelector('audio');

        // Проверяем платформенные элементы управления
        const hostname = window.location.hostname;
        const isVK = hostname.includes('vk.com');
        const isSpotify = hostname.includes('spotify.com');
        const isAppleMusic = hostname.includes('music.apple.com');

        let hasPlatformControls = false;
        if (isVK) {
            hasPlatformControls = !!(document.querySelector('.AudioPlayerMini__play') || document.querySelector('.AudioPlayerMini__pause'));
        } else if (isSpotify) {
            hasPlatformControls = !!document.querySelector('[data-testid="control-button-playpause"]');
        } else if (isAppleMusic) {
            hasPlatformControls = !!(document.querySelector('.playback-play__play') || document.querySelector('.playback-play__pause'));
        }

        const hasMedia = hasVideo || hasAudio || hasPlatformControls;
        sendResponse({ hasVideo: hasMedia });
    } else if (message.type === 'CREATE_NOTE') {
        (async () => {
            try {
                let token = '';
                if ((window as any).AuthService) {
                    token = String(await (window as any).AuthService.getToken() || '');
                } else if (typeof AuthService !== 'undefined') {
                    token = String(await (AuthService as any).getToken() || '');
                }
                if (!token) {
                    alert('Login required to save note.');
                    return;
                }
                let NotesService;
                if ((window as any).NotesService) {
                    NotesService = (window as any).NotesService;
                } else {
                    NotesService = (await import('./services/notes')).NotesService;
                }
                const note = await NotesService.createNote(message.title, message.text, token, document);
                if (note) {
                    if (message.focus) {
                        if (!(window as any).sidebarInstance.isOpen()) {
                            await (window as any).sidebarInstance.openSidebar();
                        }
                        // Открываем страницу заметок
                        if ((window as any).sidebarInstance.navigateTo) {
                            (window as any).sidebarInstance.navigateTo('screen-notes');
                        }
                        // Обновляем список заметок всегда
                        if (typeof (document as any).renderNotes === 'function') {
                            await (document as any).renderNotes();
                        }
                    } else {
                        // Старое поведение (на всякий случай)
                        if (!(window as any).sidebarInstance.isOpen()) {
                            (window as any).sidebarInstance.openSidebar();
                            setTimeout(async () => {
                                let NotesComponent;
                                if ((window as any).NotesComponent) {
                                    NotesComponent = (window as any).NotesComponent;
                                } else {
                                    NotesComponent = (await import('./sidebar/components/notes')).NotesComponent;
                                }
                                await NotesComponent.initNoteDetail(document, note.id);
                            }, 500);
                        } else {
                            let NotesComponent;
                            if ((window as any).NotesComponent) {
                                NotesComponent = (window as any).NotesComponent;
                            } else {
                                NotesComponent = (await import('./sidebar/components/notes')).NotesComponent;
                            }
                            await NotesComponent.initNoteDetail(document, note.id);
                        }
                    }
                } else {
                    alert('Failed to create note.');
                }
            } catch (e) {
                console.error('[content-enhanced] Error creating note:', e);
            }
        })();
    } else if (message.type === 'SHOW_TRANSLATE_POPUP') {
        (async () => {
            // Удалить старый попап если есть
            const old = document.getElementById('megan-translate-popup');
            if (old) old.remove();
            // Создать контейнер
            const popup = document.createElement('div');
            popup.id = 'megan-translate-popup';
            popup.style.cssText = `
                position: fixed;
                z-index: 2147483647;
                top: 50px; right: 50px;
                background: #232323;
                color: #fff;
                border-radius: 16px;
                box-shadow: 0 8px 32px #0008;
                padding: 28px 28px 22px 28px;
                min-width: 340px;
                max-width: 96vw;
                font-family: 'Poppins', 'Inter', Arial, sans-serif;
                border: 1.5px solid #715CFF;
                display: flex;
                flex-direction: column;
                gap: 14px;
                animation: fadeIn 0.2s;
                cursor: default;
            `;
            // --- Стили для кастомного dropdown (как в translate-screen) ---
            if (!document.getElementById('megan-translate-popup-style')) {
                const style = document.createElement('style');
                style.id = 'megan-translate-popup-style';
                style.textContent = `
                    .megan-translate-popup-dark {
                        background: #232323 !important;
                        color: #fff !important;
                        border: 1.5px solid #715CFF !important;
                    }
                    .megan-translate-popup-light {
                        background: #FAFAFA !important;
                        color: #232323 !important;
                        border: 1.5px solid #AA97FF !important;
                    }
                    .megan-custom-dropdown { position: relative; width: 100%; user-select: none; font-size: 15px; font-weight: 500; }
                    .megan-custom-dropdown-selected { background: #181818; color: #fff; border: 1.5px solid #715CFF; border-radius: 10px; padding: 10px 38px 10px 14px; cursor: pointer; transition: border 0.2s, box-shadow 0.2s; box-shadow: 0 2px 8px #715cff11; position: relative; }
                    .megan-custom-dropdown-selected:after { content: ''; position: absolute; right: 16px; top: 50%; width: 16px; height: 16px; background-image: url('data:image/svg+xml;utf8,<svg fill="none" stroke="%23715CFF" stroke-width="2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6"/></svg>'); background-size: 16px 16px; background-repeat: no-repeat; background-position: center; transform: translateY(-50%); pointer-events: none; }
                    .megan-custom-dropdown-list { display: none; position: absolute; left: 0; right: 0; top: 110%; background: #181818; border: 1.5px solid #715CFF; border-radius: 10px; box-shadow: 0 8px 32px rgba(111,88,213,0.10); z-index: 99999; animation: fadeInDropdown 0.18s; max-height: 260px; overflow-y: auto; }
                    .megan-custom-dropdown.open .megan-custom-dropdown-list { display: block; }
                    .megan-custom-dropdown-option { padding: 12px 18px; cursor: pointer; color: #fff; transition: background 0.15s, color 0.15s; }
                    .megan-custom-dropdown-option:hover { background: #715CFF; color: #fff; }
                    @keyframes fadeInDropdown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
                    /* --- Scrollbar styles --- */
                    .megan-custom-dropdown-list { scrollbar-width: thin; scrollbar-color: #715CFF #181818; }
                    .megan-custom-dropdown-list::-webkit-scrollbar { width: 7px; background: #181818; }
                    .megan-custom-dropdown-list::-webkit-scrollbar-thumb { background: #715CFF; border-radius: 6px; }
                    .megan-custom-dropdown-list::-webkit-scrollbar-track { background: #181818; }
                    body.theme-light .megan-custom-dropdown-list { scrollbar-color: #AA97FF #F5F5F5; }
                    body.theme-light .megan-custom-dropdown-list::-webkit-scrollbar { background: #F5F5F5; }
                    body.theme-light .megan-custom-dropdown-list::-webkit-scrollbar-thumb { background: #AA97FF; }
                    body.theme-light .megan-custom-dropdown-list::-webkit-scrollbar-track { background: #F5F5F5; }
                    /* Light theme for dropdown */
                    body.theme-light .megan-custom-dropdown-selected { background: #fff; color: #232323; border: 1.5px solid #AA97FF; }
                    body.theme-light .megan-custom-dropdown-selected:after { background-image: url('data:image/svg+xml;utf8,<svg fill="none" stroke="%23AA97FF" stroke-width="2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6"/></svg>'); }
                    body.theme-light .megan-custom-dropdown-list { background: #fff; border: 1.5px solid #AA97FF; }
                    body.theme-light .megan-custom-dropdown-option { color: #232323; }
                    body.theme-light .megan-custom-dropdown-option:hover { background: #AA97FF; color: #fff; }
                `;
                document.head.appendChild(style);
            }
            // Кнопка закрытия
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = 'position:absolute;top:8px;right:12px;background:none;border:none;font-size:22px;color:#aaa;cursor:pointer;z-index:2;';
            closeBtn.onclick = () => popup.remove();
            popup.appendChild(closeBtn);
            // Заголовок
            const title = document.createElement('div');
            title.textContent = 'Translate text';
            title.style.cssText = 'font-size:18px;font-weight:600;margin-bottom:2px;cursor:move;user-select:none;z-index:1;';
            // Drag events (оставляем как было)
            let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
            title.addEventListener('mousedown', (e) => {
                isDragging = true;
                const rect = popup.getBoundingClientRect();
                dragOffsetX = e.clientX - rect.left;
                dragOffsetY = e.clientY - rect.top;
                document.body.style.userSelect = 'none';
            });
            document.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    popup.style.left = (e.clientX - dragOffsetX) + 'px';
                    popup.style.top = (e.clientY - dragOffsetY) + 'px';
                    popup.style.right = '';
                    popup.style.bottom = '';
                    popup.style.position = 'fixed';
                }
            });
            document.addEventListener('mouseup', () => {
                isDragging = false;
                document.body.style.userSelect = '';
            });
            popup.appendChild(title);
            // --- Кастомный dropdown для выбора языка ---
            const langRow = document.createElement('div');
            langRow.style.cssText = 'display:flex;gap:8px;align-items:center;';
            // Кастомный dropdown
            const dropdown = document.createElement('div');
            dropdown.className = 'megan-custom-dropdown';
            const selected = document.createElement('div');
            selected.className = 'megan-custom-dropdown-selected';
            selected.textContent = 'English';
            const list = document.createElement('div');
            list.className = 'megan-custom-dropdown-list';
            // Заполняем языки
            const { languages } = await import('./services/translate');
            languages.filter(l => l.code !== 'auto').forEach(({ code, name }) => {
                const opt = document.createElement('div');
                opt.className = 'megan-custom-dropdown-option';
                opt.setAttribute('data-value', code);
                opt.textContent = name;
                opt.addEventListener('click', () => {
                    selected.textContent = name;
                    dropdown.classList.remove('open');
                    dropdown.setAttribute('data-value', code);
                });
                list.appendChild(opt);
            });
            dropdown.appendChild(selected);
            dropdown.appendChild(list);
            // Открытие/закрытие
            selected.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });
            document.addEventListener('click', () => dropdown.classList.remove('open'));
            langRow.appendChild(dropdown);
            popup.appendChild(langRow);
            // Кнопка перевода
            const btn = document.createElement('button');
            btn.textContent = 'Translate';
            btn.style.cssText = 'margin-top:8px;padding:10px 0;font-size:15px;font-weight:600;background:#715CFF;color:#fff;border:none;border-radius:8px;cursor:pointer;';
            popup.appendChild(btn);
            // Переведённый текст
            const dstArea = document.createElement('textarea');
            dstArea.readOnly = true;
            dstArea.placeholder = 'Translation will appear here...';
            dstArea.style.cssText = 'width:100%;min-width:220px;max-width:100%;height:70px;padding:8px 10px;font-size:15px;border-radius:8px;border:1px solid #444;background:#181818;color:#fff;resize:vertical;margin-top:8px;';
            popup.appendChild(dstArea);
            // Логика перевода
            btn.onclick = async () => {
                const { TranslateService } = await import('./services/translate');
                const text = message.text.trim();
                if (!text) return;
                dstArea.value = 'Translating...';
                try {
                    const code = dropdown.getAttribute('data-value') || 'en';
                    const result = await TranslateService["translateText"](text, 'auto', code);
                    dstArea.value = result;
                } catch (err) {
                    dstArea.value = 'Error: ' + (err instanceof Error ? err.message : String(err));
                }
            };
            // Автоматически переводим сразу при открытии
            btn.click();
            document.body.appendChild(popup);
            // Определяем тему
            function applyPopupTheme() {
                const isLight = document.body.classList.contains('theme-light');
                popup.classList.toggle('megan-translate-popup-light', isLight);
                popup.classList.toggle('megan-translate-popup-dark', !isLight);
                // textarea и кнопки тоже подстраиваем
                closeBtn.style.color = isLight ? '#888' : '#aaa';
                title.style.color = isLight ? '#232323' : '#fff';
                dstArea.style.background = isLight ? '#fff' : '#181818';
                dstArea.style.color = isLight ? '#232323' : '#fff';
                dstArea.style.border = isLight ? '1px solid #AA97FF' : '1px solid #444';
                btn.style.background = isLight ? '#AA97FF' : '#715CFF';
                btn.style.color = '#fff';
                btn.style.border = 'none';
            }
            applyPopupTheme();
            // Следим за сменой темы
            const observer = new MutationObserver(applyPopupTheme);
            observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        })();
    }
});
