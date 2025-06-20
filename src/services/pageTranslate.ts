// Сервис для перевода всей страницы

// Глобальный флаг режима перевода
let translateMode = false;

export class PageTranslateService {
    // Собирает все видимые текстовые узлы на странице
    static collectVisibleTextNodes(root: HTMLElement = document.body): Text[] {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node: Node) => {
                    // Пропускаем пустые, пробельные и скрытые
                    if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                    if (!PageTranslateService.isNodeVisible(node)) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        const nodes: Text[] = [];
        let n: Node | null;
        while ((n = walker.nextNode())) {
            nodes.push(n as Text);
        }
        return nodes;
    }

    // Проверяет, видим ли текстовый узел
    static isNodeVisible(node: Node): boolean {
        let el = (node.parentElement as HTMLElement | null);
        while (el) {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            el = el.parentElement;
        }
        return true;
    }

    // Получает все видимые тексты
    static getAllVisibleText(): string[] {
        return this.collectVisibleTextNodes().map(n => n.nodeValue || '');
    }

    // Включить режим перевода
    static enableTranslateMode() {
        translateMode = true;
    }
    // Выключить режим перевода
    static disableTranslateMode() {
        translateMode = false;
    }
    // Проверить, включён ли режим перевода
    static isTranslateModeEnabled() {
        return translateMode;
    }

    // Получить только те текстовые узлы, которые реально видимы на экране (viewport)
    static getVisibleOnScreenTextNodes(root: HTMLElement = document.body): Text[] {
        const nodes = this.collectVisibleTextNodes(root);
        return nodes.filter(node => {
            const rect = node.parentElement?.getBoundingClientRect();
            if (!rect) return false;
            return (
                rect.bottom > 0 &&
                rect.right > 0 &&
                rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
                rect.left < (window.innerWidth || document.documentElement.clientWidth)
            );
        });
    }

    // Получить тексты только на экране
    static getVisibleOnScreenText(): string[] {
        return this.getVisibleOnScreenTextNodes().map(n => n.nodeValue || '');
    }

    // Переводит только если режим включён и только видимые на экране элементы
    static async translatePage(targetLang: string, token?: string): Promise<void> {
        if (!translateMode) {
            console.log('[PageTranslateService] translatePage: translateMode is OFF');
            return;
        }
        const nodes = this.getVisibleOnScreenTextNodes();
        console.log('[PageTranslateService] Visible nodes:', nodes);
        const texts = nodes.map(n => n.nodeValue || '');
        console.log('[PageTranslateService] Texts to send:', texts);
        if (!texts.length) {
            console.warn('[PageTranslateService] No texts found on screen.');
            return;
        }
        // Формируем URL с query-параметром dest
        const url = `http://localhost:8000/translate-page?dest=${encodeURIComponent(targetLang)}`;
        // Формируем заголовки
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        console.log('[PageTranslateService] Fetch URL:', url);
        console.log('[PageTranslateService] Headers:', headers);
        console.log('TOKEN FOR TRANSLATE:', token);
        // Отправляем на бэкенд
        let res, data;
        try {
            res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ texts })
            });
            data = await res.json();
        } catch (e) {
            console.error('[PageTranslateService] Fetch error:', e);
            return;
        }
        console.log('[PageTranslateService] Backend response:', data);
        if (!data.translated_texts || !Array.isArray(data.translated_texts)) {
            console.warn('[PageTranslateService] No translated_texts in response:', data);
            return;
        }
        // Вставляем переводы
        nodes.forEach((node, i) => {
            const translation = data.translated_texts[i];
            if (!translation) return;
            if (!node.parentElement) {
                console.warn('[PageTranslateService] No parentElement for node:', node);
                return;
            }
            // Не вставлять, если уже есть перевод
            if (node.nextSibling && (node.nextSibling as HTMLElement).className === 'translated-text') return;
            const span = document.createElement('span');
            span.className = 'translated-text';
            span.textContent = translation;
            span.style.display = 'block';
            span.style.color = '#b0b0b0';
            span.style.fontStyle = 'italic';
            span.style.fontSize = '90%';
            console.log('[PageTranslateService] Inserting translation for:', node.nodeValue, '->', translation);
            node.parentElement.insertBefore(span, node.nextSibling);
        });
    }
}

// Стили для перевода можно добавить в глобальные стили или динамически
if (!document.getElementById('translated-text-style')) {
    const style = document.createElement('style');
    style.id = 'translated-text-style';
    style.textContent = `.translated-text { color: #b0b0b0; font-style: italic; font-size: 90%; display: block; margin-top: 2px; }`;
    document.head.appendChild(style);
}

// Делаем сервис доступным глобально для iframe
if (typeof window !== 'undefined') {
    (window as any).PageTranslateService = PageTranslateService;
} 