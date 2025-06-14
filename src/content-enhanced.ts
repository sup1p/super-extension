let sidebarOpen = false;
let sidebar: HTMLElement | null = null;
let sidebarContainer: HTMLElement | null = null;
let floatingButton: HTMLElement | null = null;
let originalStyles: Map<Element, string> = new Map();

// Initialize the floating button when the script loads
initializeFloatingButton();

// Слушаем сообщения от background script
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'toggleSidebar') {
        toggleSidebar();
    }
});

function initializeFloatingButton(): void {
    // Remove existing button if it exists
    if (floatingButton) {
        floatingButton.remove();
    }

    // Create the floating button
    floatingButton = document.createElement('div');
    floatingButton.id = 'chrome-extension-floating-button';
    floatingButton.innerHTML = `
        <div class="floating-btn-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="m2 17 10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                <path d="m2 12 10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
        </div>
    `;

    // Apply styles to the floating button
    floatingButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        background: #007bff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        z-index: 2147483646;
        transition: all 0.3s ease;
        color: white;
        user-select: none;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 255, 255, 0.1);
    `;

    // Add hover effects
    floatingButton.addEventListener('mouseenter', () => {
        if (floatingButton) {
            floatingButton.style.transform = 'scale(1.1)';
            floatingButton.style.boxShadow = '0 6px 20px rgba(0, 123, 255, 0.4)';
        }
    });

    floatingButton.addEventListener('mouseleave', () => {
        if (floatingButton) {
            floatingButton.style.transform = 'scale(1)';
            floatingButton.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
        }
    });

    // Add click handler
    floatingButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
    });

    // Add the button to the page
    document.body.appendChild(floatingButton);

    // Update button state based on sidebar status
    updateFloatingButtonState();
}

function updateFloatingButtonState(): void {
    if (!floatingButton) return;

    if (sidebarOpen) {
        floatingButton.style.background = '#28a745';
        floatingButton.style.transform = 'rotate(45deg)';
        floatingButton.innerHTML = `
            <div class="floating-btn-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
        `;
    } else {
        floatingButton.style.background = '#007bff';
        floatingButton.style.transform = 'rotate(0deg)';
        floatingButton.innerHTML = `
            <div class="floating-btn-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                    <path d="m2 17 10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                    <path d="m2 12 10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                </svg>
            </div>
        `;
    }
}

function saveOriginalStyles(): void {
    // Сохраняем оригинальные стили для восстановления
    const elementsToModify = [
        document.documentElement,
        document.body,
        ...Array.from(document.body.children)
    ];

    elementsToModify.forEach(element => {
        originalStyles.set(element, element.getAttribute('style') || '');
    });
}

function restoreOriginalStyles(): void {
    // Восстанавливаем оригинальные стили
    originalStyles.forEach((originalStyle, element) => {
        if (originalStyle) {
            element.setAttribute('style', originalStyle);
        } else {
            element.removeAttribute('style');
        }
    });
}

function applySidebarStyles(): void {
    const contentWidth = '80vw';

    // Стили для HTML и body
    const htmlStyle = `
    width: ${contentWidth} !important;
    max-width: ${contentWidth} !important;
    overflow-x: hidden !important;
    transition: width 0.3s ease !important;
  `;

    const bodyStyle = `
    width: ${contentWidth} !important;
    max-width: ${contentWidth} !important;
    margin: 0 !important;
    padding-right: 0 !important;
    box-sizing: border-box !important;
    overflow-x: hidden !important;
    transition: width 0.3s ease !important;
  `;

    // Применяем стили
    document.documentElement.style.cssText += htmlStyle;
    document.body.style.cssText += bodyStyle;

    // Обрабатываем прямые дочерние элементы body
    Array.from(document.body.children).forEach((child: Element) => {
        if (child.id === 'chrome-extension-sidebar-container' ||
            child.id === 'chrome-extension-floating-button') return;

        const element = child as HTMLElement;
        const computedStyle = window.getComputedStyle(element);

        // Сохраняем текущие стили если еще не сохранены
        if (!originalStyles.has(element)) {
            originalStyles.set(element, element.getAttribute('style') || '');
        }

        // Применяем новые стили
        const newStyle = `
      max-width: ${contentWidth} !important;
      width: ${contentWidth} !important;
      box-sizing: border-box !important;
    `;

        element.style.cssText += newStyle;

        // Специальная обработка для фиксированных элементов
        if (computedStyle.position === 'fixed') {
            element.style.maxWidth = contentWidth + ' !important';
        }
    });

    // Adjust floating button position when sidebar is open
    if (floatingButton) {
        floatingButton.style.right = '340px'; // 20px from sidebar edge (320px sidebar + 20px margin)
    }
}

function removeSidebarStyles(): void {
    // Удаляем классы
    document.documentElement.classList.remove('extension-sidebar-open');

    // Восстанавливаем оригинальные стили
    restoreOriginalStyles();

    // Очищаем карту стилей
    originalStyles.clear();

    // Restore floating button position
    if (floatingButton) {
        floatingButton.style.right = '20px';
    }
}

function createSidebar(): void {
    // Создаем основной контейнер
    sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'chrome-extension-sidebar-container';

    // Создаем iframe для изоляции стилей
    const iframe = document.createElement('iframe');
    iframe.id = 'chrome-extension-sidebar-iframe';
    iframe.style.cssText = `
    position: fixed;
    top: 0;
    right: -20vw;
    width: 20vw;
    height: 100vh;
    border: none;
    z-index: 2147483647;
    transition: right 0.3s ease;
    box-shadow: -2px 0 10px rgba(0,0,0,0.1);
    background: white;
  `;

    sidebarContainer.appendChild(iframe);
    document.body.appendChild(sidebarContainer);

    // Создаем контент внутри iframe
    iframe.onload = () => {
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc) return;

        iframeDoc.head.innerHTML = `
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Extension Sidebar</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background: #ffffff;
          height: 100vh;
          overflow-y: auto;
        }
        
        .sidebar-header {
          background: #f8f9fa;
          padding: 16px 20px;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .sidebar-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #212529;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #6c757d;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        
        .close-btn:hover {
          background: #e9ecef;
          color: #495057;
        }
        
        .sidebar-content {
          padding: 20px;
        }
        
        .sidebar-content h4 {
          color: #495057;
          margin-bottom: 12px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .sidebar-content p {
          color: #6c757d;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 16px;
        }
        
        .btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s ease;
          width: 100%;
          margin-bottom: 8px;
        }
        
        .btn:hover {
          background: #0056b3;
        }
        
        .btn-secondary {
          background: #6c757d;
        }
        
        .btn-secondary:hover {
          background: #545b62;
        }
        
        .feature-list {
          list-style: none;
          margin-top: 16px;
        }
        
        .feature-list li {
          color: #6c757d;
          font-size: 13px;
          padding: 6px 0;
          border-bottom: 1px solid #f8f9fa;
        }
        
        .feature-list li:last-child {
          border-bottom: none;
        }
        
        .status-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #28a745;
          margin-right: 8px;
        }
        
        .divider {
          height: 1px;
          background: #e9ecef;
          margin: 20px 0;
        }
        
        .floating-button-note {
          background: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 6px;
          padding: 12px;
          margin-top: 16px;
          font-size: 13px;
          color: #1565c0;
        }
      </style>
    `;

        iframeDoc.body.innerHTML = `
      <div class="sidebar-header">
        <h3>🚀 Мое расширение</h3>
        <button class="close-btn" id="close-sidebar">×</button>
      </div>
      <div class="sidebar-content">
        <h4><span class="status-indicator"></span>Статус: Активно</h4>
        <p>Боковая панель успешно сжала контент страницы и заняла освободившееся место.</p>
        
        <div class="floating-button-note">
          💡 Теперь на каждой странице есть плавающая кнопка в правом нижнем углу для быстрого доступа к расширению!
        </div>
        
        <button class="btn" onclick="window.parent.postMessage({action: 'testAlert'}, '*')">
          Тестовая кнопка
        </button>
        
        <button class="btn btn-secondary" onclick="window.parent.postMessage({action: 'analyzeContent'}, '*')">
          Анализировать страницу
        </button>
        
        <div class="divider"></div>
        
        <h4>Возможности расширения:</h4>
        <ul class="feature-list">
          <li>✓ React + TypeScript интеграция</li>
          <li>✓ Vite для быстрой сборки</li>
          <li>✓ Tailwind CSS стили</li>
          <li>✓ Hot Reload в разработке</li>
          <li>✓ Адаптивная боковая панель</li>
          <li>✓ Сжатие контента страницы</li>
          <li>✓ Плавающая кнопка доступа</li>
        </ul>
        
        <div class="divider"></div>
        
        <h4>Информация о странице:</h4>
        <p id="page-info">Загрузка...</p>
      </div>
    `;

        // Обновляем информацию о странице
        const pageInfo = iframeDoc.getElementById('page-info');
        if (pageInfo) {
            pageInfo.textContent = `URL: ${window.location.hostname}
