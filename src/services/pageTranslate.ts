// Сервис для перевода всей страницы с использованием IntersectionObserver

// Глобальный экземпляр сервиса
let translateServiceInstance: PageTranslateService | null = null;

// Глобальный флаг режима перевода
let translateMode = false;
let currentTargetLang: string = 'en';
let currentToken: string | undefined = undefined;
if (currentToken) { console.log("jojo") }

export class PageTranslateService {
    private observer: IntersectionObserver | null = null;
    private translationQueue: Map<HTMLElement, { originalText: string }> = new Map();
    private debouncedTranslate: () => void = () => { };
    private targetLang: string;
    private token?: string;

    constructor(targetLang: string, token?: string) {
        this.targetLang = targetLang;
        this.token = token;
    }

    private init(): void {
        console.log('[PageTranslateService] Initializing wrappers...');
        const textNodes = this.collectTextNodes();

        textNodes.forEach(node => {
            if (node.parentElement && !node.parentElement.closest('.translatable-wrapper')) {
                const wrapper = document.createElement('span');
                wrapper.className = 'translatable-wrapper';
                wrapper.dataset.isTranslated = 'false';
                node.parentElement.insertBefore(wrapper, node);
                wrapper.appendChild(node);
            }
        });

        console.log('[PageTranslateService] Wrappers created.');
    }

