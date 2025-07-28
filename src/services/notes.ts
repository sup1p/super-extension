import { showAuthModal } from "../sidebar/components/auth";

const API_URL = import.meta.env.VITE_API_URL;

export type Note = {
    id: number;
    title: string;
    content: string;
    user_id: number;
};

export type Event = {
    id: number;
    title: string;
    description: string;
    user_id: number;
    start_date: string;
    location: string;
    reminder: number;
    created_at: string;
};

export type EventCreate = {
    title: string;
    description: string;
    start_date: string | null;
    location: string;
    reminder: number;
};

export type EventUpdate = {
    title?: string;
    description?: string;
    start_date?: string | null;
    location?: string;
    reminder?: number;
};

export class NotesService {
    static async getAllNotes(token: string, doc: Document): Promise<Note[]> {
        try {
            const data = await notesFetchViaBackground(
                `${API_URL}/notes/get/all`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            return data;
        } catch (res: any) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            console.log(res);
            return [];
        }
    }

    static async getNote(noteId: number, token: string, doc: Document): Promise<Note> {
        try {
            const data = await notesFetchViaBackground(
                `${API_URL}/notes/get/${noteId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            return data;
        } catch (res: any) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            throw new Error('Ошибка получения заметки');
        }
    }

    static async createNote(title: string, content: string, token: string, doc: Document): Promise<Note | null> {
        try {
            const data = await notesFetchViaBackground(
                `${API_URL}/notes/create`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, content })
                }
            );
            return data;
        } catch (res: any) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            console.log(res);
            return null;
        }
    }

    static async updateNote(noteId: number, title: string, content: string, token: string, doc: Document): Promise<Note | null> {
        try {
            const data = await notesFetchViaBackground(
                `${API_URL}/notes/update/${noteId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ title, content })
                }
            );
            return data;
        } catch (res: any) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            console.log(res);
            return null;
        }
    }

    static async deleteNote(noteId: number, token: string, doc: Document): Promise<void> {
        try {
            await notesFetchViaBackground(
                `${API_URL}/notes/delete/${noteId}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
        } catch (res: any) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            console.log(res);
            return;
        }
    }
}

export class EventService {
    static async getAllEvents(token: string, doc: Document): Promise<Event[]> {
        try {
            const data = await notesFetchViaBackground(
                `${API_URL}/calendar/get/all`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            return data;
        } catch (res: any) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            console.log(res);
            return [];
        }
    }

    static async getEvent(eventId: number, token: string, doc: Document): Promise<Event> {
        try {
            const data = await notesFetchViaBackground(
                `${API_URL}/calendar/get/${eventId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            return data;
        } catch (res: any) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            throw new Error('Ошибка получения события');
        }
    }

    static async createEvent(eventData: EventCreate, token: string, doc: Document): Promise<Event | null> {
        try {
            const data = await notesFetchViaBackground(
                `${API_URL}/calendar/create`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(eventData)
                }
            );
            return data;
        } catch (res: any) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            console.log(res);
            return null;
        }
    }

    static async updateEvent(eventId: number, eventData: EventUpdate, token: string, doc: Document): Promise<Event | null> {
        try {
            const data = await notesFetchViaBackground(
                `${API_URL}/calendar/update/${eventId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(eventData)
                }
            );
            return data;
        } catch (res: any) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            console.log(res);
            return null;
        }
    }

    static async deleteEvent(eventId: number, token: string, doc: Document): Promise<void> {
        try {
            await notesFetchViaBackground(
                `${API_URL}/calendar/delete/${eventId}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
        } catch (res: any) {
            if (res.status === 401) {
                showAuthModal(doc);
            }
            console.log(res);
            return;
        }
    }
}

async function notesFetchViaBackground(url: string, options: RequestInit): Promise<any> {
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