Размер окна: ${window.innerWidth}x${window.innerHeight}`;
        }

        // Добавляем обработчик для кнопки закрытия
        const closeBtn = iframeDoc.getElementById('close-sidebar');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeSidebar);
        }
    };

    // Устанавливаем src для загрузки iframe
    iframe.src = 'about:blank';
    sidebar = iframe;
}

function openSidebar(): void {
    if (!sidebar) {
        createSidebar();
    }

    if (sidebar) {
        // Сохраняем оригинальные стили перед изменением
        saveOriginalStyles();

        // Применяем стили для сжатия контента
        applySidebarStyles();

        // Показываем сайдбар
        sidebar.classList.add('open');
        (sidebar as HTMLElement).style.right = '0';

        sidebarOpen = true;

        // Update floating button state
        updateFloatingButtonState();

        // Принудительно вызываем событие resize для адаптации элементов
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);

        // Дополнительно через 300ms для завершения анимации
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 350);
    }
}

function closeSidebar(): void {
    if (sidebar) {
        // Скрываем сайдбар
        sidebar.classList.remove('open');
        (sidebar as HTMLElement).style.right = '-20vw';

        // Восстанавливаем оригинальные стили
        removeSidebarStyles();

        sidebarOpen = false;

        // Update floating button state
        updateFloatingButtonState();

        // Принудительно вызываем событие resize
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }
}

function toggleSidebar(): void {
    if (sidebarOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

// Закрываем боковую панель при клике вне её (но не на плавающую кнопку)
document.addEventListener('click', (e: MouseEvent) => {
    if (sidebarOpen &&
        sidebarContainer &&
        !sidebarContainer.contains(e.target as Node) &&
        floatingButton &&
        !floatingButton.contains(e.target as Node)) {
        closeSidebar();
    }
});

// Обработка сообщений от iframe
window.addEventListener('message', (event) => {
    if (event.data.action === 'testAlert') {
        alert('Кнопка в боковой панели была нажата!');
    } else if (event.data.action === 'analyzeContent') {
        const wordCount = document.body.innerText.split(/\s+/).length;
        const linkCount = document.querySelectorAll('a').length;
        const imageCount = document.querySelectorAll('img').length;

        alert(`Анализ страницы:
• Слов: ${wordCount}
• Ссылок: ${linkCount}  
• Изображений: ${imageCount}
• URL: ${window.location.href}`);
    }
});

// Обработка изменения размера окна
window.addEventListener('resize', () => {
    if (sidebar && sidebarOpen) {
        // Пересчитываем стили при изменении размера окна
        applySidebarStyles();
    }
});

// Обработка навигации (для SPA)
let currentUrl = location.href;
new MutationObserver(() => {
    if (location.href !== currentUrl) {
        currentUrl = location.href;
        if (sidebarOpen) {
            // Переприменяем стили после навигации
            setTimeout(() => {
                applySidebarStyles();
            }, 100);
        }

        // Reinitialize floating button if it was removed
        if (!document.getElementById('chrome-extension-floating-button')) {
            initializeFloatingButton();
        }
    }
}).observe(document.body, { childList: true, subtree: true });

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Ensure floating button is present when page becomes visible
        if (!document.getElementById('chrome-extension-floating-button')) {
            initializeFloatingButton();
        }
    }
});

// Cleanup function for page unload
window.addEventListener('beforeunload', () => {
    if (floatingButton) {
        floatingButton.remove();
    }
    if (sidebarContainer) {
        sidebarContainer.remove();
    }
});