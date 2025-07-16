import { Language } from '../types';
import { AuthService } from './auth'
import { TranslationService } from './translations';

export const languages: Language[] = [
    { code: 'auto', name: 'Auto' },
    ...[
        { code: 'en', name: 'English' },
        { code: 'zh', name: '中文' },
        { code: 'hi', name: 'हिन्दी' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'ar', name: 'العربية' },
        { code: 'bn', name: 'বাংলা' },
        { code: 'ru', name: 'Русский' },
        { code: 'pt', name: 'Português' },
        { code: 'ur', name: 'اردو' },
        { code: 'id', name: 'Bahasa Indonesia' },
        { code: 'de', name: 'Deutsch' },
        { code: 'ja', name: '日本語' },
        { code: 'sw', name: 'Kiswahili' },
        { code: 'mr', name: 'मराठी' },
        { code: 'te', name: 'తెలుగు' },
        { code: 'tr', name: 'Türkçe' },
        { code: 'ta', name: 'தமிழ்' },
        { code: 'vi', name: 'Tiếng Việt' },
        { code: 'ko', name: '한국어' },
        { code: 'fa', name: 'فارسی' },
        { code: 'it', name: 'Italiano' },
        { code: 'pl', name: 'Polski' },
        { code: 'uk', name: 'Українська' },
        { code: 'ro', name: 'Română' },
        { code: 'nl', name: 'Nederlands' },
        { code: 'th', name: 'ไทย' },
        { code: 'gu', name: 'ગુજરાતી' },
        { code: 'pa', name: 'ਪੰਜਾਬੀ' },
        { code: 'ml', name: 'മലയാളം' },
        { code: 'kn', name: 'ಕನ್ನಡ' },
        { code: 'jv', name: 'Basa Jawa' },
        { code: 'my', name: 'မြန်မာဘာသာ' },
        { code: 'el', name: 'Ελληνικά' },
        { code: 'hu', name: 'Magyar' },
        { code: 'cs', name: 'Čeština' },
        { code: 'sv', name: 'Svenska' },
        { code: 'fi', name: 'Suomi' },
        { code: 'no', name: 'Norsk' },
        { code: 'da', name: 'Dansk' },
        { code: 'he', name: 'עברית' },
        { code: 'sr', name: 'Српски' },
        { code: 'sk', name: 'Slovenčina' },
        { code: 'bg', name: 'Български' },
        { code: 'hr', name: 'Hrvatski' },
        { code: 'lt', name: 'Lietuvių' },
        { code: 'sl', name: 'Slovenščina' },
        { code: 'et', name: 'Eesti' },
        { code: 'lv', name: 'Latviešu' },
        { code: 'fil', name: 'Filipino' },
        { code: 'kk', name: 'Қазақша' },
        { code: 'az', name: 'Azərbaycanca' },
        { code: 'uz', name: 'Oʻzbekcha' },
        { code: 'am', name: 'አማርኛ' },
        { code: 'ne', name: 'नेपाली' },
        { code: 'si', name: 'සිංහල' },
        { code: 'km', name: 'ភាសាខ្មែរ' },
        { code: 'lo', name: 'ລາວ' },
        { code: 'mn', name: 'Монгол' },
        { code: 'hy', name: 'Հայերեն' },
        { code: 'ka', name: 'ქართული' },
        { code: 'sq', name: 'Shqip' },
        { code: 'bs', name: 'Bosanski' },
        { code: 'mk', name: 'Македонски' },
        { code: 'af', name: 'Afrikaans' },
        { code: 'zu', name: 'isiZulu' },
        { code: 'xh', name: 'isiXhosa' },
        { code: 'st', name: 'Sesotho' },
        { code: 'yo', name: 'Yorùbá' },
        { code: 'ig', name: 'Igbo' },
        { code: 'ha', name: 'Hausa' },
        { code: 'so', name: 'Soomaali' },
        { code: 'ps', name: 'پښتو' },
        { code: 'tg', name: 'Тоҷикӣ' },
        { code: 'ky', name: 'Кыргызча' },
        { code: 'tt', name: 'Татарча' },
        { code: 'be', name: 'Беларуская' },
        { code: 'eu', name: 'Euskara' },
        { code: 'gl', name: 'Galego' },
        { code: 'ca', name: 'Català' },
        { code: 'is', name: 'Íslenska' },
        { code: 'ga', name: 'Gaeilge' },
        { code: 'mt', name: 'Malti' },
        { code: 'lb', name: 'Lëtzebuergesch' },
        { code: 'fo', name: 'Føroyskt' },
        { code: 'cy', name: 'Cymraeg' },
    ].sort((a, b) => a.name.localeCompare(b.name))
];

async function translateFetchViaBackground(url: string, options: RequestInit): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                type: "TRANSLATE",
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

