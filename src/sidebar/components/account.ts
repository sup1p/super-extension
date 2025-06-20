export class AccountComponent {
    static initAuth(doc: Document): void {
        const accountModal = doc.getElementById("account-modal");
        const closeAccountModal = doc.getElementById('close-account-modal');
        const accountButton = doc.querySelector('button[title="Account"]');
        const accountItems = doc.querySelectorAll('.account-item');



        const openAccountModal = () => {
            if (accountModal) {
                accountModal.classList.add('active');
            }
        };

        const closeAccountModalHandler = () => {
            if (accountModal) {
                accountModal.classList.remove('active');
            }
        };

        if (accountButton) {
            accountButton.addEventListener('click', openAccountModal);
        }

        if (closeAccountModal) {
            closeAccountModal.addEventListener('click', closeAccountModalHandler);
        }

        if (accountModal) {
            accountModal.addEventListener('click', (e) => {
                if (e.target === accountModal) {
                    closeAccountModalHandler();
                }
            });
        }

        accountItems.forEach(item => {
            item.addEventListener('click', () => {
                const toolName = item.getAttribute('data-tool');
                console.log('Selected tool:', toolName);
                // Здесь можно добавить логику для каждого инструмента
                closeAccountModalHandler();
            });
        });

    }
} 