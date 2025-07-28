import { NotesService, Note, EventService, Event } from '../../services/notes';
import { AuthService } from '../../services/auth';
import { showNotification } from '../../content-enhanced';
import { TranslationService } from '../../services/translations';
import { showAuthModal } from './auth';

export class NotesComponent {
    static async initNotes(doc: Document): Promise<void> {
        const listDiv = doc.getElementById('notes-list') as HTMLDivElement;
        const inputArea = doc.getElementById('note-input') as HTMLTextAreaElement;
        const saveBtn = doc.getElementById('save-note') as HTMLButtonElement;
        const searchInput = doc.getElementById('notes-search') as HTMLInputElement | null;
        const noteBody = doc.getElementById('note-body') as HTMLTextAreaElement;


        function resizeNoteBody(textarea: HTMLTextAreaElement) {
            textarea.style.height = 'auto';
            const minHeight = 180;
            const maxHeight = Math.round(window.innerHeight * 0.7); // 80vh
            let newHeight = Math.max(Math.min(textarea.scrollHeight, maxHeight), minHeight);
            textarea.style.height = newHeight + 'px';
            textarea.style.overflowY = (textarea.scrollHeight > maxHeight) ? 'auto' : 'hidden';
        }

        if (noteBody) {
            // Сразу выставить высоту по содержимому (если заметка длинная)
            resizeNoteBody(noteBody);
            // Автоматически увеличивать высоту при вводе
            noteBody.addEventListener('input', function () {
                resizeNoteBody(noteBody);
            });
            window.addEventListener('resize', function () {
                resizeNoteBody(noteBody);
            });
        }

        let notes: Note[] = [];
        let filteredNotes: Note[] = [];
        let token: string | null = null;

        // Получить токен
        token = await AuthService.getToken();
        if (!token) {
            showAuthModal(doc);
            return;
        }

        // Получить все заметки
        async function loadNotes() {
            try {
                notes = await NotesService.getAllNotes(token!, doc);
                filteredNotes = notes;
                render();
            } catch (e) {
                showAuthModal(doc);
            }
        }

        // Рендер списка заметок
        function render() {
            listDiv.innerHTML = '';
            (searchInput ? filteredNotes : notes).forEach(n => {
                const row = document.createElement('div');
                row.className = 'note-row';
                row.onclick = () => openDetail(n.id);
                const title = document.createElement('div');
                title.textContent = n.title || 'Без названия';
                title.style.cssText = 'font-weight:600;font-size:16px;';
                const preview = document.createElement('div');
                preview.textContent = n.content.length > 40 ? n.content.slice(0, 40) + '…' : n.content;
                preview.style.cssText = 'color:#aaa;font-size:13px;';
                row.appendChild(title);
                row.appendChild(preview);
                listDiv.appendChild(row);
            });
        }

        // Поиск
        if (searchInput) {
            searchInput.oninput = () => {
                const q = searchInput.value.toLowerCase();
                filteredNotes = notes.filter(n =>
                    n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
                );
                render();
            };
        }

        // Создание заметки
        saveBtn.onclick = async () => {
            const content = inputArea.value.trim();
            if (!content) return;
            try {
                const newNote = await NotesService.createNote('', content, token!, doc);
                inputArea.value = '';
                await loadNotes();
                if (newNote) {
                    openDetail(newNote.id);
                }
            } catch (e) {
                alert('Ошибка создания заметки');
            }
        };

        // Сохранять заметку по Enter (без Shift)
        inputArea.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveBtn.click();
            }
        });

        // Открыть детальный просмотр
        function openDetail(id: number) {
            NotesComponent.initNoteDetail(doc, id);
        }

        // Первичная загрузка
        await loadNotes();
        (doc as any).renderNotes = loadNotes;
    }

    static async initNoteDetail(doc: Document, noteId: number): Promise<void> {
        const titleInp = doc.getElementById('note-title') as HTMLInputElement;
        const bodyArea = doc.getElementById('note-body') as HTMLTextAreaElement;
        const updateBtn = doc.getElementById('update-note') as HTMLButtonElement;
        const backBtn = doc.getElementById('back-to-notes') as HTMLButtonElement;
        const deleteBtn = doc.getElementById('delete-note') as HTMLButtonElement;
        const screens = doc.querySelectorAll<HTMLElement>('.screen');
        const screenNoteDetail = doc.getElementById('screen-note-detail');

        // Проверяем наличие всех необходимых элементов
        if (!titleInp || !bodyArea || !updateBtn || !backBtn || !deleteBtn || !screenNoteDetail) {
            console.error('Some note detail elements are missing');
            return;
        }

        let token: string | null = await AuthService.getToken();
        if (!token) {
            return;
        }

        // Показать только экран заметки
        screens.forEach(screen => screen.classList.remove('active'));
        screenNoteDetail.classList.add('active');

        // Загрузить заметку
        let note: Note | null = null;
        try {
            note = await NotesService.getNote(noteId, token, doc);
            if (!note) {
                showNotification('Error loading note', 'error');
                return;
            }
        } catch (e) {
            showNotification('Error loading note', 'error');
            return;
        }

        titleInp.value = note.title;
        bodyArea.value = note.content;

        function resizeNoteBody(textarea: HTMLTextAreaElement) {
            textarea.style.height = 'auto';
            const minHeight = 180;
            const maxHeight = Math.round(window.innerHeight * 0.7); // 80vh
            let newHeight = Math.max(Math.min(textarea.scrollHeight, maxHeight), minHeight);
            textarea.style.height = newHeight + 'px';
            textarea.style.overflowY = (textarea.scrollHeight > maxHeight) ? 'auto' : 'hidden';
        }

        // После того как .active установлен и value заполнен:
        resizeNoteBody(bodyArea);

        // При каждом input:
        bodyArea.addEventListener('input', function () {
            resizeNoteBody(bodyArea);
        });
        // При каждом изменении размера окна:
        window.addEventListener('resize', function () {
            resizeNoteBody(bodyArea);
        });

        bodyArea.focus();
        bodyArea.selectionStart = bodyArea.value.length;

        // Сохранить изменения
        updateBtn.onclick = async () => {
            try {
                await NotesService.updateNote(noteId, titleInp.value.trim(), bodyArea.value, token!, doc);
                (doc as any).renderNotes();
                showScreen('screen-notes');
            } catch (e) {
                alert('Ошибка обновления заметки');
            }
        };
        // Назад
        backBtn.onclick = () => {
            showScreen('screen-notes');
        };
        // Удалить
        deleteBtn.onclick = async () => {
            // Показываем кастомную модалку
            const modal = doc.getElementById('delete-note-modal');
            if (!modal) return;
            modal.classList.add('active');

            // Обработчики кнопок модалки
            const confirmBtn = doc.getElementById('delete-note-confirm');
            const cancelBtn = doc.getElementById('delete-note-cancel');

            // Чтобы не навешивать несколько раз
            function cleanup() {
                if (modal) modal.classList.remove('active');
                if (confirmBtn) confirmBtn.replaceWith(confirmBtn.cloneNode(true));
                if (cancelBtn) cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            }

            if (confirmBtn && cancelBtn) {
                confirmBtn.onclick = async () => {
                    cleanup();
                    try {
                        await NotesService.deleteNote(noteId, token!, doc);
                        (doc as any).renderNotes();
                        showScreen('screen-notes');
                    } catch (e) {
                        alert('Ошибка удаления заметки');
                    }
                };
                cancelBtn.onclick = () => {
                    cleanup();
                };
            }
        };
        function showScreen(id: string) {
            screens.forEach(screen => screen.classList.remove('active'));
            doc.getElementById(id)?.classList.add('active');
        }
    }

    static async initCalendar(doc: Document): Promise<void> {
        const calendarBtn = doc.getElementById('calendar-btn');
        const screenNotes = doc.getElementById('screen-notes');
        const screenCalendar = doc.getElementById('screen-calendar');
        const backBtn = doc.getElementById('back-to-notes-from-calendar');
        const calendarGrid = doc.getElementById('calendar-grid');
        const eventsSection = doc.getElementById('calendar-events-section');
        const dateDetails = doc.getElementById('calendar-date-details');
        const selectedDateSpan = doc.getElementById('calendar-selected-date');
        const createEventBtn = doc.getElementById('calendar-create-event-btn');
        const createEventForm = doc.getElementById('calendar-create-event-form');
        const prevMonthBtn = doc.getElementById('calendar-prev-month');
        const nextMonthBtn = doc.getElementById('calendar-next-month');
        const currentMonthDiv = doc.getElementById('calendar-current-month');

        let currentDate = new Date();
        let currentYear = currentDate.getFullYear();
        let currentMonth = currentDate.getMonth();
        let events: Event[] = [];
        let token: string | null = null;

        // Получить токен
        token = await AuthService.getToken();
        if (!token) {
            showAuthModal(doc);
            return;
        }

        const monthNames = [
            TranslationService.translate('january'),
            TranslationService.translate('february'),
            TranslationService.translate('march'),
            TranslationService.translate('april'),
            TranslationService.translate('may_month'),
            TranslationService.translate('june'),
            TranslationService.translate('july'),
            TranslationService.translate('august'),
            TranslationService.translate('september'),
            TranslationService.translate('october'),
            TranslationService.translate('november'),
            TranslationService.translate('december')
        ];

        // Загрузить события
        async function loadEvents() {
            try {
                events = await EventService.getAllEvents(token!, doc);
                renderEvents();
                // Перерисовываем календарь, чтобы подсветить даты с событиями
                updateCalendar();
            } catch (e) {
                console.log('Ошибка загрузки событий:', e);
            }
        }

        // Поиск событий
        const searchInput = doc.getElementById('calendar-events-search') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                renderEvents(searchInput.value.toLowerCase());
            });
        }

        // Рендер событий
        function renderEvents(searchQuery: string = '') {
            const upcomingEventsList = doc.getElementById('calendar-upcoming-events');
            if (!upcomingEventsList) return;

            // Применяем адаптивную высоту
            upcomingEventsList.style.maxHeight = `${getAdaptiveHeight()}px`;

            upcomingEventsList.innerHTML = '';

            // Фильтруем события по дате (показываем только будущие)
            const now = new Date();
            let futureEvents = events.filter(event => {
                const eventDate = new Date(event.start_date);
                return eventDate >= now;
            });

            // Применяем поиск, если есть запрос
            if (searchQuery) {
                futureEvents = futureEvents.filter(event =>
                    event.title.toLowerCase().includes(searchQuery) ||
                    (event.description && event.description.toLowerCase().includes(searchQuery)) ||
                    (event.location && event.location.toLowerCase().includes(searchQuery))
                );
            }

            // Сортируем по дате
            futureEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

            if (futureEvents.length === 0) {
                const noEvents = document.createElement('li');
                noEvents.textContent = searchQuery
                    ? TranslationService.translate('no_search_results')
                    : TranslationService.translate('no_upcoming_events');
                noEvents.style.cssText = 'color: #888; font-style: italic; text-align: center; padding: 20px;';
                upcomingEventsList.appendChild(noEvents);
                return;
            }

            futureEvents.forEach(event => {
                const li = document.createElement('li');
                li.style.cssText = 'background: var(--color-bg); border-radius: 8px; padding: 10px 14px; border: 1px solid var(--color-border);';

                const title = document.createElement('div');
                title.textContent = event.title;
                title.style.cssText = 'font-weight: 600; font-size: 14px; margin-bottom: 4px;';

                const date = document.createElement('div');
                const eventDate = new Date(event.start_date);
                const formattedDate = eventDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                const formattedTime = eventDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
                date.textContent = `${formattedDate} • ${formattedTime}`;
                date.style.cssText = 'color: #888; font-size: 12px;';

                li.appendChild(title);
                li.appendChild(date);
                upcomingEventsList.appendChild(li);
            });
        }

        // Функция для получения адаптивной высоты в зависимости от масштаба экрана
        function getAdaptiveHeight(): number {
            const zoom = window.devicePixelRatio || 1;
            if (zoom <= 1) return 400; // 100% и меньше
            if (zoom <= 1.1) return 300; // 110%
            if (zoom <= 1.25) return 200; // 125%
            if (zoom <= 1.5) return 100; // 150%
            return 100; // Больше 150%
        }

        // Функция для обрезки текста до определенного количества символов
        function truncateText(text: string, maxLength: number = 100): string {
            if (text.length <= maxLength) {
                return text;
            }
            return text.substring(0, maxLength) + '...';
        }

        // Показать события для выбранной даты
        function showEventsForDate(year: number, month: number, day: number) {
            const dateDetailsContainer = doc.getElementById('calendar-date-details');
            const dateEventsContainer = doc.getElementById('calendar-date-events');
            if (!dateDetailsContainer || !dateEventsContainer) return;

            // Применяем адаптивную высоту
            dateEventsContainer.style.maxHeight = `${getAdaptiveHeight()}px`;

            const eventsForDate = events.filter(event => {
                const eventDate = new Date(event.start_date);
                return eventDate.getFullYear() === year &&
                    eventDate.getMonth() === month &&
                    eventDate.getDate() === day;
            });

            dateEventsContainer.innerHTML = '';

            if (eventsForDate.length === 0) {
                const noEvents = document.createElement('div');
                noEvents.textContent = TranslationService.translate('no_events_for_date');
                noEvents.style.cssText = 'color: #888; font-style: italic;';
                dateEventsContainer.appendChild(noEvents);
            } else {
                eventsForDate.forEach(event => {
                    const eventDiv = document.createElement('div');
                    eventDiv.style.cssText = 'background: var(--color-bg); border-radius: 8px; padding: 12px 14px; border: 1px solid var(--color-border); margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); margin-right:42px;';

                    const title = document.createElement('div');
                    title.textContent = event.title;
                    title.style.cssText = 'font-weight: 600; font-size: 14px; margin-bottom: 4px; color: var(--color-text);';

                    const time = document.createElement('div');
                    const eventDate = new Date(event.start_date);
                    const formattedTime = eventDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    });
                    time.textContent = formattedTime;
                    time.style.cssText = 'color: #888; font-size: 12px; margin-bottom: 4px;';

                    if (event.description) {
                        const description = document.createElement('div');
                        description.textContent = truncateText(event.description);
                        description.style.cssText = 'color: #666; font-size: 12px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
                        eventDiv.appendChild(description);
                    }

                    if (event.location) {
                        const location = document.createElement('div');
                        location.textContent = `📍 ${event.location}`;
                        location.style.cssText = 'color: #666; font-size: 12px; margin-bottom: 4px;';
                        eventDiv.appendChild(location);
                    }

                    if (event.reminder > 0) {
                        const reminder = document.createElement('div');
                        reminder.textContent = `⏰ ${event.reminder} minutes before`;
                        reminder.style.cssText = 'color: #666; font-size: 12px; margin-bottom: 8px;';
                        eventDiv.appendChild(reminder);
                    }

                    // Кнопки действий
                    const actionsDiv = document.createElement('div');
                    actionsDiv.style.cssText = 'display: flex; gap: 8px; margin-top: 8px;';

                    const editBtn = document.createElement('button');
                    editBtn.textContent = 'Edit';
                    editBtn.style.cssText = 'background: var(--color-active); color: #fff; border: none; border-radius: 6px; padding: 6px 10px; font-size: 12px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);';
                    editBtn.onclick = () => editEvent(event);

                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.style.cssText = 'background: #ff4444; color: #fff; border: none; border-radius: 6px; padding: 6px 10px; font-size: 12px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);';
                    deleteBtn.onclick = () => deleteEvent(event.id);

                    actionsDiv.appendChild(editBtn);
                    actionsDiv.appendChild(deleteBtn);

                    eventDiv.appendChild(title);
                    eventDiv.appendChild(time);
                    eventDiv.appendChild(actionsDiv);
                    dateEventsContainer.appendChild(eventDiv);
                });
            }
        }

        // Функция редактирования события
        async function editEvent(_event: Event) {
            // TODO: Реализовать редактирование события
            showNotification('Edit functionality will be implemented soon', 'error');
        }

        // Функция удаления события
        async function deleteEvent(eventId: number) {
            // Кастомная модалка подтверждения удаления события
            let customModal = doc.getElementById('delete-event-modal') as HTMLElement | null;
            if (customModal) customModal.remove();
            customModal = doc.createElement('div');
            customModal.id = 'delete-event-modal';
            customModal.className = 'tools-modal-overlay active';
            customModal.innerHTML = `
                <div class="modal-content tools-modal-content" style="max-width:340px;">
                    <div class="modal-header">
                        <div class="modal-title">Delete event?</div>
                    </div>
                    <div style="margin-bottom:18px; font-size:15px; text-align:center;">Are you sure you want to delete this event? This action cannot be undone.</div>
                    <div style="display:flex; gap:16px; justify-content:center;">
                        <button id="delete-event-confirm" style="background:#ff4444;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:15px;cursor:pointer;">Delete</button>
                        <button id="delete-event-cancel" style="background:#232323;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:15px;cursor:pointer;">Cancel</button>
                    </div>
                </div>
            `;
            doc.body.appendChild(customModal);

            const confirmBtn = doc.getElementById('delete-event-confirm');
            const cancelBtn = doc.getElementById('delete-event-cancel');

            function cleanup() {
                if (customModal) customModal.remove();
                if (confirmBtn) confirmBtn.replaceWith(confirmBtn.cloneNode(true));
                if (cancelBtn) cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            }

            if (confirmBtn && cancelBtn) {
                confirmBtn.onclick = async () => {
                    cleanup();
                    try {
                        await EventService.deleteEvent(eventId, token!, doc);
                        await loadEvents();
                        // Перезагружаем события для текущей даты
                        const selectedDateText = selectedDateSpan?.textContent;
                        if (selectedDateText) {
                            const [year, month, day] = selectedDateText.split('-').map(Number);
                            showEventsForDate(year, month, day);
                        }
                        showNotification('Event deleted successfully!', 'success');
                    } catch (e) {
                        console.error('Error deleting event:', e);
                        showNotification('Error deleting event', 'error');
                    }
                };
                cancelBtn.onclick = () => {
                    cleanup();
                };
            }
        }

        function updateCalendar() {
            if (!calendarGrid || !currentMonthDiv) return;

            const year = currentYear;
            const month = currentMonth;
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const today = new Date();
            const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
            const todayDate = today.getDate();

            // Обновляем заголовок месяца
            currentMonthDiv.textContent = `${monthNames[month]} ${year}`;

            const days: (string | number)[] = [];
            // Начинаем с понедельника (1), а не воскресенья (0)
            const startOffset = firstDay === 0 ? 6 : firstDay - 1;
            for (let i = 0; i < startOffset; i++) days.push('');
            for (let d = 1; d <= daysInMonth; d++) days.push(d);

            calendarGrid.innerHTML = '';

            // Добавляем заголовки дней недели
            const weekdayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
            weekdayKeys.forEach(key => {
                const el = document.createElement('div');
                el.style.fontWeight = 'bold';
                el.style.color = '#888';
                el.style.fontSize = '12px';
                el.textContent = TranslationService.translate(key);
                calendarGrid.appendChild(el);
            });

            days.forEach((d) => {
                const el = document.createElement('div');
                el.textContent = d ? String(d) : '';
                el.style.cursor = d ? 'pointer' : 'default';
                el.style.background = d ? 'transparent' : 'transparent';
                el.style.borderRadius = d ? '50%' : '6px';
                el.style.padding = '6px 0';
                el.style.width = d ? '32px' : 'auto';
                el.style.height = d ? '32px' : 'auto';
                el.style.display = d ? 'flex' : 'block';
                el.style.alignItems = d ? 'center' : 'auto';
                el.style.justifyContent = d ? 'center' : 'auto';
                el.style.margin = d ? 'auto' : '0';
                el.style.transition = d ? 'background-color 0.2s ease' : 'none';

                // Выделяем сегодняшнюю дату
                if (d && isCurrentMonth && d === todayDate) {
                    el.style.background = '#AA97FF';
                    el.style.color = '#fff';
                }

                // Проверяем, есть ли события на эту дату
                const hasEvents = events.some(event => {
                    const eventDate = new Date(event.start_date);
                    return eventDate.getFullYear() === year &&
                        eventDate.getMonth() === month &&
                        eventDate.getDate() === d;
                });

                // Если есть события
                if (hasEvents) {
                    el.dataset.events = 'true';
                    if (!(isCurrentMonth && el.textContent === String(todayDate))) {
                        el.style.background = '#BCADFE';
                    }
                } else {
                    delete el.dataset.events;
                }

                if (d) {
                    // Hover эффект
                    el.addEventListener('mouseenter', () => {
                        const isSelected = el.dataset.selected === 'true';
                        const isToday = isCurrentMonth && el.textContent === String(todayDate);
                        const hasEv = el.dataset.events === 'true';
                        if (!isSelected && !isToday && !hasEv) {
                            el.style.background = 'rgba(128, 128, 128, 0.2)';
                        }
                    });

                    el.addEventListener('mouseleave', () => {
                        const isSelected = el.dataset.selected === 'true';
                        const isToday = isCurrentMonth && el.textContent === String(todayDate);
                        const hasEv = el.dataset.events === 'true';
                        if (!isSelected && !isToday && !hasEv) {
                            el.style.background = 'transparent';
                        } else if (hasEv && !isSelected && !isToday) {
                            el.style.background = '#BCADFE';
                        }
                    });

                    el.addEventListener('click', () => {
                        // Снять выделение со всех дней
                        calendarGrid.querySelectorAll('div').forEach(dayEl => {
                            if (dayEl.dataset.selected === 'true') {
                                delete dayEl.dataset.selected;
                                // Вернуть фон для дня с событиями или прозрачный
                                if (dayEl.dataset.events === 'true') {
                                    dayEl.style.background = '#BCADFE';
                                    dayEl.style.color = 'var(--color-text)';
                                } else {
                                    dayEl.style.background = 'transparent';
                                    dayEl.style.color = 'var(--color-text)';
                                }
                            }
                        });
                        // Выделяем текущий день
                        el.dataset.selected = 'true';
                        el.style.background = '#AA97FF';
                        el.style.color = '#fff';
                        if (eventsSection && dateDetails) {
                            eventsSection.style.display = 'none';
                            dateDetails.style.display = '';
                        }
                        if (selectedDateSpan) {
                            selectedDateSpan.textContent = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        }

                        // Показываем события для выбранной даты
                        if (typeof d === 'number') {
                            showEventsForDate(year, month, d);
                        }
                    });
                }
                calendarGrid.appendChild(el);
            });
        }

        if (calendarBtn && screenNotes && screenCalendar && eventsSection && dateDetails) {
            calendarBtn.addEventListener('click', () => {
                screenNotes.classList.remove('active');
                screenCalendar.classList.add('active');
                // Заголовки переводов
                const upcomingTitle = eventsSection.querySelector('h2');
                if (upcomingTitle) upcomingTitle.textContent = TranslationService.translate('upcoming_events');

                eventsSection.style.display = '';
                dateDetails.style.display = 'none';
                loadEvents();
                updateCalendar();
            });
        }
        if (backBtn && screenNotes && screenCalendar) {
            backBtn.addEventListener('click', () => {
                screenCalendar.classList.remove('active');
                screenNotes.classList.add('active');
            });
        }

        // Навигация по месяцам
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                updateCalendar();
            });
        }

        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                updateCalendar();
            });
        }

        // Кнопка создания события (только показать форму)
        if (createEventBtn && createEventForm) {
            createEventBtn.addEventListener('click', () => {
                createEventForm.style.display = createEventForm.style.display === 'none' ? '' : 'none';
            });
        }

        // Обработка формы создания события
        const eventTitleInput = doc.getElementById('calendar-event-title') as HTMLInputElement;
        const eventDetailsInput = doc.getElementById('calendar-event-details') as HTMLTextAreaElement;
        const eventLocationInput = doc.getElementById('calendar-event-location') as HTMLInputElement;
        const eventTimeInput = doc.getElementById('calendar-event-time') as HTMLInputElement;
        const eventReminderSelect = doc.getElementById('calendar-event-reminder') as HTMLSelectElement;
        const eventSaveBtn = doc.getElementById('calendar-event-save-btn') as HTMLButtonElement;
        const eventCancelBtn = doc.getElementById('calendar-event-cancel-btn') as HTMLButtonElement;
        const eventModal = doc.getElementById('calendar-create-event-modal') as HTMLDivElement;
        const modalCloseBtn = doc.getElementById('calendar-modal-close') as HTMLButtonElement;

        // Показать модальное окно
        if (createEventBtn && eventModal) {
            createEventBtn.addEventListener('click', () => {
                eventModal.style.display = 'block';
                // Фокус на первое поле
                if (eventTitleInput) {
                    eventTitleInput.focus();
                }
            });
        }

        // Закрыть модальное окно
        function closeModal() {
            if (eventModal) {
                eventModal.style.display = 'none';
            }
            // Очищаем форму
            if (eventTitleInput) eventTitleInput.value = '';
            if (eventDetailsInput) eventDetailsInput.value = '';
            if (eventLocationInput) eventLocationInput.value = '';
            if (eventTimeInput) eventTimeInput.value = '12:00';
            if (eventReminderSelect) eventReminderSelect.value = '15';
        }

        // Кнопка закрытия модального окна
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeModal);
        }

        // Закрытие по клику вне модального окна
        if (eventModal) {
            eventModal.addEventListener('click', (e) => {
                if (e.target === eventModal) {
                    closeModal();
                }
            });
        }

        if (eventSaveBtn && eventTitleInput && eventDetailsInput && eventLocationInput && eventTimeInput && eventReminderSelect) {
            eventSaveBtn.addEventListener('click', async () => {
                const title = eventTitleInput.value.trim();
                const description = eventDetailsInput.value.trim();
                const location = eventLocationInput.value.trim();
                const time = eventTimeInput.value;
                const reminder = parseInt(eventReminderSelect.value);

                if (!title) {
                    showNotification('Please enter event title', 'error');
                    return;
                }

                // Получаем выбранную дату
                const selectedDateText = selectedDateSpan?.textContent;
                if (!selectedDateText) {
                    showNotification('Please select a date first', 'error');
                    return;
                }

                try {
                    // Создаем дату в формате ISO для сервера
                    const [year, month, day] = selectedDateText.split('-').map(Number);
                    const [hours, minutes] = time.split(':').map(Number);
                    const eventDate = new Date(year, month - 1, day, hours, minutes, 0);
                    const isoDate = eventDate.toISOString();

                    const newEvent = await EventService.createEvent(
                        {
                            title,
                            description,
                            start_date: isoDate,
                            location,
                            reminder
                        },
                        token!,
                        doc
                    );

                    if (newEvent) {
                        // Закрываем модальное окно
                        closeModal();

                        // Перезагружаем события
                        await loadEvents();

                        // Показываем секцию событий
                        if (eventsSection && dateDetails) {
                            dateDetails.style.display = 'none';
                            eventsSection.style.display = '';
                        }

                        showNotification('Event created successfully!', 'success');
                    } else {
                        showNotification('Failed to create event', 'error');
                    }
                } catch (e) {
                    console.error('Error creating event:', e);
                    showNotification('Error creating event', 'error');
                }
            });
        }

        if (eventCancelBtn) {
            eventCancelBtn.addEventListener('click', closeModal);
        }
    }
} 