export class TranslateService {
    static fillLanguageSelect(select: HTMLSelectElement, includeAuto = false): void {
        select.innerHTML = '';
        languages.forEach(({ code, name }) => {
            if (!includeAuto && code === 'auto') return;
            let displayName = name;
            if (code !== 'auto') {
                // Ключ для поиска перевода
                let key = '';
                switch (code) {
                    case 'en': key = 'english'; break;
                    case 'zh': key = 'chinese'; break;
                    case 'hi': key = 'hindi'; break;
                    case 'es': key = 'spanish'; break;
                    case 'fr': key = 'french'; break;
                    case 'ar': key = 'arabic'; break;
                    case 'bn': key = 'bengali'; break;
                    case 'ru': key = 'russian'; break;
                    case 'pt': key = 'portuguese'; break;
                    case 'ur': key = 'urdu'; break;
                    case 'id': key = 'indonesian'; break;
                    case 'de': key = 'german'; break;
                    case 'ja': key = 'japanese'; break;
                    case 'sw': key = 'swahili'; break;
                    case 'mr': key = 'marathi'; break;
                    case 'te': key = 'telugu'; break;
                    case 'tr': key = 'turkish'; break;
                    case 'ta': key = 'tamil'; break;
                    case 'vi': key = 'vietnamese'; break;
                    case 'ko': key = 'korean'; break;
                    case 'fa': key = 'persian'; break;
                    case 'it': key = 'italian'; break;
                    case 'pl': key = 'polish'; break;
                    case 'uk': key = 'ukrainian'; break;
                    case 'ro': key = 'romanian'; break;
                    case 'nl': key = 'dutch'; break;
                    case 'th': key = 'thai'; break;
                    case 'gu': key = 'gujarati'; break;
                    case 'pa': key = 'punjabi'; break;
                    case 'ml': key = 'malayalam'; break;
                    case 'kn': key = 'kannada'; break;
                    case 'jv': key = 'javanese'; break;
                    case 'my': key = 'burmese'; break;
                    case 'el': key = 'greek'; break;
                    case 'hu': key = 'hungarian'; break;
                    case 'cs': key = 'czech'; break;
                    case 'sv': key = 'swedish'; break;
                    case 'fi': key = 'finnish'; break;
                    case 'no': key = 'norwegian'; break;
                    case 'da': key = 'danish'; break;
                    case 'he': key = 'hebrew'; break;
                    case 'sr': key = 'serbian'; break;
                    case 'sk': key = 'slovak'; break;
                    case 'bg': key = 'bulgarian'; break;
                    case 'hr': key = 'croatian'; break;
                    case 'lt': key = 'lithuanian'; break;
                    case 'sl': key = 'slovenian'; break;
                    case 'et': key = 'estonian'; break;
                    case 'lv': key = 'latvian'; break;
                    case 'fil': key = 'filipino'; break;
                    case 'kk': key = 'kazakh'; break;
                    case 'az': key = 'azerbaijani'; break;
                    case 'uz': key = 'uzbek'; break;
                    case 'am': key = 'amharic'; break;
                    case 'ne': key = 'nepali'; break;
                    case 'si': key = 'sinhala'; break;
                    case 'km': key = 'khmer'; break;
                    case 'lo': key = 'lao'; break;
                    case 'mn': key = 'mongolian'; break;
                    case 'hy': key = 'armenian'; break;
                    case 'ka': key = 'georgian'; break;
                    case 'sq': key = 'albanian'; break;
                    case 'bs': key = 'bosnian'; break;
                    case 'mk': key = 'macedonian'; break;
                    case 'af': key = 'afrikaans'; break;
                    case 'zu': key = 'zulu'; break;
                    case 'xh': key = 'xhosa'; break;
                    case 'st': key = 'sesotho'; break;
                    case 'yo': key = 'yoruba'; break;
                    case 'ig': key = 'igbo'; break;
                    case 'ha': key = 'hausa'; break;
                    case 'so': key = 'somali'; break;
                    case 'ps': key = 'pashto'; break;
                    case 'tg': key = 'tajik'; break;
                    case 'ky': key = 'kyrgyz'; break;
                    case 'tt': key = 'tatar'; break;
                    case 'be': key = 'belarusian'; break;
                    case 'eu': key = 'basque'; break;
                    case 'gl': key = 'galician'; break;
                    case 'ca': key = 'catalan'; break;
                    case 'is': key = 'icelandic'; break;
                    case 'ga': key = 'irish'; break;
                    case 'mt': key = 'maltese'; break;
                    case 'lb': key = 'luxembourgish'; break;
                    case 'fo': key = 'faroese'; break;
                    case 'cy': key = 'welsh'; break;
                    default: key = '';
                }
                if (key) {
                    displayName = TranslationService.translate(key);
                }
            }
            const opt = new Option(displayName, code);
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
            if (srcSel.value === 'auto') return;
            [srcSel.value, tgtSel.value] = [tgtSel.value, srcSel.value];
        });
    }

    private static async translateText(text: string, src: string, dest: string): Promise<string> {
        const token = await AuthService.getToken();
        if (!token) throw new Error('No auth token found');

        const params = new URLSearchParams({ text, src, dest });
        const API_URL = import.meta.env.VITE_API_URL;
        try {
            const data = await translateFetchViaBackground(
                `${API_URL}/translate?${params}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            return data.translated_text;
        } catch (err: any) {
            if (err && err.data && err.data.message) {
                throw new Error(err.data.message);
            }
            throw new Error(typeof err === 'string' ? err : 'Translation failed');
        }
    }
}
