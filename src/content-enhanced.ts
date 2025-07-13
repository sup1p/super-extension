import { Sidebar } from './sidebar';
import { AuthService } from './services/auth';
import { TranslationService } from './services/translations';

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
                    showNotification(TranslationService.translate('login_required_save_note'), 'error');
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
                    showNotification(TranslationService.translate('success_note_saved'), 'success');
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
                    showNotification(TranslationService.translate('failed_create_note'), 'error');
                }
            } catch (e) {
                console.error('[content-enhanced] Error creating note:', e);
                showNotification(TranslationService.translate('error_creating_note') + ' ' + (e instanceof Error ? e.message : String(e)), 'error');
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
                min-height: 300px;
                max-width: 700px;
                max-height: 700px;
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
            title.textContent = TranslationService.translate('translate_text');
            title.style.cssText = 'font-size:18px;font-weight:600;margin-bottom:2px;cursor:move;user-select:none;z-index:1;';
            // Drag events (оставляем как было)
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
            // --- Добавляем resizer для изменения размера ---
            const resizer = document.createElement('div');
            resizer.className = 'megan-translate-popup-resizer';
            resizer.style.cssText = `
                position: absolute;
                width: 22px;
                height: 22px;
                right: 2px;
                bottom: 2px;
                cursor: se-resize;
                z-index: 10;
                background: none;
            `;
            resizer.innerHTML = `<svg width="22" height="22" viewBox="0 0 22 22"><path d="M4 18h14M8 14h10M12 10h6" stroke="#715CFF" stroke-width="2" stroke-linecap="round"/></svg>`;
            popup.appendChild(resizer);
            // --- Стили для resizer ---
            if (!document.getElementById('megan-translate-popup-resizer-style')) {
                const style = document.createElement('style');
                style.id = 'megan-translate-popup-resizer-style';
                style.textContent = `
                    .megan-translate-popup-resizer { user-select: none; }
                    .megan-translate-popup-resizer svg { pointer-events: none; opacity: 0.7; }
                    .megan-translate-popup-resizer:active svg { opacity: 1; }
                `;
                document.head.appendChild(style);
            }
            // --- Логика изменения размера ---
            let isResizing = false;
            let startX = 0, startY = 0, startWidth = 0, startHeight = 0;
            resizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = popup.getBoundingClientRect();
                startWidth = rect.width;
                startHeight = rect.height;
                document.body.style.userSelect = 'none';
                popup.style.cursor = 'se-resize';
            });
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                const minWidth = 320, minHeight = 180, maxWidth = 700, maxHeight = 700;
                let newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + dx));
                let newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + dy));
                popup.style.width = newWidth + 'px';
                popup.style.height = newHeight + 'px';
                popup.style.maxWidth = maxWidth + 'px';
                popup.style.maxHeight = maxHeight + 'px';
            });
            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.userSelect = '';
                    popup.style.cursor = '';
                }
            });
            // --- Drag'n'drop на всё popup, кроме input/textarea/кнопок/dropdown/resizer ---
            // (Объявляем переменные только один раз)
            let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
            popup.addEventListener('mousedown', (e) => {
                const target = e.target as HTMLElement;
                if (
                    target.closest('input, textarea, button, .megan-custom-dropdown, .megan-translate-popup-resizer')
                ) return;
                isDragging = true;
                const rect = popup.getBoundingClientRect();
                dragOffsetX = e.clientX - rect.left;
                dragOffsetY = e.clientY - rect.top;
                document.body.style.userSelect = 'none';
                popup.style.cursor = 'move';
            });
            document.addEventListener('mousemove', (e) => {
                if (isDragging && !isResizing) {
                    popup.style.left = (e.clientX - dragOffsetX) + 'px';
                    popup.style.top = (e.clientY - dragOffsetY) + 'px';
                    popup.style.right = '';
                    popup.style.bottom = '';
                    popup.style.position = 'fixed';
                    popup.style.cursor = 'move';
                }
            });
            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    document.body.style.userSelect = '';
                    popup.style.cursor = '';
                }
            });
            // Курсор "move" при наведении на popup, кроме интерактивных элементов
            popup.addEventListener('mousemove', (e) => {
                const target = e.target as HTMLElement;
                if (
                    target.closest('input, textarea, button, .megan-custom-dropdown, .megan-translate-popup-resizer')
                ) {
                    popup.style.cursor = '';
                } else if (!isDragging && !isResizing) {
                    popup.style.cursor = 'move';
                }
            });
            // Сброс курсора при уходе мыши
            popup.addEventListener('mouseleave', () => {
                if (!isDragging && !isResizing) popup.style.cursor = '';
            });
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
            btn.textContent = TranslationService.translate('translate');
            btn.style.cssText = 'margin-top:8px;padding:10px 0;font-size:15px;font-weight:600;background:#715CFF;color:#fff;border:none;border-radius:8px;cursor:pointer;';
            popup.appendChild(btn);
            // Переведённый текст
            const dstArea = document.createElement('textarea');
            dstArea.readOnly = true;
            dstArea.placeholder = TranslationService.translate('translation_placeholder');
            dstArea.style.cssText = 'width:100%;min-width:0;flex:1 1 auto;height:70px;padding:8px 10px;font-size:15px;border-radius:8px;border:1px solid #444;background:#181818;color:#fff;resize:vertical;margin-top:8px;overflow-y:auto;box-sizing:border-box;';
            // --- Custom scrollbar styles (like dropdown) ---
            if (!document.getElementById('megan-translate-popup-scrollbar-style')) {
                const style = document.createElement('style');
                style.id = 'megan-translate-popup-scrollbar-style';
                style.textContent = `
                    #megan-translate-popup textarea::-webkit-scrollbar {
                        width: 7px;
                        background: #181818;
                    }
                    #megan-translate-popup textarea::-webkit-scrollbar-thumb {
                        background: #715CFF;
                        border-radius: 6px;
                    }
                    #megan-translate-popup textarea::-webkit-scrollbar-track {
                        background: #181818;
                    }
                    body.theme-light #megan-translate-popup textarea::-webkit-scrollbar {
                        background: #F5F5F5;
                    }
                    body.theme-light #megan-translate-popup textarea::-webkit-scrollbar-thumb {
                        background: #AA97FF;
                    }
                    body.theme-light #megan-translate-popup textarea::-webkit-scrollbar-track {
                        background: #F5F5F5;
                    }
                    #megan-translate-popup textarea {
                        scrollbar-width: thin;
                        scrollbar-color: #715CFF #181818;
                    }
                    body.theme-light #megan-translate-popup textarea {
                        scrollbar-color: #AA97FF #F5F5F5;
                    }
                    /* --- Не менять цвет бордера при фокусе --- */
                    #megan-translate-popup textarea:focus {
                        outline: none;
                        border: 1px solid #715CFF !important;
                    }
                    body.theme-light #megan-translate-popup textarea:focus {
                        border: 1px solid #AA97FF !important;
                    }
                `;
                document.head.appendChild(style);
            }
            popup.appendChild(dstArea);
            // Логика перевода
            btn.onclick = async () => {
                const { TranslateService } = await import('./services/translate');
                const text = message.text.trim();
                if (!text) return;
                dstArea.value = TranslationService.translate('translating');
                let token = '';
                if ((window as any).AuthService) {
                    token = String(await (window as any).AuthService.getToken() || '');
                } else if (typeof AuthService !== 'undefined') {
                    token = String(await (AuthService as any).getToken() || '');
                }
                if (!token) {
                    showNotification(TranslationService.translate('login_required_translate'), 'error');
                    dstArea.value = TranslationService.translate('login_required_translate');
                    return;
                }
                try {
                    const code = dropdown.getAttribute('data-value') || 'en';
                    const result = await TranslateService["translateText"](text, 'auto', code);
                    dstArea.value = result;
                } catch (err) {
                    // Всегда показываем notification если ошибка связана с авторизацией
                    if (err instanceof Error && err.message && err.message.includes('No auth token')) {
                        showNotification(TranslationService.translate('login_required_translate'), 'error');
                        dstArea.value = TranslationService.translate('login_required_translate');
                    } else {
                        showNotification(TranslationService.translate('translation_error'), 'error');
                        dstArea.value = TranslationService.translate('error') + ': ' + (err instanceof Error ? err.message : String(err));
                    }
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
                dstArea.style.border = isLight ? '1px solid #AA97FF' : '1px solid #715CFF';
                btn.style.background = isLight ? '#AA97FF' : '#715CFF';
                btn.style.color = '#fff';
                btn.style.border = 'none';
            }
            applyPopupTheme();
            // Следим за сменой темы
            const observer = new MutationObserver(applyPopupTheme);
            observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        })();
    } else if (message.type === 'SHOW_SUMMARIZE_POPUP') {
        (async () => {
            // Удалить старый попап если есть
            const old = document.getElementById('megan-summarize-popup');
            if (old) old.remove();
            // Создать контейнер
            const popup = document.createElement('div');
            popup.id = 'megan-summarize-popup';
            popup.style.cssText = `
                position: fixed;
                z-index: 2147483647;
                top: 90px; right: 50px;
                border-radius: 16px;
                box-shadow: 0 8px 32px #0008;
                padding: 28px 28px 22px 28px;
                min-width: 340px;
                max-width: 350px;
                font-family: 'Poppins', 'Inter', Arial, sans-serif;
                display: flex;
                flex-direction: column;
                gap: 14px;
                animation: fadeIn 0.2s;
                cursor: default;
            `;
            // --- Стили для кастомного popup (общие с translate) ---
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
                    .megan-custom-dropdown-selected:after { content: ''; position: absolute; right: 16px; top: 50%; width: 16px; height: 16px; background-image: url('data:image/svg+xml;utf8,<svg fill=\"none\" stroke=\"%23715CFF\" stroke-width=\"2\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 9l6 6 6-6\"/></svg>'); background-size: 16px 16px; background-repeat: no-repeat; background-position: center; transform: translateY(-50%); pointer-events: none; }
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
                    body.theme-light .megan-custom-dropdown-selected:after { background-image: url('data:image/svg+xml;utf8,<svg fill=\"none\" stroke=\"%23AA97FF\" stroke-width=\"2\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 9l6 6 6-6\"/></svg>'); }
                    body.theme-light .megan-custom-dropdown-list { background: #fff; border: 1.5px solid #AA97FF; }
                    body.theme-light .megan-custom-dropdown-option { color: #232323; }
                    body.theme-light .megan-custom-dropdown-option:hover { background: #AA97FF; color: #fff; }
                `;
                document.head.appendChild(style);
            }
            // Кнопка закрытия
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = 'position:absolute;top:8px;right:12px;background:none;border:none;font-size:22px;cursor:pointer;z-index:2;';
            closeBtn.onclick = () => popup.remove();
            popup.appendChild(closeBtn);
            // Заголовок
            const title = document.createElement('div');
            title.textContent = TranslationService.translate('summarize_text');
            title.style.cssText = 'font-size:18px;font-weight:600;margin-bottom:2px;cursor:move;user-select:none;z-index:1;';
            // Drag events
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
            // --- Добавляем resizer для изменения размера ---
            const resizer = document.createElement('div');
            resizer.className = 'megan-summarize-popup-resizer';
            resizer.style.cssText = `
                position: absolute;
                width: 22px;
                height: 22px;
                right: 2px;
                bottom: 2px;
                cursor: se-resize;
                z-index: 10;
                background: none;
            `;
            resizer.innerHTML = `<svg width="22" height="22" viewBox="0 0 22 22"><path d="M4 18h14M8 14h10M12 10h6" stroke="#715CFF" stroke-width="2" stroke-linecap="round"/></svg>`;
            popup.appendChild(resizer);
            // --- Стили для resizer ---
            if (!document.getElementById('megan-summarize-popup-resizer-style')) {
                const style = document.createElement('style');
                style.id = 'megan-summarize-popup-resizer-style';
                style.textContent = `
                    .megan-summarize-popup-resizer { user-select: none; }
                    .megan-summarize-popup-resizer svg { pointer-events: none; opacity: 0.7; }
                    .megan-summarize-popup-resizer:active svg { opacity: 1; }
                `;
                document.head.appendChild(style);
            }
            // --- Логика изменения размера ---
            let isResizing = false;
            let startX = 0, startY = 0, startWidth = 0, startHeight = 0;
            resizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = popup.getBoundingClientRect();
                startWidth = rect.width;
                startHeight = rect.height;
                document.body.style.userSelect = 'none';
                popup.style.cursor = 'se-resize';
            });
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                const minWidth = 320, minHeight = 180, maxWidth = 700, maxHeight = 700;
                let newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + dx));
                let newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + dy));
                popup.style.width = newWidth + 'px';
                popup.style.height = newHeight + 'px';
                popup.style.maxWidth = maxWidth + 'px';
                popup.style.maxHeight = maxHeight + 'px';
            });
            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.userSelect = '';
                    popup.style.cursor = '';
                }
            });
            // --- Drag'n'drop на всё popup, кроме input/textarea/кнопок/resizer ---
            popup.addEventListener('mousedown', (e) => {
                const target = e.target as HTMLElement;
                if (
                    target.closest('input, textarea, button, .megan-summarize-popup-resizer')
                ) return;
                isDragging = true;
                const rect = popup.getBoundingClientRect();
                dragOffsetX = e.clientX - rect.left;
                dragOffsetY = e.clientY - rect.top;
                document.body.style.userSelect = 'none';
                popup.style.cursor = 'move';
            });
            document.addEventListener('mousemove', (e) => {
                if (isDragging && !isResizing) {
                    popup.style.left = (e.clientX - dragOffsetX) + 'px';
                    popup.style.top = (e.clientY - dragOffsetY) + 'px';
                    popup.style.right = '';
                    popup.style.bottom = '';
                    popup.style.position = 'fixed';
                    popup.style.cursor = 'move';
                }
            });
            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    document.body.style.userSelect = '';
                    popup.style.cursor = '';
                }
            });
            // Курсор "move" при наведении на popup, кроме интерактивных элементов
            popup.addEventListener('mousemove', (e) => {
                const target = e.target as HTMLElement;
                if (
                    target.closest('input, textarea, button, .megan-summarize-popup-resizer')
                ) {
                    popup.style.cursor = '';
                } else if (!isDragging && !isResizing) {
                    popup.style.cursor = 'move';
                }
            });
            // Сброс курсора при уходе мыши
            popup.addEventListener('mouseleave', () => {
                if (!isDragging && !isResizing) popup.style.cursor = '';
            });
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
            // Кнопка summarize
            const btn = document.createElement('button');
            btn.textContent = TranslationService.translate('summarize');
            btn.style.cssText = 'margin-top:8px;padding:10px 0;font-size:15px;font-weight:600;background:#715CFF;color:#fff;border:none;border-radius:8px;cursor:pointer;';
            popup.appendChild(btn);
            // Результат
            const dstArea = document.createElement('textarea');
            dstArea.readOnly = true;
            dstArea.placeholder = TranslationService.translate('summary_placeholder');
            dstArea.style.cssText = 'width:100%;min-width:0;flex:1 1 auto;height:90px;padding:8px 10px;font-size:15px;border-radius:8px;border:1px solid #444;background:#181818;color:#fff;resize:vertical;margin-top:8px;overflow-y:auto;box-sizing:border-box;';
            // --- Custom scrollbar styles (like dropdown) ---
            if (!document.getElementById('megan-summarize-popup-scrollbar-style')) {
                const style = document.createElement('style');
                style.id = 'megan-summarize-popup-scrollbar-style';
                style.textContent = `
                    #megan-summarize-popup textarea::-webkit-scrollbar {
                        width: 7px;
                        background: #181818;
                    }
                    #megan-summarize-popup textarea::-webkit-scrollbar-thumb {
                        background: #715CFF;
                        border-radius: 6px;
                    }
                    #megan-summarize-popup textarea::-webkit-scrollbar-track {
                        background: #181818;
                    }
                    body.theme-light #megan-summarize-popup textarea::-webkit-scrollbar {
                        background: #F5F5F5;
                    }
                    body.theme-light #megan-summarize-popup textarea::-webkit-scrollbar-thumb {
                        background: #AA97FF;
                    }
                    body.theme-light #megan-summarize-popup textarea::-webkit-scrollbar-track {
                        background: #F5F5F5;
                    }
                    #megan-summarize-popup textarea {
                        scrollbar-width: thin;
                        scrollbar-color: #715CFF #181818;
                    }
                    body.theme-light #megan-summarize-popup textarea {
                        scrollbar-color: #AA97FF #F5F5F5;
                    }
                `;
                document.head.appendChild(style);
            }
            popup.appendChild(dstArea);
            // Логика summarize
            btn.onclick = async () => {
                const text = message.text.trim();
                if (!text) return;
                dstArea.value = TranslationService.translate('summarizing');
                try {
                    let token = '';
                    if ((window as any).AuthService) {
                        token = String(await (window as any).AuthService.getToken() || '');
                    } else if (typeof AuthService !== 'undefined') {
                        token = String(await (AuthService as any).getToken() || '');
                    }
                    if (!token) {
                        showNotification(TranslationService.translate('login_required_summarize'), 'error');
                        dstArea.value = TranslationService.translate('login_required_summarize');
                        return;
                    }
                    const API_URL = await getApiUrl();
                    const resp = await new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage({
                            type: "TOOLS_LOGIC",
                            url: `${API_URL}/tools/summarize/selected`,
                            options: {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": token ? `Bearer ${token}` : ""
                                },
                                body: JSON.stringify({ text })
                            }
                        }, (response) => {
                            if (!response) reject("No response from background");
                            else if (!response.ok) reject(response);
                            else resolve({ ok: true, json: () => response.data });
                        });
                    });
                    const data = await (resp as any).json();
                    dstArea.value = data.summarized_text || TranslationService.translate('no_summary');
                } catch (err) {
                    if (
                        (err && typeof err === 'object' && 'status' in err && err.status === 401) ||
                        (err instanceof Error && err.message && err.message.toLowerCase().includes('auth'))
                    ) {
                        showNotification(TranslationService.translate('login_required_summarize'), 'error');
                        dstArea.value = TranslationService.translate('login_required_summarize');
                    } else {
                        dstArea.value = TranslationService.translate('error') + ': ' + (err instanceof Error ? err.message : String(err));
                    }
                }
            };
            // Автоматически summarize сразу при открытии
            btn.click();
            document.body.appendChild(popup);
            // --- Тема ---
            function applyPopupTheme() {
                const isLight = document.body.classList.contains('theme-light');
                popup.classList.toggle('megan-translate-popup-light', isLight);
                popup.classList.toggle('megan-translate-popup-dark', !isLight);
                closeBtn.style.color = isLight ? '#888' : '#aaa';
                title.style.color = isLight ? '#232323' : '#fff';
                dstArea.style.background = isLight ? '#fff' : '#181818';
                dstArea.style.color = isLight ? '#232323' : '#fff';
                dstArea.style.border = isLight ? '1px solid #AA97FF' : '1px solid #715CFF';
                btn.style.background = isLight ? '#AA97FF' : '#715CFF';
                btn.style.color = '#fff';
                btn.style.border = 'none';
            }
            applyPopupTheme();
            const observer = new MutationObserver(applyPopupTheme);
            observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        })();
    } else if (message.type === 'SHOW_VOICE_POPUP') {
        (async () => {
            // Удалить старый попап если есть
            const old = document.getElementById('megan-voice-popup');
            if (old) old.remove();
            // Показать notification о процессе озвучки
            showNotification(TranslationService.translate('text_synthesizing_wait'), 'success');
            // Создать контейнер
            const popup = document.createElement('div');
            popup.id = 'megan-voice-popup';
            popup.style.cssText = `
                position: fixed;
                z-index: 2147483647;
                top: 130px; right: 50px;
                border-radius: 16px;
                box-shadow: 0 8px 32px #0008;
                padding: 28px 28px 22px 28px;
                min-width: 340px;
                max-width: 350px;
                font-family: 'Poppins', 'Inter', Arial, sans-serif;
                display: flex;
                flex-direction: column;
                gap: 14px;
                animation: fadeIn 0.2s;
                cursor: default;
                background: #232323;
                color: #fff;
                border: 1.5px solid #715CFF;
            `;
            // --- Стили для popup (общие с translate/summarize) ---
            if (!document.getElementById('megan-voice-popup-style')) {
                const style = document.createElement('style');
                style.id = 'megan-voice-popup-style';
                style.textContent = `
                    .megan-voice-popup-dark {
                        background: #232323 !important;
                        color: #fff !important;
                        border: 1.5px solid #715CFF !important;
                    }
                    .megan-voice-popup-light {
                        background: #FAFAFA !important;
                        color: #232323 !important;
                        border: 1.5px solid #AA97FF !important;
                    }
                    body.theme-light #megan-voice-popup {
                        background: #FAFAFA !important;
                        color: #232323 !important;
                        border: 1.5px solid #AA97FF !important;
                    }
                    /* --- Кастомные стили для <audio> --- */
                    #megan-voice-popup audio {
                        background: #232323;
                        border-radius: 12px;
                        box-shadow: 0 2px 8px #0002;
                        color-scheme: dark;
                        margin-bottom: 2px;
                    }
                    #megan-voice-popup audio::-webkit-media-controls-panel {
                        background: #292929;
                        border-radius: 12px;
                    }
                    #megan-voice-popup audio::-webkit-media-controls-play-button,
                    #megan-voice-popup audio::-webkit-media-controls-mute-button,
                    #megan-voice-popup audio::-webkit-media-controls-volume-slider,
                    #megan-voice-popup audio::-webkit-media-controls-timeline {
                        filter: invert(0.8) grayscale(0.2);
                    }
                    #megan-voice-popup audio::-webkit-media-controls-current-time-display,
                    #megan-voice-popup audio::-webkit-media-controls-time-remaining-display {
                        color: #eee;
                    }
                    body.theme-light #megan-voice-popup audio,
                    body.theme-light #megan-voice-popup audio::-webkit-media-controls-panel {
                        background: #fff;
                        color-scheme: light;
                    }
                    body.theme-light #megan-voice-popup audio::-webkit-media-controls-current-time-display,
                    body.theme-light #megan-voice-popup audio::-webkit-media-controls-time-remaining-display {
                        color: #232323;
                    }
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
            title.textContent = TranslationService.translate('voice_playback');
            title.style.cssText = 'font-size:18px;font-weight:600;margin-bottom:2px;cursor:move;user-select:none;z-index:1;';
            // Drag events
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
            // Аудиоэлемент
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.style.width = '100%';
            audio.style.marginTop = '10px';
            audio.style.background = 'transparent';
            audio.style.outline = 'none';
            audio.style.borderRadius = '8px';
            audio.style.boxShadow = 'none';
            audio.style.display = 'none'; // Скрываем до загрузки
            popup.appendChild(audio);
            // Статус
            const status = document.createElement('div');
            status.textContent = TranslationService.translate('synthesizing_voice');
            status.style.cssText = 'font-size:14px;color:#aaa;margin-top:8px;';
            popup.appendChild(status);
            // Добавить popup на страницу
            document.body.appendChild(popup);
            // --- Тема ---
            function applyPopupTheme() {
                const isLight = document.body.classList.contains('theme-light');
                popup.classList.toggle('megan-voice-popup-light', isLight);
                popup.classList.toggle('megan-voice-popup-dark', !isLight);
                closeBtn.style.color = isLight ? '#888' : '#aaa';
                title.style.color = isLight ? '#232323' : '#fff';
                status.style.color = isLight ? '#888' : '#aaa';
            }
            applyPopupTheme();
            const observer = new MutationObserver(applyPopupTheme);
            observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
            // --- Запрос к API ---
            try {
                let token = '';
                if ((window as any).AuthService) {
                    token = String(await (window as any).AuthService.getToken() || '');
                } else if (typeof AuthService !== 'undefined') {
                    token = String(await (AuthService as any).getToken() || '');
                }
                if (!token) {
                    // Нет токена — явно показываем ошибку
                    const notif = document.querySelector('.megan-notification');
                    if (notif) notif.remove();
                    showNotification(TranslationService.translate('login_required_voice'), 'error');
                    status.textContent = TranslationService.translate('login_required_voice');
                    return;
                }
                const API_URL = await getApiUrl();
                const resp = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({
                        type: "TOOLS_LOGIC",
                        url: `${API_URL}/tools/voice/selected`,
                        options: {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": token ? `Bearer ${token}` : ""
                            },
                            body: JSON.stringify({ text: message.text })
                        }
                    }, (response) => {
                        if (!response) reject("No response from background");
                        else if (!response.ok) reject(response);
                        else resolve({ ok: true, json: () => response.data });
                    });
                });
                const data = await (resp as any).json();
                // Скрыть notification после получения результата
                const notif = document.querySelector('.megan-notification');
                if (notif) notif.remove();
                if (data.audio_base64) {
                    audio.src = `data:audio/mp3;base64,${data.audio_base64}`;
                    audio.style.display = '';
                    status.textContent = '';
                    audio.play();
                } else {
                    status.textContent = data.text || TranslationService.translate('could_not_synthesize_audio');
                }
            } catch (err) {
                // Скрыть notification при ошибке
                const notif = document.querySelector('.megan-notification');
                if (notif) notif.remove();
                let errorMsg = '';
                if (err && typeof err === 'object') {
                    if ('status' in err && err.status === 401) {
                        errorMsg = TranslationService.translate('login_required_voice');
                        showNotification(errorMsg, 'error');
                    } else if ('message' in err && typeof err.message === 'string') {
                        errorMsg = err.message;
                    } else {
                        errorMsg = TranslationService.translate('unknown_error');
                    }
                } else if (typeof err === 'string') {
                    errorMsg = err;
                } else {
                    errorMsg = TranslationService.translate('unknown_error');
                }
                status.textContent = errorMsg;
            }
        })();
    } else if (message.type === 'SHOW_CHAT_POPUP') {
        (async () => {
            // Удалить старый попап если есть
            const old = document.getElementById('megan-chat-popup');
            if (old) old.remove();
            // Создать контейнер
            const popup = document.createElement('div');
            popup.id = 'megan-chat-popup';
            popup.style.cssText = `
                position: fixed;
                z-index: 2147483647;
                top: 70px; right: 50px;
                left: auto;
                bottom: auto;
                border-radius: 16px;
                box-shadow: 0 8px 32px #0008;
                padding: 24px 24px 18px 24px;
                min-width: 340px;
                max-width: 1000px;
                height: 300px;
                max-height: 700px;
                font-family: 'Poppins', 'Inter', Arial, sans-serif;
                display: flex;
                flex-direction: column;
                gap: 12px;
                animation: fadeIn 0.2s;
                cursor: default;
                background: #232323;
                color: #fff;
            `;
            // --- Стили для popup ---
            if (!document.getElementById('megan-chat-popup-style')) {
                const style = document.createElement('style');
                style.id = 'megan-chat-popup-style';
                style.textContent = `
                    .megan-chat-popup-dark {
                        background: #232323 !important;
                        color: #fff !important;
                        border: 1.5px solid #715CFF !important;
                    }
                    .megan-chat-popup-light {
                        background: #FAFAFA !important;
                        color: #232323 !important;
                        border: 1.5px solid #AA97FF !important;
                    }
                    body.theme-light #megan-chat-popup {
                        background: #FAFAFA !important;
                        color: #232323 !important;
                        border: 1.5px solid #AA97FF !important;
                    }
                    #megan-chat-popup textarea {
                        width: 100%;
                        min-width: 220px;
                        max-width: 100%;
                        height: 72px;
                        padding: 8px 10px;
                        font-size: 15px;
                        border-radius: 8px;
                        border: 1px solid #444;
                        background: #181818;
                        color: #fff;
                        resize: none;
                        margin-top: 8px;
                        overflow-y: auto;
                    }
                    body.theme-light #megan-chat-popup textarea {
                        background: #fff;
                        color: #232323;
                        border: 1px solid #AA97FF;
                    }
                    #megan-chat-popup .chat-history {
                        background: transparent;
                        color: inherit;
                        overflow-y: auto;
                        margin-bottom: 8px;
                        font-size: 15px;
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    #megan-chat-popup .chat-msg-user {
                        align-self: flex-end;
                        background: #715CFF;
                        color: #fff;
                        border-radius: 10px 10px 2px 10px;
                        padding: 7px 12px;
                        max-width: 80%;
                        word-break: break-word;
                        border: none;
                    }
                    body.theme-light #megan-chat-popup .chat-msg-user {
                        background: #AA97FF;
                        color: #fff;
                    }
                    #megan-chat-popup .chat-msg-ai {
                        align-self: flex-start;
                        background: transparent;
                        color: var(--color-text);
                        border-radius: 10px 10px 10px 2px;
                        padding: 7px 12px;
                        max-width: 80%;
                        word-break: break-word;
                    }
                    #megan-chat-popup .chat-input-row {
                        display: flex;
                        gap: 8px;
                        align-items: flex-end;
                    }
                    #megan-chat-popup .chat-send-btn {
                        background: #715CFF;
                        color: #fff;
                        border: none;
                        border-radius: 8px;
                        padding: 8px 16px;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    #megan-chat-popup .chat-send-btn:active {
                        background: #5a47c7;
                    }
                    /* Анимация "раздумья" */
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
            // --- Кастомный скроллбар для истории чата ---
            if (!document.getElementById('megan-chat-popup-scrollbar-style')) {
                const style = document.createElement('style');
                style.id = 'megan-chat-popup-scrollbar-style';
                style.textContent = `
                    #megan-chat-popup .chat-history {
                        scrollbar-width: thin;
                        scrollbar-color: #715CFF #232323;
                    }
                    #megan-chat-popup .chat-history::-webkit-scrollbar {
                        width: 7px;
                        background: #232323;
                    }
                    #megan-chat-popup .chat-history::-webkit-scrollbar-thumb {
                        background: #715CFF;
                        border-radius: 6px;
                    }
                    #megan-chat-popup .chat-history::-webkit-scrollbar-track {
                        background: #232323;
                    }
                    body.theme-light #megan-chat-popup .chat-history {
                        scrollbar-color: #AA97FF #F5F5F5;
                    }
                    body.theme-light #megan-chat-popup .chat-history::-webkit-scrollbar {
                        background: #F5F5F5;
                    }
                    body.theme-light #megan-chat-popup .chat-history::-webkit-scrollbar-thumb {
                        background: #AA97FF;
                    }
                    body.theme-light #megan-chat-popup .chat-history::-webkit-scrollbar-track {
                        background: #F5F5F5;
                    }
                    /* Не менять цвет бордера textarea при фокусе */
                    #megan-chat-popup textarea:focus {
                        outline: none;
                        border: 1px solid #444 !important;
                    }
                    body.theme-light #megan-chat-popup textarea:focus {
                        border: 1px solid #AA97FF !important;
                    }
                    /* Скрыть скроллбар в textarea */
                    #megan-chat-popup textarea::-webkit-scrollbar {
                        display: none;
                    }
                    #megan-chat-popup textarea {
                        scrollbar-width: none;
                    }
                `;
                document.head.appendChild(style);
            }
            // --- Добавляем resizer для изменения размера ---
            const resizer = document.createElement('div');
            resizer.className = 'megan-chat-popup-resizer';
            resizer.style.cssText = `
                position: absolute;
                width: 22px;
                height: 22px;
                right: 2px;
                bottom: 2px;
                cursor: se-resize;
                z-index: 10;
                background: none;
            `;
            resizer.innerHTML = `<svg width="22" height="22" viewBox="0 0 22 22"><path d="M4 18h14M8 14h10M12 10h6" stroke="#715CFF" stroke-width="2" stroke-linecap="round"/></svg>`;
            popup.appendChild(resizer);
            // --- Стили для resizer (адаптация под тему) ---
            if (!document.getElementById('megan-chat-popup-resizer-style')) {
                const style = document.createElement('style');
                style.id = 'megan-chat-popup-resizer-style';
                style.textContent = `
                    .megan-chat-popup-resizer { user-select: none; }
                    .megan-chat-popup-resizer svg { pointer-events: none; opacity: 0.7; }
                    .megan-chat-popup-resizer:active svg { opacity: 1; }
                `;
                document.head.appendChild(style);
            }
            // --- Логика изменения размера ---
            let isResizing = false;
            let startX = 0, startY = 0, startWidth = 0, startHeight = 0;
            resizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = popup.getBoundingClientRect();
                startWidth = rect.width;
                startHeight = rect.height;
                document.body.style.userSelect = 'none';
                popup.style.cursor = 'se-resize';
            });
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                const minWidth = 320, minHeight = 220, maxWidth = 700, maxHeight = 1000;
                let newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + dx));
                let newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + dy));
                popup.style.width = newWidth + 'px';
                popup.style.height = newHeight + 'px';
            });
            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.userSelect = '';
                    popup.style.cursor = '';
                }
            });
            // Кнопка закрытия
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = 'position:absolute;top:8px;right:12px;background:none;border:none;font-size:22px;color:#aaa;cursor:pointer;z-index:2;';
            closeBtn.onclick = () => popup.remove();
            popup.appendChild(closeBtn);
            // Заголовок
            const title = document.createElement('div');
            title.textContent = TranslationService.translate('chat_with_megan');
            title.style.cssText = 'font-size:18px;font-weight:600;margin-bottom:2px;cursor:move;user-select:none;z-index:1;';
            // Drag events на всё popup, кроме input/textarea/кнопок/resizer
            let isDragging = false, dragOffsetX = 0, dragOffsetY = 0;
            popup.addEventListener('mousedown', (e) => {
                // Не начинать drag, если клик по input, textarea, кнопке, chat-history или resizer
                const target = e.target as HTMLElement;
                if (
                    target.closest('input, textarea, button, .chat-history, .megan-chat-popup-resizer')
                ) return;
                isDragging = true;
                const rect = popup.getBoundingClientRect();
                dragOffsetX = e.clientX - rect.left;
                dragOffsetY = e.clientY - rect.top;
                document.body.style.userSelect = 'none';
                popup.style.cursor = 'move';
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
                if (isDragging) {
                    isDragging = false;
                    document.body.style.userSelect = '';
                    popup.style.cursor = '';
                }
            });
            // Курсор "move" при наведении на popup, кроме интерактивных элементов
            popup.addEventListener('mousemove', (e) => {
                const target = e.target as HTMLElement;
                if (
                    target.closest('input, textarea, button, .chat-history, .megan-chat-popup-resizer')
                ) {
                    popup.style.cursor = '';
                } else if (!isDragging) {
                    popup.style.cursor = 'move';
                }
            });
            // Сброс курсора при уходе мыши
            popup.addEventListener('mouseleave', () => {
                if (!isDragging) popup.style.cursor = '';
            });
            popup.appendChild(title);
            // История чата
            const historyDiv = document.createElement('div');
            historyDiv.className = 'chat-history';
            historyDiv.style.flex = '1 1 0';
            historyDiv.style.minHeight = '0';
            popup.appendChild(historyDiv);
            // Инпут и кнопка
            const inputRow = document.createElement('div');
            inputRow.className = 'chat-input-row';
            inputRow.style.position = 'relative';
            inputRow.style.width = '100%';
            inputRow.style.display = 'flex';
            inputRow.style.alignItems = 'flex-end';
            inputRow.style.marginTop = 'auto';
            const input = document.createElement('textarea');
            input.rows = 1;
            input.placeholder = TranslationService.translate('chat_placeholder');
            input.style.resize = 'none';
            input.style.width = '100%';
            input.style.boxSizing = 'border-box';
            input.style.paddingRight = '70px'; // место для кнопки
            inputRow.appendChild(input);
            const sendBtn = document.createElement('button');
            sendBtn.className = 'chat-send-btn';
            sendBtn.textContent = TranslationService.translate('send');
            sendBtn.style.position = 'absolute';
            sendBtn.style.right = '12px';
            sendBtn.style.bottom = '9px';
            sendBtn.style.height = '36px';
            sendBtn.style.padding = '0 18px';
            sendBtn.style.fontSize = '15px';
            sendBtn.style.fontWeight = '600';
            sendBtn.style.borderRadius = '8px';
            sendBtn.style.background = '#715CFF';
            sendBtn.style.color = '#fff';
            sendBtn.style.border = 'none';
            sendBtn.style.cursor = 'pointer';
            sendBtn.style.transition = 'background 0.2s';
            sendBtn.style.zIndex = '2';
            inputRow.appendChild(sendBtn);
            popup.appendChild(inputRow);
            // Добавить popup на страницу
            document.body.appendChild(popup);
            // --- Тема ---
            function applyPopupTheme() {
                const isLight = document.body.classList.contains('theme-light');
                popup.classList.toggle('megan-chat-popup-light', isLight);
                popup.classList.toggle('megan-chat-popup-dark', !isLight);
                closeBtn.style.color = isLight ? '#888' : '#aaa';
                title.style.color = isLight ? '#232323' : '#fff';
                input.style.background = isLight ? '#fff' : '#181818';
                input.style.color = isLight ? '#232323' : '#fff';
                input.style.border = isLight ? '1px solid #AA97FF' : '1px solid #444';
                sendBtn.style.background = isLight ? '#AA97FF' : '#715CFF';
                sendBtn.style.color = '#fff';
                sendBtn.style.border = 'none';
            }
            applyPopupTheme();
            const observer = new MutationObserver(applyPopupTheme);
            observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
            // --- Логика чата ---
            let isLoading = false;
            let token = '';
            if ((window as any).AuthService) {
                token = String(await (window as any).AuthService.getToken() || '');
            } else if (typeof AuthService !== 'undefined') {
                token = String(await (AuthService as any).getToken() || '');
            }
            if (!token) {
                historyDiv.innerHTML = `<div style="color:#ff5252">${TranslationService.translate('login_required_chat')}</div>`;
                input.disabled = true;
                sendBtn.disabled = true;
                showNotification(TranslationService.translate('login_required_chat'), 'error');
                return;
            }
            // --- Получение WS_URL через background ---
            async function getWsUrl() {
                return new Promise((resolve) => {
                    chrome.runtime.sendMessage({ type: 'GET_WS_URL' }, (resp) => {
                        resolve(resp?.WS_URL || '');
                    });
                });
            }
            const wsUrl = await getWsUrl();
            if (!wsUrl) {
                appendMsg(TranslationService.translate('error_ws_not_connected'), 'ai');
                input.disabled = true;
                sendBtn.disabled = true;
                return;
            }
            const ws = new WebSocket(`${wsUrl}/chat/websocket?token=${token}`);
            ws.onopen = () => {
                // ready
            };
            ws.onmessage = (event) => {
                // Удалить анимацию "раздумья"
                const thinking = historyDiv.querySelector('.ai-thinking-animation');
                if (thinking) thinking.remove();
                try {
                    const data = JSON.parse(event.data);
                    if (data.error) {
                        const errMsg = String(data.error).toLowerCase();
                        if (errMsg.includes('token') || errMsg.includes('auth') || errMsg.includes('401')) {
                            showNotification(TranslationService.translate('login_required_chat'), 'error');
                            appendMsg(TranslationService.translate('login_required_chat'), 'ai');
                            input.disabled = true;
                            sendBtn.disabled = true;
                        } else {
                            appendMsg(TranslationService.translate('error') + ': ' + data.error, 'ai');
                        }
                    } else if (data.text) {
                        appendMsg(data.text, 'ai');
                    }
                } catch (e) {
                    appendMsg(TranslationService.translate('error_invalid_message_format'), 'ai');
                }
                isLoading = false;
                sendBtn.disabled = false;
            };
            ws.onclose = () => {
                // optionally show disconnected
            };
            ws.onerror = () => {
                appendMsg(TranslationService.translate('error_websocket'), 'ai');
                isLoading = false;
                sendBtn.disabled = false;
            };
            // --- Добавление сообщений ---
            // Markdown-аниматор (копия из ChatComponent)
            function animateMessageMarkdown(element: HTMLElement, text: string, speed: number = 4, animate: boolean = true) {
                function escapeHtml(str: string) {
                    return str.replace(/[&<>"]'/g, function (tag: string) {
                        const chars: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
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
            function appendMsg(text: string, who: 'user' | 'ai') {
                const msgDiv = document.createElement('div');
                msgDiv.className = who === 'user' ? 'chat-msg-user' : 'chat-msg-ai';
                if (who === 'ai') {
                    animateMessageMarkdown(msgDiv, text, 4, true);
                } else {
                    msgDiv.textContent = text;
                }
                historyDiv.appendChild(msgDiv);
                historyDiv.scrollTop = historyDiv.scrollHeight;
            }
            // --- Анимация "раздумья" ---
            function showThinkingAnimation() {
                // Удалить предыдущую анимацию, если есть
                const prev = historyDiv.querySelector('.ai-thinking-animation');
                if (prev) prev.remove();
                const anim = document.createElement('div');
                anim.className = 'chat-msg-ai ai-thinking-animation';
                anim.style.alignSelf = 'flex-start';
                anim.style.background = '#353353';
                anim.style.color = '#888';
                anim.style.opacity = '0.7';
                anim.style.fontStyle = 'italic';
                anim.style.padding = '7px 12px';
                anim.style.borderRadius = '10px 10px 10px 2px';
                anim.style.maxWidth = '80%';
                anim.style.marginTop = '2px';
                anim.style.letterSpacing = '0.5px';
                anim.style.fontSize = '15px';
                anim.innerHTML = '<span class="dot dot1">.</span><span class="dot dot2">.</span><span class="dot dot3">.</span>';
                historyDiv.appendChild(anim);
            }
            // --- Отправка сообщения ---
            function sendMessage() {
                const msg = input.value.trim();
                if (!msg || isLoading) return;
                input.value = '';
                appendMsg(msg, 'user');
                isLoading = true;
                sendBtn.disabled = true;
                showThinkingAnimation();
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(msg);
                } else {
                    appendMsg(TranslationService.translate('error_ws_not_connected'), 'ai');
                    isLoading = false;
                    sendBtn.disabled = false;
                }
            }
            sendBtn.onclick = sendMessage;
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
        })();
    } else if (message.type === 'SHOW_NOTIFICATION') {
        showNotification(message.message, message.notifType || 'success');
    }
});

// --- API URL helper ---
async function getApiUrl(): Promise<string> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_API_URL' }, (resp) => {
            resolve(resp?.API_URL || '');
        });
    });
}

// --- Notification system ---
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

// Add notification styles
if (!document.getElementById('megan-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'megan-notification-styles';
    style.textContent = `
        @keyframes meganNotificationSlideIn {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        @keyframes meganNotificationSlideOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
    `;
    document.head.appendChild(style);
}

// Добавить CSS-анимацию для курсора, если не добавлена
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
