chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({
            url: "https://yourmegan.me/tutorial" // Укажите ваш URL
        });
    }
});

function logAllTabs() {
    chrome.tabs.query({}, (tabs) => {
        console.log("Актуальный список вкладок:");
        tabs.forEach((tab, index) => {
            console.log(`Tab ${index + 1}:`, {
                id: tab.id,
                url: tab.url,
                index: tab.index,
                active: tab.active,
            });
        });
    });
}

chrome.tabs.onCreated.addListener(logAllTabs);
chrome.tabs.onRemoved.addListener(logAllTabs);
chrome.tabs.onUpdated.addListener(logAllTabs);
chrome.tabs.onActivated.addListener(logAllTabs);


chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === "AUTH_LOGIN" || request.type === "NOTES_FETCH" || request.type === "CHAT_SYSTEM" || request.type === "PAGE_TRANSLATE" || request.type === "TRANSLATE" || request.type === "TOOLS_LOGIC") {
        fetch(request.url, request.options || {
            method: request.method || "POST",
            headers: request.headers,
            body: request.body,
        })
            .then(async (res) => {
                let data = null;
                try {
                    data = await res.json();
                } catch (e) {
                    data = null;
                }
                sendResponse({ ok: res.ok, status: res.status, data });
            })
            .catch((error) => {
                sendResponse({ ok: false, error: error.toString() });
            });
        return true; // async response
    }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === 'GET_TABS') {
        chrome.tabs.query({}, (tabs) => {
            const result = tabs.map(tab => ({
                index: tab.index,
                url: tab.url || '',
                active: !!tab.active
            }));
            (sendResponse as any)({ tabs: result });
        });
        return true; // важно для async sendResponse
    }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_TABS') {
        chrome.tabs.query({}, (tabs) => {
            const simplified = tabs.map(tab => ({
                index: tab.index!,
                url: tab.url || '',
                active: !!tab.active
            }));
            sendResponse({ tabs: simplified });
        });
        return true;
    }

    if (message.type === 'EXECUTE_COMMAND') {
        const command = message.payload;
        console.log("📥 Команда от клиента:", command);

        switch (command.action) {

            case 'control_video':
            case 'control_media': {
                chrome.tabs.query({}, (tabs) => {
                    let found = false;
                    let checked = 0;
                    for (const tab of tabs) {
                        if (typeof tab.id === 'number') {
                            chrome.tabs.sendMessage(tab.id, { type: 'HAS_VIDEO' }, (response) => {
                                checked++;
                                if (found) return;
                                if (response && response.hasVideo) {
                                    found = true;
                                    if (typeof tab.id === 'number') {
                                        chrome.tabs.sendMessage(tab.id, {
                                            type: 'VIDEO_CONTROL',
                                            command: command.videoCommand || command.mediaCommand
                                        });
                                    }
                                }
                            });
                        }
                    }
                });
                break;
            }

            case 'switch_tab': {
                const index = command.tabIndex;
                chrome.tabs.query({}, (tabs) => {
                    const match = tabs.find(tab => tab.index === index);
                    if (match?.id) {
                        chrome.tabs.update(match.id, { active: true });
                        chrome.windows.update(match.windowId!, { focused: true });
                    } else {
                        console.warn('Вкладка не найдена с index:', index);
                    }
                });
                break;
            }

            case 'close_tab': {
                if (Array.isArray(command.tabIndices)) {
                    // Обработка закрытия нескольких вкладок
                    const indicesToClose = command.tabIndices;
                    chrome.tabs.query({}, (tabs) => {
                        const idsToClose = tabs
                            .filter(tab => indicesToClose.includes(tab.index))
                            .map(tab => tab.id)
                            .filter((id): id is number => !!id);

                        if (idsToClose.length > 0) {
                            chrome.tabs.remove(idsToClose);
                        } else {
                            console.warn('Не найдены вкладки с индексами:', indicesToClose);
                        }
                    });
                } else if (typeof command.tabIndex === 'number') {
                    // Обработка закрытия одной вкладки (старая логика)
                    const index = command.tabIndex;
                    chrome.tabs.query({}, (tabs) => {
                        const match = tabs.find(tab => tab.index === index);
                        if (match && typeof match.id === 'number') {
                            chrome.tabs.remove(match.id);
                        } else {
                            console.warn('Не найдена вкладка с index:', index);
                        }
                    });
                } else {
                    console.warn('Для команды close_tab не указаны tabIndex или tabIndices', command);
                }
                break;
            }

            case 'open_url': {
                const url = command.url;
                if (url && typeof url === 'string') {
                    chrome.tabs.create({ url }, (newTab) => {
                        if (newTab.id) {
                            const tabId = newTab.id;
                            const onUpdatedListener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
                                if (updatedTabId === tabId && changeInfo.status === 'complete' && tab.url) {
                                    if (tab.url.includes('google.com/search')) {
                                        chrome.scripting.executeScript({
                                            target: { tabId: tabId },
                                            func: () => {
                                                const clickFirstLink = () => {
                                                    const firstResult = document.querySelector('#rso a');
                                                    if (firstResult) {
                                                        (firstResult as HTMLElement).click();
                                                        return true;
                                                    }
                                                    return false;
                                                };
                                                if (!clickFirstLink()) {
                                                    const observer = new MutationObserver((_mutations, obs) => {
                                                        if (clickFirstLink()) {
                                                            obs.disconnect();
                                                        }
                                                    });
                                                    observer.observe(document.body, {
                                                        childList: true,
                                                        subtree: true
                                                    });
                                                }
                                            }
                                        });
                                        chrome.tabs.onUpdated.removeListener(onUpdatedListener);
                                    } else if (tab.url.includes('youtube.com/results')) {
                                        chrome.scripting.executeScript({
                                            target: { tabId: tabId },
                                            func: () => {
                                                const clickFirstVideo = () => {
                                                    const firstVideo = document.querySelector('ytd-video-renderer a#video-title');
                                                    if (firstVideo) {
                                                        (firstVideo as HTMLElement).click();
                                                        return true;
                                                    }
                                                    return false;
                                                };

                                                if (!clickFirstVideo()) {
                                                    const observer = new MutationObserver((_mutations, obs) => {
                                                        if (clickFirstVideo()) {
                                                            obs.disconnect();
                                                        }
                                                    });
                                                    observer.observe(document.body, {
                                                        childList: true,
                                                        subtree: true
                                                    });
                                                }
                                            }
                                        });
                                        chrome.tabs.onUpdated.removeListener(onUpdatedListener);
                                    }
                                }
                            };
                            chrome.tabs.onUpdated.addListener(onUpdatedListener);
                        }
                    });
                } else {
                    console.warn('Неверный URL:', url);
                }
                break;
            }

            default:
                if (command.action === 'create_note' && command.title && command.text) {
                    // Отправить команду в content script активной вкладки
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        const tab = tabs[0];
                        if (tab && tab.id) {
                            chrome.tabs.sendMessage(tab.id, {
                                type: 'CREATE_NOTE',
                                title: command.title,
                                text: command.text,
                                answer: command.answer,
                                audio_base64: command.audio_base64
                            });
                        }
                    });
                } else {
                    console.warn('Неизвестная команда:', command);
                }
        }
    }
});

chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" });
    }
});

// --- CONTEXT MENU: Megan actions ---
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
        // Все пункты на верхнем уровне
        chrome.contextMenus.create({
            id: 'megan-save',
            title: 'Save',
            contexts: ['selection'],
        });
        chrome.contextMenus.create({
            id: 'megan-summarize',
            title: 'Summarize',
            contexts: ['selection'],
        });
        chrome.contextMenus.create({
            id: 'megan-translate',
            title: 'Translate',
            contexts: ['selection'],
        });
        chrome.contextMenus.create({
            id: 'megan-voice',
            title: 'Megan voice',
            contexts: ['selection'],
        });
        chrome.contextMenus.create({
            id: 'megan-simple-chat',
            title: 'Chat',
            contexts: ['all'],
        });
    });
});

// --- CONTEXT MENU CLICK HANDLER ---
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'megan-save' && info.selectionText && tab?.id) {
        let domain = '';
        try {
            if (info.pageUrl) {
                const urlObj = new URL(info.pageUrl);
                domain = urlObj.hostname.replace(/^www\./, '');
            }
        } catch {
            domain = '';
        }
        chrome.tabs.sendMessage(tab.id, {
            type: 'CREATE_NOTE',
            title: domain,
            text: info.selectionText,
            focus: true // явно просим открыть сайдбар и показать заметку
        });
    }
    if (info.menuItemId === 'megan-summarize' && info.selectionText && tab?.id) {
        if (info.selectionText.length > 3000) {
            chrome.tabs.sendMessage(tab.id, {
                type: 'SHOW_NOTIFICATION',
                message: 'You can summarize up to 3000 characters',
                notifType: 'error'
            });
            return;
        }
        chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_SUMMARIZE_POPUP',
            text: info.selectionText
        });
    }
    if (info.menuItemId === 'megan-translate' && info.selectionText && tab?.id) {
        if (info.selectionText.length > 3000) {
            chrome.tabs.sendMessage(tab.id, {
                type: 'SHOW_NOTIFICATION',
                message: 'You can translate up to 3000 characters',
                notifType: 'error'
            });
            return;
        }
        chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_TRANSLATE_POPUP',
            text: info.selectionText
        });
    }
    if (info.menuItemId === 'megan-voice' && info.selectionText && tab?.id) {
        if (info.selectionText.length > 1000) {
            chrome.tabs.sendMessage(tab.id, {
                type: 'SHOW_NOTIFICATION',
                message: 'You can voice up to 1000 characters',
                notifType: 'error'
            });
            return;
        }
        chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_VOICE_POPUP',
            text: info.selectionText
        });
    }
    // УДАЛЕНО: if (info.menuItemId === 'megan-chat' ... )
    if (info.menuItemId === 'megan-simple-chat' && tab?.id) {
        // Открыть плавающее окно чата (без текста)
        chrome.tabs.sendMessage(tab.id, { type: 'SHOW_CHAT_POPUP', text: '' });
    }
});

const API_URL = import.meta.env.VITE_API_URL;
const WS_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL)
    ? import.meta.env.VITE_WS_URL
    : (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/^http(s?):\/\//, 'ws://') : '');

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'GET_API_URL') sendResponse({ API_URL });
    if (msg.type === 'GET_WS_URL') sendResponse({ WS_URL });
});
