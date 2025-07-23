import { AuthService } from './auth';
import { TranslationService } from './translations';

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

export class VoiceService {
    private static _startListening: (() => Promise<void>) | null = null;
    private static _stopListening: (() => void) | null = null;
    private static _isListening: (() => boolean) | null = null;

    static initVoice(doc: Document): void {
        const voiceScreen = doc.getElementById('screen-voice');
        if (!voiceScreen) return;

        const statusBubble = doc.getElementById("voice-status-bubble") as HTMLParagraphElement;
        const output = doc.getElementById("voice-result") as HTMLParagraphElement;
        const waveformContainer = doc.getElementById("voice-waveform-container") as HTMLDivElement;

        const NUM_BARS = 32;
        const bars: HTMLElement[] = [];
        for (let i = 0; i < NUM_BARS; i++) {
            const bar = doc.createElement('div');
            bar.className = 'waveform-bar';
            bar.style.height = '2px';
            waveformContainer.appendChild(bar);
            bars.push(bar);
        }

        let manualClose = false;
        console.log(manualClose);

        const API_URL = import.meta.env.VITE_API_URL;
        const WS_URL = import.meta.env.VITE_WS_URL || API_URL.replace(/^http(s?):\/\//, 'wss://');
        let wv: WebSocket | null = null;
        let rec: MediaRecorder | null = null;
        let stream: MediaStream | null = null;
        let chunks: BlobPart[] = [];
        let isListening = false;
        let isPlaying = false;
        let currentAudio: HTMLAudioElement | null = null;

        // Детекция молчания
        let silenceTimer: NodeJS.Timeout | null = null;
        let audioContext: AudioContext | null = null;
        let analyser: AnalyserNode | null = null;
        let dataArray: Uint8Array | null = null;
        let lastSoundTime = 0;
        let silenceCheckInterval: NodeJS.Timeout | null = null;
        let animationFrameId: number;


        const SILENCE_THRESHOLD = 20; // Lowered threshold for more sensitivity
        const SILENCE_DURATION = 2000;
        const CHECK_INTERVAL = 100;
        const MIN_AUDIO_DURATION = 500;
        const MAX_AUDIO_DURATION = 30000;
        let recordingStartTime = 0;

        const connectWS = async () => {
            if (wv && wv.readyState === WebSocket.OPEN) {
                return;
            }
            let token: string = '';
            if ((window as any).AuthService) {
                token = String(await (window as any).AuthService.getToken() || '');
            } else if (AuthService) {
                token = String(await AuthService.getToken() || '');
            }
            if (!token) {
                statusBubble.textContent = TranslationService.translate('login_required');
                return;
            }
            const WV_URL_WITH_TOKEN = `${WS_URL}/websocket-voice?token=${encodeURIComponent(token)}`;
            wv = new WebSocket(WV_URL_WITH_TOKEN);

            wv.onopen = () => {
                console.log('WebSocket подключен');
                statusBubble.textContent = TranslationService.translate('ready_to_listen');
            };

            wv.onmessage = async (e) => {
                const data = JSON.parse(e.data);
                console.log('[voice.ts - WebSocket] Raw message data from server:', data); // LOG: Raw server data

                // --- ОБРАБОТКА ОШИБОК ОТ СЕРВЕРА (например, лимит превышен) ---
                if (data.error) {
                    let errorMsg = '';
                    if (String(data.error).toLowerCase().includes('limit')) {
                        errorMsg = TranslationService.translate('limit_exceeded'); // Добавь такой ключ в переводы
                    } else {
                        errorMsg = data.error;
                    }
                    statusBubble.textContent = errorMsg;
                    output.textContent = errorMsg;
                    // Остановить прослушивание, если лимит
                    if (String(data.error).toLowerCase().includes('limit')) {
                        isListening = false;
                        if (rec && rec.state === 'recording') rec.stop();
                        if (currentAudio) currentAudio.pause();
                    }
                    return;
                }
                // --- /ОБРАБОТКА ОШИБОК ОТ СЕРВЕРА ---

                // --- Обработка команды создания заметки по тексту ---
                // if (data.command && data.command.action === 'create_note' && data.command.title && data.command.text) {
                //     handleServerCommand(data.command);
                // }
                // --- /Обработка команды создания заметки ---

                // --- Обработка других команд от сервера ---
                if (data.command) {
                    console.log("📢 [voice.ts - WebSocket] Получена команда от сервера:", data.command); // LOG: Command detail
                    if (data.command.action === 'control_media' || data.command.action === 'control_video') {
                        handleMediaCommand(data.command);
                    } else {
                        handleServerCommand(data.command);
                    }
                }

                // --- УНИВЕРСАЛЬНАЯ ОЗВУЧКА и ПОКАЗ ОТВЕТА (для всех типов сообщений, после обработки команды) ---
                const responseText = data.answer || data.text;
                const responseAudioBase64 = data.audio_base64;

                if (responseText) {
                    output.textContent = responseText;
                    statusBubble.textContent = TranslationService.translate('playing_response'); // Или более специфичный статус
                } else if (statusBubble.textContent !== TranslationService.translate('listening')) { // Если нет текста ответа, но мы не слушаем
                    statusBubble.textContent = TranslationService.translate('have_something_to_say');
                }

                if (responseAudioBase64) {
                    playResponse(responseAudioBase64);
                }
            };
        };

        const setupMicrophone = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1,
                        sampleRate: 16000
                    }
                });

                audioContext = new AudioContext({
                    sampleRate: 16000
                });
                analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);

                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = 0.5;
                const bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);

                rec = new MediaRecorder(stream, {
                    mimeType: 'audio/webm;codecs=opus',
                    audioBitsPerSecond: 16000
                });

                rec.ondataavailable = e => {
                    if (e.data.size > 0) chunks.push(e.data);
                };

                rec.onstop = () => {
                    // ВСЕГДА отправляем последний кусок, даже если isListening === false
                    const recordingDuration = Date.now() - recordingStartTime;

                    if (recordingDuration < MIN_AUDIO_DURATION) {
                        console.log('Запись слишком короткая, игнорируем');
                        chunks = [];
                        return;
                    }

                    if (recordingDuration > MAX_AUDIO_DURATION) {
                        console.log('Запись слишком длинная, обрезаем');
                    }

                    console.log('Запись остановлена, длительность:', recordingDuration, 'мс');

                    if (chunks.length > 0) {
                        const blob = new Blob(chunks, { type: 'audio/webm' });
                        if (blob.size > 1000) {
                            sendAudio(blob);
                            statusBubble.textContent = TranslationService.translate('thinking');
                        } else {
                            console.log('Аудио слишком маленькое, игнорируем');
                        }
                    }
                    chunks = [];

                    // Если нужно, перезапускаем запись только если isListening и !isPlaying
                    if (isListening && !isPlaying) {
                        setTimeout(() => {
                            if (rec && isListening && !isPlaying) {
                                console.log('Перезапуск записи');
                                rec.start();
                                recordingStartTime = Date.now();
                            }
                        }, 100);
                    }
                };

                return true;
            } catch (error) {
                console.error('Ошибка доступа к микрофону:', error);
                statusBubble.textContent = TranslationService.translate('microphone_denied');
                return false;
            }
        };

        const sendAudio = async (blob: Blob) => {
            if (wv && wv.readyState === WebSocket.OPEN) {
                console.log('Отправка аудио, размер:', blob.size);
                const arrayBuffer = await blob.arrayBuffer();
                const tabs = await getTabs();
                wv.send(JSON.stringify({ text: JSON.stringify({ tabs }) }));
                wv.send(arrayBuffer);
            }
        };

        const playResponse = (audioBase64: string) => {
            console.log('Начало воспроизведения ответа');

            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }

            if (rec && rec.state === 'recording') {
                rec.stop();
                chunks = [];
            }

            stopSilenceDetection();

            isPlaying = true;
            currentAudio = new Audio('data:audio/mp3;base64,' + audioBase64);

            currentAudio.onended = () => {
                console.log('Воспроизведение завершено');
                isPlaying = false;
                currentAudio = null;
                statusBubble.textContent = TranslationService.translate('listening');

                if (isListening && rec) {
                    setTimeout(() => {
                        if (isListening && !isPlaying) {
                            console.log('Возобновление записи после воспроизведения');
                            rec!.start();
                            startSilenceDetection();
                        }
                    }, 200);
                }
            };

            currentAudio.onerror = () => {
                console.error('Ошибка воспроизведения');
                isPlaying = false;
                currentAudio = null;
                statusBubble.textContent = TranslationService.translate('error_playing_response');

                if (isListening && rec) {
                    rec.start();
                    startSilenceDetection();
                }
            };

            currentAudio.play().catch(e => {
                console.error("Playback error:", e);
                statusBubble.textContent = TranslationService.translate('could_not_play_audio');
                isPlaying = false;
            });
        };

        const getAverageAudioLevel = (): number => {
            if (!analyser || !dataArray) return 0;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            return sum / dataArray.length;
        };

        const updateWaveform = () => {
            if (!isListening || isPlaying || !analyser || !dataArray) {
                bars.forEach(bar => bar.style.height = '2px');
                return;
            }

            analyser.getByteFrequencyData(dataArray);

            const halfBarCount = Math.ceil(NUM_BARS / 2);
            const bufferLength = analyser.frequencyBinCount;
            const step = Math.floor(bufferLength / halfBarCount);

            for (let i = 0; i < halfBarCount; i++) {
                let sum = 0;
                for (let j = 0; j < step; j++) {
                    sum += dataArray[i * step + j];
                }
                const avg = sum / step;
                const height = Math.max(2, Math.min(60, (avg / 255) * 60));

                const bar1 = bars[halfBarCount - 1 - i];
                const bar2 = bars[halfBarCount + i];

                if (bar1) bar1.style.height = `${height}px`;
                if (bar2) bar2.style.height = `${height}px`;
            }
        };

        const visualize = () => {
            updateWaveform();
            animationFrameId = requestAnimationFrame(visualize);
        };


        const checkSilence = () => {
            if (!isListening || isPlaying) return;

            const audioLevel = getAverageAudioLevel();
            const currentTime = Date.now();

            if (audioLevel > SILENCE_THRESHOLD) {
                lastSoundTime = currentTime;
                if (silenceTimer) {
                    clearTimeout(silenceTimer);
                    silenceTimer = null;
                }
            } else {
                if (lastSoundTime > 0) {
                    const silenceDuration = currentTime - lastSoundTime;
                    if (silenceDuration >= SILENCE_DURATION) {
                        processSilence();
                    } else if (!silenceTimer) {
                        const remainingTime = SILENCE_DURATION - silenceDuration;
                        silenceTimer = setTimeout(processSilence, remainingTime);
                    }
                }
            }
        };

        const processSilence = () => {
            console.log('Обработка молчания - останавливаем запись');

            if (silenceTimer) {
                clearTimeout(silenceTimer);
                silenceTimer = null;
            }

            if (rec && rec.state === 'recording') {
                rec.stop();
                // НЕ очищаем chunks здесь!
            }

            lastSoundTime = 0;
        };

        const startSilenceDetection = () => {
            console.log('Начало детекции молчания');
            lastSoundTime = Date.now();

            if (silenceCheckInterval) {
                clearInterval(silenceCheckInterval);
            }

            silenceCheckInterval = setInterval(checkSilence, CHECK_INTERVAL);
        };

        const stopSilenceDetection = () => {
            console.log('Остановка детекции молчания');

            if (silenceCheckInterval) {
                clearInterval(silenceCheckInterval);
                silenceCheckInterval = null;
            }

            if (silenceTimer) {
                clearTimeout(silenceTimer);
                silenceTimer = null;
            }

            lastSoundTime = 0;
        };

        const startListening = async () => {
            if (isListening) {
                return;
            }
            console.log('Начало прослушивания');
            output.textContent = '';
            manualClose = false;

            if (!wv || wv.readyState !== WebSocket.OPEN) {
                await connectWS();
            }

            if (wv && wv.readyState === WebSocket.OPEN) {
                const tabs = await getTabs();
                wv.send(JSON.stringify({ tabs }));
            }

            if (!stream && !(await setupMicrophone())) {
                statusBubble.textContent = TranslationService.translate('could_not_access_microphone');
                return;
            }

            isListening = true;
            statusBubble.textContent = TranslationService.translate('listening');

            if (rec) {
                chunks = [];
                recordingStartTime = Date.now();
                rec.start();
                startSilenceDetection();
                visualize();
            }
        };

        const stopListening = () => {
            console.log('Остановка прослушивания');

            // Не вызываем processSilence напрямую, просто останавливаем запись
            isListening = false;
            statusBubble.textContent = TranslationService.translate('voice_waiting');

            cancelAnimationFrame(animationFrameId);
            bars.forEach(bar => bar.style.height = '2px');
            stopSilenceDetection();

            if (rec && rec.state === 'recording') {
                rec.stop(); // Это вызовет onstop, где и будет отправка
                // НЕ очищаем chunks здесь!
            }

            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
                isPlaying = false;
            }
        };

        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isActive = (mutation.target as HTMLElement).classList.contains('active');
                    if (isActive) {
                        startListening();
                    } else {
                        stopListening();
                    }
                }
            }
        });

        observer.observe(voiceScreen, { attributes: true });

        // Initial check in case it's already active
        if (voiceScreen.classList.contains('active')) {
            startListening();
        }

        // expose for external use
        VoiceService._startListening = startListening;
        VoiceService._stopListening = stopListening;
        VoiceService._isListening = () => isListening;

        // --- Listener для сообщений из родительского окна (content-enhanced.ts) ---
        window.addEventListener('message', (event) => {
            // Важно: Проверяйте origin в продакшене!
            // if (event.origin !== 'Ваш_Ожидаемый_Origin') return;

            const message = event.data;

            if (message.type === 'VOICE_FEEDBACK') {
                console.log('[voice.ts - iframe] Получено VOICE_FEEDBACK', message);
                if (message.answer) {
                    output.textContent = message.answer;
                    // Также можем обновить statusBubble если нужно, например, "Заметка создана: [ответ]"
                    statusBubble.textContent = message.answer;
                    console.log('[voice.ts - iframe] Показал текст на voice-result');
                }
                if (message.audio_base64) {
                    try {
                        const audio = new Audio('data:audio/mp3;base64,' + message.audio_base64);
                        audio.play();
                        console.log('[voice.ts - iframe] Воспроизвожу аудио');
                    } catch (e) {
                        console.error('[voice.ts - iframe] Ошибка воспроизведения аудио', e);
                    }
                }
            }
        });
    }

    static async startListening() {
        if (VoiceService._startListening) await VoiceService._startListening();
    }

    static stopListening() {
        if (VoiceService._stopListening) VoiceService._stopListening();
    }

    static isListening() {
        return VoiceService._isListening ? VoiceService._isListening() : false;
    }

    static async readTextAloud(_: string, __?: string, statusBubble?: HTMLElement): Promise<string | undefined> {
        // Вместо текста используем url текущей страницы
        try {
            if (statusBubble) statusBubble.textContent = TranslationService.translate('synthesizing_voice');
            const API_URL = import.meta.env.VITE_API_URL;
            const token = await AuthService.getToken();
            const url = `${API_URL}/tools/voice/website_summary`;
            const pageUrl = window.location.href;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const data = await fetchViaBackground(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ url: pageUrl })
            });
            if (!data.audio_base64) throw new Error('No audio in TTS response');
            if (statusBubble) statusBubble.textContent = '';
            return data.audio_base64;
        } catch (e) {
            console.error('TTS error:', e);
            if (statusBubble) statusBubble.textContent = TranslationService.translate('could_not_synthesize_audio');
            return undefined;
        }
    }
}

