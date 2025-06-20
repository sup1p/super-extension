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
        const updateTranslateUI = () => {
            const allBlocks = Array.from(document.querySelectorAll('.tool-icon-block'));
            allBlocks.forEach(block => {
                const label = block.querySelector('.tool-label')?.textContent?.toLowerCase();
                if (label === 'translate') {
                    if (translateActive) block.classList.add('active');
                    else block.classList.remove('active');
                }
            });
        };

        items.forEach(el =>
            el.addEventListener('click', async () => {
                const label = (el.querySelector('.tool-label')?.textContent || '').toLowerCase();
                overlay.classList.remove('active');
                if (label === 'translate') {
                    translateActive = !translateActive;
                    if (translateActive) {
                        (window as any).PageTranslateService?.enableTranslateMode();
                        // Получить выбранный язык (по умолчанию en)
                        let lang = 'en';
                        const select = document.getElementById('page-translate-lang-select') as HTMLSelectElement;
                        if (select && select.value) lang = select.value;
                        // Получить токен из глобального AuthService
                        let token = '';
                        if ((window as any).AuthService) {
                            token = await (window as any).AuthService.getToken();
                        }
                        await (window as any).PageTranslateService?.translatePage(lang, token);
                    } else {
                        (window as any).PageTranslateService?.disableTranslateMode();
                    }
                    updateTranslateUI();
                    if (translateActive) {
                        alert('Translate mode enabled! Теперь переводятся только видимые элементы на экране.');
                    }
                }
                if (label === 'summarize') {
                    // Собираем текст
                    const texts = (window as any).PageTranslateService
                        ? (window as any).PageTranslateService.getAllVisibleText()
                        : [];
                    const fullText = texts.join('\n');
                    // Показываем лоадер
                    let loader = document.getElementById('global-page-translate-loader');
                    if (loader) loader.style.display = 'flex';
                    // Получаем токен
                    let token = '';
                    if ((window as any).AuthService) {
                        token = await (window as any).AuthService.getToken();
                    }
                    // Запрос на бэкенд
                    let summary = '';
                    try {
                        const res = await fetch('http://localhost:8000/summarize-page', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'accept': 'application/json',
                                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                            },
                            body: JSON.stringify({ text: fullText })
                        });
                        const data = await res.json();
                        summary = data.summary || data.summarized_text || data.result || '';
                    } catch (e) {
                        summary = 'Error: ' + (e instanceof Error ? e.message : e);
                    }
                    if (loader) loader.style.display = 'none';
                    // Показываем результат в модалке
                    let modal = document.getElementById('summarize-modal');
                    if (!modal) {
                        modal = document.createElement('div');
                        modal.id = 'summarize-modal';
                        modal.className = 'tools-modal-overlay active';
                        modal.innerHTML = `
                          <div class="modal-content" style="max-width:420px;">
                            <div class="modal-header">
                              <div class="modal-title">Summary</div>
                              <button class="modal-close" id="close-summarize-modal">×</button>
                            </div>
                            <div style="white-space:pre-line; color:#fff; font-size:16px;">${summary}</div>
                          </div>
                        `;
                        document.body.appendChild(modal);
                    } else {
                        modal.classList.add('active');
                        modal.querySelector('.modal-title')!.textContent = 'Summary';
                        (modal.querySelector('div[style]') as HTMLElement).textContent = summary;
                    }
                    // Закрытие модалки
                    const closeBtn = modal.querySelector('#close-summarize-modal');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            modal!.classList.remove('active');
                        });
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
