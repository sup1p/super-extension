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
    if (request.type === 'GET_TABS') {
        chrome.tabs.query({}, (tabs) => {
            const result = tabs.map(tab => ({
                id: tab.id!,
                index: tab.index,
                url: tab.url || '',
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
                id: tab.id!,
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
                const index = command.tabIndex;
                chrome.tabs.query({}, (tabs) => {
                    const match = tabs.find(tab => tab.index === index);
                    if (match?.id) {
                        chrome.tabs.remove(match.id);
                    } else {
                        console.warn('Не найдена вкладка с index:', index);
                    }
                });
                break;
            }

            case 'open_url': {
                const url = command.url;
                if (url && typeof url === 'string') {
                    chrome.tabs.create({ url });
                } else {
                    console.warn('Неверный URL:', url);
                }
                break;
            }

            default:
                console.warn('Неизвестная команда:', command);
        }
    }
});