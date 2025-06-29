import { NotesService, Note } from '../../services/notes';
import { AuthService } from '../../services/auth';
import { showAuthModal } from './auth';

export class NotesComponent {
    static async initNotes(doc: Document): Promise<void> {
        const listDiv = doc.getElementById('notes-list') as HTMLDivElement;
        const inputArea = doc.getElementById('note-input') as HTMLTextAreaElement;
        const saveBtn = doc.getElementById('save-note') as HTMLButtonElement;
        const searchInput = doc.getElementById('notes-search') as HTMLInputElement | null;
        const noteBody = doc.getElementById('note-body');


        if (noteBody) {
            // Сразу выставить высоту по содержимому (если заметка длинная)
            noteBody.style.height = 'auto';
            noteBody.style.height = noteBody.scrollHeight + 'px';

            // Автоматически увеличивать высоту при вводе
            noteBody.addEventListener('input', function () {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
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
        let token: string | null = await AuthService.getToken();
        if (!token) {
            return;
        }
        // Показать только экран заметки
        screens.forEach(screen => screen.classList.remove('active'));
        doc.getElementById('screen-note-detail')?.classList.add('active');

        // Загрузить заметку
        let note: Note | null = null;
        try {
            note = await NotesService.getNote(noteId, token, doc);
        } catch (e) {
            alert('Ошибка загрузки заметки');
            return;
        }
        titleInp.value = note.title;
        bodyArea.value = note.content;
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
} 