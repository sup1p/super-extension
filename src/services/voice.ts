import { AuthService } from './auth';
import { NotesService } from './notes';
import { TranslationService } from './translations';

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
        const WV_URL = `${WS_URL}/websocket-voice`;
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

        const connectWS = () => {
            if (wv && wv.readyState === WebSocket.OPEN) {
                return;
            }
            wv = new WebSocket(WV_URL);

            wv.onopen = () => {
                console.log('WebSocket подключен');
                statusBubble.textContent = TranslationService.translate('ready_to_listen');
            };

            wv.onmessage = async (e) => {
                const data = JSON.parse(e.data);

                // --- Обработка команды создания заметки по тексту ---
                if (data.command && data.command.action === 'create_note' && data.command.title && data.command.text) {
                    // Создать заметку через NotesService
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
                    try {
                        const note = await NotesService.createNote(data.command.title, data.command.text, token, doc);
                        if (note) {
                            statusBubble.textContent = TranslationService.translate('note_created');
                            // Можно добавить открытие заметки или обновление UI
                        } else {
                            statusBubble.textContent = TranslationService.translate('failed_create_note');
                        }
                    } catch (e) {
                        statusBubble.textContent = TranslationService.translate('error_creating_note');
                    }
                    return;
                }
                // --- /Обработка команды создания заметки ---

                if (data.command) {
                    console.log("📢 Получена команда от сервера:", data.command);
                    if (data.command.action === 'control_media' || data.command.action === 'control_video') {
                        handleMediaCommand(data.command);
                    } else {
                        handleServerCommand(data.command);
                    }
                    return;
                }

                const { text, audio_base64 } = data;
                output.textContent = text;
                statusBubble.textContent = TranslationService.translate('playing_response');

                if (audio_base64) {
                    playResponse(audio_base64);
                } else {
                    statusBubble.textContent = TranslationService.translate('have_something_to_say');
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
                connectWS();
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