    public startTranslation(): void {
        console.log('[PageTranslateService] Starting observer...');
        if (this.observer) {
            this.observer.disconnect(); // На случай повторного запуска
        }

        this.debouncedTranslate = this.debounce(this.processTranslationQueue.bind(this), 500);

        this.observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target as HTMLElement;
                        if (element.dataset.isTranslated === 'false') {
                            this.queueForTranslation(element);
                            obs.unobserve(element);
                        }
                    }
                });
            },
            { rootMargin: '100px 0px', threshold: 0.01 }
        );

        document.querySelectorAll<HTMLElement>('.translatable-wrapper[data-is-translated="false"]').forEach(el => {
            this.observer?.observe(el);
        });
        console.log('[PageTranslateService] Observer started.');
    }

    private collectTextNodes(root: HTMLElement = document.body): Text[] {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: (node: Node) => {
                const parent = node.parentElement;
                if (!node.nodeValue?.trim() ||
                    parent?.tagName === 'STYLE' ||
                    parent?.tagName === 'SCRIPT' ||
                    parent?.closest('.translated-text') ||
                    parent?.classList.contains('translatable-wrapper')
                ) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (!this.isNodeVisible(node)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            },
        });
        const nodes: Text[] = [];
        let n: Node | null;
        while ((n = walker.nextNode())) {
            nodes.push(n as Text);
        }
        return nodes;
    }

    private isNodeVisible(node: Node): boolean {
        let el = node.parentElement;
        while (el) {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            el = el.parentElement;
        }
        return true;
    }

    private queueForTranslation(element: HTMLElement): void {
        const text = element.textContent?.trim();
        if (text && !this.translationQueue.has(element)) {
            console.log('[PageTranslateService] Queuing for translation:', text);
            this.translationQueue.set(element, { originalText: text });
            this.showLoading(element);
            this.debouncedTranslate();
        }
    }

    private async processTranslationQueue(): Promise<void> {
        if (this.translationQueue.size === 0) return;

        const elements = Array.from(this.translationQueue.keys());
        const texts = elements.map(el => this.translationQueue.get(el)!.originalText);

        console.log('[PageTranslateService] Processing queue. Texts:', texts);

        const url = `http://localhost:8000/translate-page?dest=${encodeURIComponent(this.targetLang)}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'accept': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ texts }),
            });

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();
            if (!data.translated_texts || !Array.isArray(data.translated_texts)) {
                throw new Error('Invalid response format');
            }

            console.log('[PageTranslateService] Backend response:', data);
            elements.forEach((element, i) => {
                const translation = data.translated_texts[i];
                this.removeLoading(element);
                this.insertTranslation(element, translation);
                element.dataset.isTranslated = 'true';
            });
        } catch (error) {
            console.error('[PageTranslateService] Translation failed:', error);
            elements.forEach(element => {
                this.removeLoading(element, true);
                this.observer?.observe(element); // Re-observe on failure
            });
        } finally {
            this.translationQueue.clear();
        }
    }

    private showLoading(element: HTMLElement): void {
        element.classList.add('translating');
        const spinner = document.createElement('span');
        spinner.className = 'translation-spinner';
        element.appendChild(spinner);
    }

    private removeLoading(element: HTMLElement, isError: boolean = false): void {
        element.classList.remove('translating');
        const spinner = element.querySelector('.translation-spinner');
        if (spinner) spinner.remove();
        if (isError) {
            element.dataset.isTranslated = 'false';
            element.classList.add('translation-failed');
            setTimeout(() => element.classList.remove('translation-failed'), 2000);
        }
    }

    private insertTranslation(element: HTMLElement, translation: string): void {
        if (!translation) return;

        const span = document.createElement('span');
        span.className = 'translated-text';
        span.textContent = translation;

        console.log('[PageTranslateService] Inserting translation for:', element.textContent, '->', translation);
        element.appendChild(span);
    }

    private debounce<T extends (...args: any[]) => void>(func: T, delay: number): () => void {
        let timeout: number | undefined;
        return () => {
            clearTimeout(timeout);
            timeout = window.setTimeout(() => {
                func();
            }, delay);
        };
    }

    public destroy(): void {
        console.log('[PageTranslateService] Destroying instance...');
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        // Remove translations and wrappers
        document.querySelectorAll('.translated-text').forEach(el => el.remove());
        document.querySelectorAll<HTMLElement>('.translatable-wrapper').forEach(wrapper => {
            // Move child nodes (usually the original text node) back to the parent
            while (wrapper.firstChild) {
                wrapper.parentElement?.insertBefore(wrapper.firstChild, wrapper);
            }
            wrapper.remove();
        });

        this.translationQueue.clear();
        console.log('[PageTranslateService] Cleanup complete.');
    }

    // Static methods to control the service
    static enableTranslateMode(targetLang: string, token?: string): void {
        if (translateMode) {
            if (currentTargetLang !== targetLang) {
                // If language changes, destroy old instance and create a new one
                this.disableTranslateMode();
            } else {
                console.log('[PageTranslateService] Translate mode is already enabled.');
                return;
            }
        }
        console.log(`[PageTranslateService] Enabling translate mode for ${targetLang}.`);
        translateMode = true;
        currentTargetLang = targetLang;
        currentToken = token;
        translateServiceInstance = new PageTranslateService(targetLang, token);
        translateServiceInstance.init(); // Оборачиваем текст, но не запускаем перевод
    }

    static startTranslation(targetLang: string, token?: string): void {
        if (!translateMode || !translateServiceInstance) {
            console.warn('[PageTranslateService] Translate mode is not enabled. Call enableTranslateMode first.');
            // Если режим не включен, включаем его и сразу запускаем
            this.enableTranslateMode(targetLang, token);
            translateServiceInstance?.startTranslation();
            return;
        }

        // Если режим уже включен, просто запускаем/перезапускаем observer с новым языком
        console.log(`[PageTranslateService] Starting translation for ${targetLang}.`);
        translateServiceInstance.targetLang = targetLang;
        translateServiceInstance.token = token;
        translateServiceInstance.startTranslation();
    }

    static disableTranslateMode(): void {
        if (!translateMode || !translateServiceInstance) {
            console.log('[PageTranslateService] Translate mode is not enabled.');
            return;
        }
        console.log('[PageTranslateService] Disabling translate mode.');
        translateMode = false;
        translateServiceInstance.destroy();
        translateServiceInstance = null;
    }

    static isTranslateModeEnabled(): boolean {
        return translateMode;
    }

    // Статический метод для получения всего видимого текста
    static getAllVisibleText(): string[] {
        const service = new PageTranslateService('en'); // Временный экземпляр для доступа к collectTextNodes
        return service.collectTextNodes().map(n => n.nodeValue || '');
    }
}

// Стили для перевода, лоадера и ошибок
if (!document.getElementById('page-translate-styles')) {
    const style = document.createElement('style');
    style.id = 'page-translate-styles';
    style.textContent = `
.translatable-wrapper {
    display: inline !important;
}
.translated-text { 
    color: #b0b0b0; 
    font-style: italic; 
    font-size: 90%; 
    display: block; 
    margin-top: 2px; 
}
.translating {
    position: relative;
    opacity: 0.7;
}
.translation-spinner {
    display: inline-block;
    width: 1em;
    height: 1em;
    border: 2px solid rgba(0,0,0,.1);
    border-radius: 50%;
    border-top-color: #333;
    animation: spin 1s ease-in-out infinite;
    margin-left: 5px;
}
@keyframes spin {
    to { transform: rotate(360deg); }
}
.translation-failed {
    outline: 1px solid red;
}
`;
    document.head.appendChild(style);
}

// Делаем сервис доступным глобально для iframe
if (typeof window !== 'undefined') {
    (window as any).PageTranslateService = PageTranslateService;
}