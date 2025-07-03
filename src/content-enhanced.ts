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
        console.log('[content-enhanced] Received CREATE_NOTE message:', message); // LOG 1: Message received
        // Обработка создания заметки по команде от background (например, от voice)
        (async () => {
            try {
                // Получить токен
                let token = '';
                if ((window as any).AuthService) {
                    token = String(await (window as any).AuthService.getToken() || '');
                } else if (typeof AuthService !== 'undefined') {
                    token = String(await (AuthService as any).getToken() || '');
                }
                if (!token) {
                    alert('Login required to save note.');
                    console.log('[content-enhanced] Login required, returning.');
                    return;
                }
                // Импортировать NotesService динамически, если нужно
                let NotesService;
                if ((window as any).NotesService) {
                    NotesService = (window as any).NotesService;
                } else {
                    NotesService = (await import('./services/notes')).NotesService;
                }
                const note = await NotesService.createNote(message.title, message.text, token, document);
                console.log('[content-enhanced] Note creation attempt, message.answer:', message.answer, 'message.audio_base64:', message.audio_base64); // LOG 2: Check message content
                // --- Отправляем данные для озвучки и показа в iframe сайдбара ---
                if (message.answer || message.audio_base64) {
                    const sidebarIframe = document.getElementById('chrome-extension-sidebar') as HTMLIFrameElement | null;
                    console.log('[content-enhanced] sidebarIframe found:', !!sidebarIframe, 'contentWindow available:', !!(sidebarIframe?.contentWindow)); // LOG 3: Iframe status
                    if (sidebarIframe && sidebarIframe.contentWindow) {
                        sidebarIframe.contentWindow.postMessage({
                            type: 'VOICE_FEEDBACK', // Новый специфичный тип для iframe communication
                            answer: message.answer,
                            audio_base64: message.audio_base64
                        }, '*'); // TODO: Ограничить origin для безопасности в продакшене
                        console.log('[content-enhanced] Sent VOICE_FEEDBACK via postMessage.'); // LOG 4: postMessage sent
                    } else {
                        // Fallback если sidebar iframe не найден или не готов (показываем alert и воспроизводим аудио на главной странице)
                        console.log('[content-enhanced] Sidebar iframe not found or not ready, executing fallback.'); // LOG 5: Fallback triggered
                        if (message.answer) {
                            console.log('[content-enhanced] Fallback alert shown.'); // LOG 6: Fallback alert
                        }
                        if (message.audio_base64) {
                            try {
                                const audio = new Audio('data:audio/mp3;base64,' + message.audio_base64);
                                audio.play();
                                console.log('[content-enhanced] Fallback audio played.'); // LOG 7: Fallback audio
                            } catch (e) {
                                console.error('[content-enhanced] Fallback audio error:', e);
                            }
                        }
                    }
                }
                // --- /Отправляем данные в iframe сайдбара ---
                if (note) {
                    console.log('[content-enhanced] Note created alert shown.'); // LOG 9: Note created alert
                    // Открыть детали созданной заметки
                    let NotesComponent;
                    if ((window as any).NotesComponent) {
                        NotesComponent = (window as any).NotesComponent;
                    } else {
                        NotesComponent = (await import('./sidebar/components/notes')).NotesComponent;
                    }
                    await NotesComponent.initNoteDetail(document, note.id);
                } else {
                    alert('Failed to create note.');
                    console.log('[content-enhanced] Failed to create note alert shown.'); // LOG 10: Failed note alert
                }
            } catch (e) {
                console.error('[content-enhanced] Error creating note:', e); // LOG 11: General error
            }
        })();
    }
});
