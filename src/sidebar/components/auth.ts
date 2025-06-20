import { AuthService } from '../../services/auth';

export class AuthComponent {
    static initAuth(doc: Document): void {
        console.log('AuthComponent: Initializing...');

        const authModal = doc.getElementById('auth-modal');
        console.log('AuthComponent: Modal element:', authModal);

        const loginForm = doc.getElementById('login-form') as HTMLFormElement;
        const emailInput = doc.getElementById('email-input') as HTMLInputElement;
        const passwordInput = doc.getElementById('password-input') as HTMLInputElement;
        const errorMessage = doc.getElementById('auth-error') as HTMLDivElement;
        const logoutButton = doc.getElementById('logout-button');
        const accountModal = doc.getElementById('account-modal');

        // Check authentication status on init
        this.checkAuthStatus(doc);

        // Handle login form submission
        if (loginForm) {
            console.log('AuthComponent: Login form found');
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('AuthComponent: Form submitted');
                const email = emailInput.value;
                const password = passwordInput.value;

                try {
                    const success = await AuthService.login(email, password);
                    console.log('AuthComponent: Login result:', success);
                    if (success) {
                        // Hide modal and update UI
                        if (authModal) {
                            authModal.classList.remove('active');
                        }
                        this.updateUIForAuthenticatedUser(doc);
                    } else {
                        errorMessage.textContent = 'Invalid credentials';
                        errorMessage.style.display = 'block';
                    }
                } catch (error) {
                    console.error('AuthComponent: Login error:', error);
                    errorMessage.textContent = 'An error occurred. Please try again.';
                    errorMessage.style.display = 'block';
                }
            });
        } else {
            console.log('AuthComponent: Login form not found');
        }

        // Handle logout
        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                await AuthService.logout();
                this.updateUIForUnauthenticatedUser(doc);
                if (accountModal) {
                    accountModal.classList.remove('active');
                }
            });
        }
    }

    private static async checkAuthStatus(doc: Document): Promise<void> {
        console.log('AuthComponent: Checking auth status...');
        const isAuthenticated = await AuthService.isAuthenticated();
        console.log('AuthComponent: Is authenticated:', isAuthenticated);

        const authModal = doc.getElementById('auth-modal');
        if (!isAuthenticated && authModal) {
            console.log('AuthComponent: Showing auth modal');
            authModal.classList.add('active');
            this.updateUIForUnauthenticatedUser(doc);
        } else {
            console.log('AuthComponent: Updating UI for authenticated user');
            this.updateUIForAuthenticatedUser(doc);
        }
    }

    private static updateUIForAuthenticatedUser(doc: Document): void {
        // Update UI elements to show authenticated state
        const accountButton = doc.querySelector('button[title="Account"]');
        const loginButton = doc.getElementById('login-button');
        const logoutButton = doc.getElementById('logout-button');

        if (accountButton) {
            accountButton.classList.add('authenticated');
        }
        if (loginButton) {
            loginButton.style.display = 'none';
        }
        if (logoutButton) {
            logoutButton.style.display = 'block';
        }
    }

    private static updateUIForUnauthenticatedUser(doc: Document): void {
        // Update UI elements to show unauthenticated state
        const accountButton = doc.querySelector('button[title="Account"]');
        const loginButton = doc.getElementById('login-button');
        const logoutButton = doc.getElementById('logout-button');
        const authModal = doc.getElementById('auth-modal');

        if (accountButton) {
            accountButton.classList.remove('authenticated');
        }
        if (loginButton) {
            loginButton.style.display = 'block';
        }
        if (logoutButton) {
            logoutButton.style.display = 'none';
        }
        if (authModal) {
            authModal.classList.add('active');
        }
    }
} 