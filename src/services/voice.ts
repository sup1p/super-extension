export class VoiceService {
    static initVoice(doc: Document): void {
        const button = doc.getElementById("voice-rec-btn") as HTMLButtonElement;
        const output = doc.getElementById("voice-result") as HTMLParagraphElement;
        const bar = doc.getElementById("voice-level") as HTMLDivElement;
        let manualClose = false;

        const WV_URL = 'ws://localhost:8000/websocket-voice';
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

        const SILENCE_THRESHOLD = 120;
        const SILENCE_DURATION = 2000;
        const CHECK_INTERVAL = 100;
        const MIN_AUDIO_DURATION = 500;
        const MAX_AUDIO_DURATION = 30000;
        let recordingStartTime = 0;

        const connectWS = () => {
            wv = new WebSocket(WV_URL);

            wv.onopen = () => {
                console.log('WebSocket подключен');
                button.disabled = false;
                button.textContent = '🎙️ Start Listening';
                output.textContent = 'Готов к работе';
            };

            wv.onmessage = (e) => {
                const { text, audio_base64 } = JSON.parse(e.data);
                output.textContent = text;

                if (audio_base64) {
                    playResponse(audio_base64);
                }
            };

            wv.onclose = () => {
                console.log('WebSocket закрыт');
                wv = null;
                if (!manualClose) {
                    console.log("Переподключние");
                    setTimeout(connectWS, 1000);
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

                const filter = audioContext.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.value = 300;
                source.connect(filter);
                filter.connect(analyser);

                analyser.fftSize = 1024;
                analyser.smoothingTimeConstant = 0.8;
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
                    if (!isListening || isPlaying) return;

                    const recordingDuration = Date.now() - recordingStartTime;

                    if (recordingDuration < MIN_AUDIO_DURATION) {
                        console.log('Запись слишком короткая, игнорируем');
                        chunks = [];
                        return;
                    }

                    if (recordingDuration > MAX_AUDIO_DURATION) {
                        console.log('Запись слишком длинная, обрезаем');
                        chunks = chunks.slice(-1);
                    }

                    console.log('Запись остановлена, длительность:', recordingDuration, 'мс');

                    if (chunks.length > 0) {
                        const blob = new Blob(chunks, { type: 'audio/webm' });
                        if (blob.size > 1000) {
                            sendAudio(blob);
                        } else {
                            console.log('Аудио слишком маленькое, игнорируем');
                        }
                    }
                    chunks = [];

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
                return false;
            }
        };

        const sendAudio = async (blob: Blob) => {
            if (wv && wv.readyState === WebSocket.OPEN) {
                console.log('Отправка аудио, размер:', blob.size);
                const arrayBuffer = await blob.arrayBuffer();
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

                if (isListening && rec) {
                    rec.start();
                    startSilenceDetection();
                }
            };

            currentAudio.play().catch(console.error);
        };

        const getAudioLevel = (): number => {
            if (!analyser || !dataArray) return 0;

            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            let count = 0;

            const startFreq = Math.floor(dataArray.length * 0.1);
            const endFreq = Math.floor(dataArray.length * 0.5);

            for (let i = startFreq; i < endFreq; i++) {
                if (dataArray[i] > 0) {
                    sum += dataArray[i] * dataArray[i];
                    count++;
                }
            }

            return count > 0 ? Math.sqrt(sum / count) : 0;
        };

        const checkSilence = () => {
            if (!isListening || isPlaying) return;

            const audioLevel = getAudioLevel();
            const currentTime = Date.now();

            if (bar) {
                const percent = Math.min(100, (audioLevel / 256) * 100);
                bar.style.width = percent + "%";
                if (percent < 30) {
                    bar.style.background = '#ff4444';
                } else if (percent < 70) {
                    bar.style.background = '#ffbb33';
                } else {
                    bar.style.background = '#00C851';
                }
            }

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
                chunks = [];
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
            console.log('Начало прослушивания');

            manualClose = false;

            if (!wv || wv.readyState !== WebSocket.OPEN) {
                connectWS();
            }

            if (!stream && !(await setupMicrophone())) {
                output.textContent = 'Ошибка доступа к микрофону';
                return;
            }

            isListening = true;
            button.textContent = '🔴 Stop Listening';
            output.textContent = 'Слушаю...';

            if (rec) {
                chunks = [];
                recordingStartTime = Date.now();
                rec.start();
                startSilenceDetection();
            }
        };

        const stopListening = () => {
            console.log('Остановка прослушивания');

            isListening = false;
            button.textContent = '🎙️ Start Listening';
            output.textContent = 'Остановлено';

            stopSilenceDetection();

            if (rec && rec.state === 'recording') {
                rec.stop();
                chunks = [];
            }

            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
                isPlaying = false;
            }

            if (wv) {
                manualClose = true;
                wv.close();
                wv = null;
            }
        };

        button.onclick = () => {
            if (isListening) {
                stopListening();
            } else {
                startListening();
            }
        };

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && isPlaying) {
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio = null;
                    isPlaying = false;

                    if (isListening && rec) {
                        rec.start();
                        startSilenceDetection();
                    }
                }
            }
        });

        connectWS();
    }
} 