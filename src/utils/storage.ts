import { Note } from '../types';

export const loadNotes = (): Note[] => {
    try {
        return JSON.parse(localStorage.getItem('notes') || '[]');
    } catch {
        return [];
    }
};

export const saveNotes = (notes: Note[]): void => {
    localStorage.setItem('notes', JSON.stringify(notes));
};

export const uuid = (): string => crypto.randomUUID(); 