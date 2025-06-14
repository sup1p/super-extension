chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;

    try {
        // Внедряем content script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        // Отправляем сообщение для переключения боковой панели
        chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
    } catch (error) {
        console.error('Error injecting content script:', error);
    }
});