const getTabs = (): Promise<{ id: number; index: number; url: string; active: boolean }[]> => {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_TABS' }, (response) => {
            resolve(response.tabs);
        });
    });
};

// const findUrlByKeyword = async (keyword: string): Promise<string | null> => {
//     const tabs = await getTabs();
//     keyword = keyword.toLowerCase();
//     const match = tabs.find(tab => tab.url.toLowerCase().includes(keyword));
//     return match ? match.url : null;
// };

const handleServerCommand = async (command: { action: string; tab?: any; tabIndex?: number; url?: string }) => {
    console.log(command);
    chrome.runtime.sendMessage({
        type: 'EXECUTE_COMMAND',
        payload: command
    });
};

/**
 * Отправляет media-команду (например, play/pause/next/prev) в background script.
 * Используйте для управления любыми медиа-элементами (видео, аудио и т.д.).
 *
 * Пример команды, которую должен вернуть сервер:
 * {
 *   "command": {
 *     "action": "control_media",
 *     "mediaCommand": "next" // play | pause | next | prev | forward | backward
 *   }
 * }
 *
 * mediaCommand — строка, определяющая действие с медиа (play, pause, next, prev и т.д.)
 */
const handleMediaCommand = async (command: { action: string; mediaCommand: string;[key: string]: any }) => {
    console.log(command);
    chrome.runtime.sendMessage({
        type: 'EXECUTE_COMMAND',
        payload: command
    });
};

