import { NotesService, Note } from '../../services/notes';
import { AuthService } from '../../services/auth';

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
            alert('Требуется авторизация для заметок!');
            return;
        }

        // Получить все заметки
        async function loadNotes() {
            try {
                notes = await NotesService.getAllNotes(token!);
                filteredNotes = notes;
                render();
            } catch (e) {
                alert('Ошибка загрузки заметок');
            }
        }

        // Рендер списка заметок
        function render() {
            listDiv.innerHTML = '';
            (searchInput ? filteredNotes : notes).forEach(n => {
                const row = document.createElement('div');
                row.className = 'note-row';
                row.style.cssText = 'margin-bottom:12px;padding:14px 16px;background:#181818;border-radius:12px;cursor:pointer;box-shadow:0 2px 8px #0002;display:flex;flex-direction:column;gap:2px;';
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
                const newNote = await NotesService.createNote('', content, token!);
                inputArea.value = '';
                await loadNotes();
                openDetail(newNote.id);
            } catch (e) {
                alert('Ошибка создания заметки');
            }
        };

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
            alert('Требуется авторизация для заметок!');
            return;
        }
        // Показать только экран заметки
        screens.forEach(screen => screen.classList.remove('active'));
        doc.getElementById('screen-note-detail')?.classList.add('active');

        // Загрузить заметку
        let note: Note | null = null;
        try {
            note = await NotesService.getNote(noteId, token);
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
                await NotesService.updateNote(noteId, titleInp.value.trim(), bodyArea.value, token!);
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
            if (!confirm('Удалить заметку?')) return;
            try {
                await NotesService.deleteNote(noteId, token!);
                (doc as any).renderNotes();
                showScreen('screen-notes');
            } catch (e) {
                alert('Ошибка удаления заметки');
            }
        };
        function showScreen(id: string) {
            screens.forEach(screen => screen.classList.remove('active'));
            doc.getElementById(id)?.classList.add('active');
        }
    }
} 