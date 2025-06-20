import { Language } from '../types';
import { AuthService } from './auth'

export const languages: Language[] = [
    { code: 'auto', name: 'Auto' },
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'kk', name: 'Қазақша' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' }
];

export class TranslateService {
    static fillLanguageSelect(select: HTMLSelectElement, includeAuto = false): void {
        select.innerHTML = '';
        languages.forEach(({ code, name }) => {
            if (!includeAuto && code === 'auto') return;
            const opt = new Option(name, code);
            select.add(opt);
        });
    }

    static initTranslate(doc: Document): void {
        const srcSel = doc.getElementById('sourceLanguage') as HTMLSelectElement;
        const tgtSel = doc.getElementById('targetLanguage') as HTMLSelectElement;
        const btn = doc.getElementById('translateButton') as HTMLButtonElement;
        const swapBtn = doc.getElementById('swapLangs');
        const srcTxt = doc.getElementById('sourceText') as HTMLTextAreaElement;
        const dstTxt = doc.getElementById('translatedText') as HTMLTextAreaElement;

        dstTxt.classList.remove('expanded');

        this.fillLanguageSelect(srcSel, true);
        this.fillLanguageSelect(tgtSel, false);
        srcSel.value = 'auto';
        tgtSel.value = 'en';

        // обработка перевода
        const handleTranslate = async () => {

            const text = srcTxt.value.trim();
            if (!text) return;
            dstTxt.value = 'Translating…';
            try {
                const result = await this.translateText(text, srcSel.value, tgtSel.value);
                dstTxt.value = result;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                dstTxt.value = `Error: ${message}`;
                console.error(err);
            }
            dstTxt.classList.add('expanded');
        };

        btn?.addEventListener('click', handleTranslate);
        srcTxt.addEventListener('keydown', e => {
            if (e.ctrlKey && e.key === 'Enter') handleTranslate();
        });

        swapBtn?.addEventListener('click', () => {
            [srcSel.value, tgtSel.value] = [tgtSel.value, srcSel.value];
        });
    }

    private static async translateText(text: string, src: string, dest: string): Promise<string> {
        const token = await AuthService.getToken();
        if (!token) throw new Error('No auth token found');

        const params = new URLSearchParams({ text, src, dest });
        const res = await fetch(`http://localhost:8000/translate?${params}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        return data.translated_text;
    }
}
