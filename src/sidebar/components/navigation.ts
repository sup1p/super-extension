export class NavigationComponent {
    static initNavigation(doc: Document): void {
        const screens = doc.querySelectorAll<HTMLElement>('.screen');

        const showScreen = (id: string) => {
            screens.forEach(s => s.classList.remove('active'));
            doc.getElementById(id)?.classList.add('active');
        };

        // Use event delegation for the dock buttons
        const dock = doc.querySelector('.dock');
        if (dock) {
            dock.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const button = target.closest('.dock__btn');
                if (button) {
                    // Remove active class from all buttons
                    doc.querySelectorAll('.dock__btn').forEach(btn => btn.classList.remove('active'));
                    // Add active class to clicked button
                    button.classList.add('active');

                    const screenId = button.getAttribute('data-screen');
                    if (screenId) {
                        showScreen(screenId);
                    }
                }
            });
        }

        // Also handle settings dock buttons
        const settingsDock = doc.querySelector('.settings_dock');
        if (settingsDock) {
            settingsDock.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const button = target.closest('.settings__dock__btn');
                if (button) {
                    // Remove active class from all settings dock buttons
                    doc.querySelectorAll('.settings__dock__btn').forEach(btn => btn.classList.remove('active'));
                    // Add active class to clicked button
                    button.classList.add('active');

                    const screenId = button.getAttribute('data-screen');
                    if (screenId) {
                        showScreen(screenId);
                    }
                }
            });
        }
    }
} 