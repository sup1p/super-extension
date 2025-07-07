import { NotesService } from '../../services/notes';
import { NotesComponent } from './notes';

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

export class ToolsComponent {
    static initTools(doc: Document): void {
        const overlay = doc.getElementById('tools-modal') as HTMLElement;
        const button = doc.querySelector('button[title="Tools"]') as HTMLButtonElement;
        const modal = overlay?.querySelector('.modal-content') as HTMLElement;
        const items = overlay?.querySelectorAll('.tool-icon-block') ?? [];

        if (!overlay || !button || !modal) return;

        /* открыть */
        const open = () => overlay.classList.add('active');

        /* отложенное закрытие (200 мс) */
        let timer: number | null = null;
        const scheduleClose = () => {
            if (timer) clearTimeout(timer);
            timer = window.setTimeout(() => {
                // Check if mouse is over either the button or the modal content
                const isOverButton = button.matches(':hover');
                const isOverModal = modal.matches(':hover');
                if (!isOverButton && !isOverModal) {
                    overlay.classList.remove('active');
                }
            }, 200);
        };

        /* события */
        button.addEventListener('mouseenter', open);
        button.addEventListener('mouseleave', scheduleClose);
        modal.addEventListener('mouseenter', () => {
            if (timer) clearTimeout(timer);
        });
        modal.addEventListener('mouseleave', scheduleClose);

        // --- Translate Mode ---
        let translateActive = false;

        const API_URL = import.meta.env.VITE_API_URL;

        items.forEach(el =>
            el.addEventListener('click', async () => {
                const toolType = el.getAttribute('data-tool');
                const label = (el.querySelector('.tool-label')?.textContent || '').toLowerCase();
                overlay.classList.remove('active');
                if (label === 'translate' || toolType === 'translate') {
                    // Вместо мгновенного запуска перевода открываем модалку выбора языка
                    const langModal = doc.getElementById('page-translate-lang-modal');
                    if (langModal) {
                        langModal.classList.add('active');
                        // Найдём confirm-кнопку и повесим обработчик (один раз)
                        const confirmBtn = doc.getElementById('page-translate-confirm');
                        if (confirmBtn && !(confirmBtn as any)._listenerAdded) {
                            (confirmBtn as any)._listenerAdded = true;
                            confirmBtn.addEventListener('click', async () => {
                                // Получить выбранный язык
                                let lang = 'en';
                                const langList = doc.getElementById('lang-modal-dropdown-list');
                                const langSelected = doc.getElementById('lang-modal-dropdown-selected');
                                if (langSelected && langList) {
                                    // Найти выбранный язык по тексту
                                    const selectedText = langSelected.textContent;
                                    const selectedOpt = Array.from(langList.children).find(opt => opt.textContent === selectedText);
                                    if (selectedOpt) {
                                        lang = selectedOpt.getAttribute('data-value') || 'en';
                                    }
                                }
                                // Получить токен
                                let token = '';
                                if ((window as any).AuthService) {
                                    token = await (window as any).AuthService.getToken();
                                }
                                (window as any).PageTranslateService?.startTranslation(lang, token);
                                langModal.classList.remove('active');
                            });
                        }
                    }
                }
                if (label === 'summarize' || toolType === 'summarize') {
                    const loader = doc.getElementById('global-page-translate-loader');
                    try {
                        // Собираем текст
                        const texts = (window as any).PageTranslateService
                            ? (window as any).PageTranslateService.getAllVisibleText()
                            : [];
                        const fullText = texts.join('\n');
                        // Показываем лоадер
                        if (loader) loader.style.display = 'flex';
                        // Получаем токен
                        let token = '';
                        if ((window as any).AuthService) {
                            token = await (window as any).AuthService.getToken();
                        }
                        let summary = '';
                        try {
                            const data = await fetchViaBackground(
                                `${API_URL}/tool/summarize`,
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'accept': 'application/json',
                                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                    },
                                    body: JSON.stringify({ text: fullText })
                                }
                            );
                            summary = typeof data === 'string' ? data : (data.summary || JSON.stringify(data));
                            summary = summary.replace(/\n/g, "\\n");
                        } catch (e) {
                            summary = 'Error: ' + (e instanceof Error ? e.message : e);
                        }
                        // Создаём заметку и открываем детали
                        const noteTitle = window.location.hostname;
                        const newNote = await NotesService.createNote(noteTitle, summary, token, doc);
                        if (newNote) {
                            const docAny = doc as any;
                            if (typeof docAny.renderNotes === 'function') {
                                await docAny.renderNotes();
                            }
                            await NotesComponent.initNoteDetail(doc, newNote.id);
                        }
                    } catch (e) {
                        alert('Ошибка создания заметки: ' + (e instanceof Error ? e.message : e));
                    } finally {
                        if (loader) loader.style.display = 'none';
                    }
                }
            }),
        );
        // --- Авто-перевод при скролле, если режим включён ---
        window.addEventListener('scroll', async () => {
            if (translateActive && (window as any).PageTranslateService?.isTranslateModeEnabled()) {
                // Можно добавить debounce
                await (window as any).PageTranslateService.translatePage('en'); // или выбранный язык
            }
        });
    }
}
