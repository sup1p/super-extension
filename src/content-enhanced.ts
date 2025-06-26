import { Sidebar } from './sidebar';

// Initialize the sidebar
const sidebarInstance = new Sidebar();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'toggleSidebar') {
        sidebarInstance.toggleSidebar();
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Ensure floating button is present when page becomes visible
        if (!document.getElementById('chrome-extension-floating-button')) {
            sidebarInstance.initializeFloatingButton();
        }
    }
});

// Cleanup function for page unload
window.addEventListener('beforeunload', () => {
    sidebarInstance.cleanup();
});


chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'VIDEO_CONTROL') {
        const video = document.querySelector('video');
        if (!video) return;

        switch (message.command) {
            case 'play':
                video.play();
                break;
            case 'pause':
                video.pause();
                break;
            case 'toggle':
                video.paused ? video.play() : video.pause();
                break;
            case 'forward':
                video.currentTime += 20;
                break;
            case 'backward':
                video.currentTime -= 20;
                break;
            case 'next': {
                if (window.location.hostname.includes('youtube.com')) {
                    const nextButton = document.querySelector('.ytp-next-button') as HTMLElement | null;
                    if (nextButton) {
                        nextButton.click();
                    }
                } else {
                    const videos = Array.from(document.querySelectorAll('video'));
                    const idx = videos.indexOf(video);
                    if (idx !== -1 && idx < videos.length - 1) {
                        video.pause();
                        videos[idx + 1].play();
                    }
                }
                break;
            }
            case 'prev': {
                if (window.location.hostname.includes('youtube.com')) {
                    const prevButton = document.querySelector('.ytp-prev-button') as HTMLElement | null;
                    if (prevButton) {
                        prevButton.click();
                        setTimeout(() => prevButton.click(), 50);
                    }
                } else {
                    const videos = Array.from(document.querySelectorAll('video'));
                    const idx = videos.indexOf(video);
                    if (idx > 0) {
                        video.pause();
                        videos[idx - 1].play();
                    }
                }
                break;
            }
            case 'volume_down': {
                const playerElement = document.querySelector('.html5-video-player') as HTMLElement || video;
                if (playerElement) {
                    playerElement.focus();
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            playerElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
                        }, i * 75);
                    }
                }
                break;
            }
            case 'volume_up': {
                const playerElement = document.querySelector('.html5-video-player') as HTMLElement || video;
                if (playerElement) {
                    playerElement.focus();
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            playerElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', keyCode: 38, bubbles: true }));
                        }, i * 75);
                    }
                }
                break;
            }
        }
    } else if (message.type === 'HAS_VIDEO') {
        const hasVideo = !!document.querySelector('video');
        sendResponse({ hasVideo });
    }
});
