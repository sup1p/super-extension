import { showAuthModal } from "../sidebar/components/auth";

export type Note = {
    id: number;
    title: string;
    content: string;
    user_id: number;
};

export class NotesService {
    static async getAllNotes(token: string, doc: Document): Promise<Note[]> {
        const res = await fetch('http://localhost:8000/notes/get/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            console.log(res);
        }
        return await res.json();
    }

    static async getNote(noteId: number, token: string, doc: Document): Promise<Note> {
        const res = await fetch(`http://localhost:8000/notes/get/${noteId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            throw new Error('Ошибка получения заметки');
        }
        return await res.json();
    }

    static async createNote(title: string, content: string, token: string, doc: Document): Promise<Note | null> {
        const res = await fetch('http://localhost:8000/notes/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, content })
        });
        if (!res.ok) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            console.log(res);
            return null;
        }
        return await res.json();
    }

    static async updateNote(noteId: number, title: string, content: string, token: string, doc: Document): Promise<Note | null> {
        const res = await fetch(`http://localhost:8000/notes/update/${noteId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, content })
        });
        if (!res.ok) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            console.log(res);
            return null;
        }
        return await res.json();
    }

    static async deleteNote(noteId: number, token: string, doc: Document): Promise<void> {
        const res = await fetch(`http://localhost:8000/notes/delete/${noteId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            console.log(res);
            return;
        }
    }
} 