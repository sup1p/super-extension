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