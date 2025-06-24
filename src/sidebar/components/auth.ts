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

export function showAuthModal(doc: Document) {
    if (doc.getElementById('auth-modal')) return;
    const modal = doc.createElement('div');
    modal.id = 'auth-modal';
    modal.style.cssText = `
        position: fixed;
        z-index: 9999;
        left: 0; top: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.85);
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    const box = doc.createElement('div');
    box.style.cssText = `
        background: #222;
        padding: 36px 32px 28px 32px;
        border-radius: 16px;
        box-shadow: 0 4px 32px #0008;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 320px;
    `;
    const title = doc.createElement('div');
    title.textContent = 'Требуется авторизация';
    title.style.cssText = 'font-size: 22px; font-weight: 700; margin-bottom: 18px;';

    // Форма логина
    const form = doc.createElement('form');
    form.style.cssText = 'display: flex; flex-direction: column; gap: 12px; width: 100%;';
    const emailInput = doc.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'Email';
    emailInput.required = true;
    emailInput.style.cssText = 'padding: 10px; border-radius: 8px; border: 1px solid #444; background: #181818; color: #fff; font-size: 15px;';
    const passInput = doc.createElement('input');
    passInput.type = 'password';
    passInput.placeholder = 'Пароль';
    passInput.required = true;
    passInput.style.cssText = 'padding: 10px; border-radius: 8px; border: 1px solid #444; background: #181818; color: #fff; font-size: 15px;';
    const errorDiv = doc.createElement('div');
    errorDiv.style.cssText = 'color: #ff5252; font-size: 14px; min-height: 18px;';
    errorDiv.textContent = '';
    const loginBtn = doc.createElement('button');
    loginBtn.type = 'submit';
    loginBtn.textContent = 'Войти';
    loginBtn.style.cssText = 'margin: 8px 0 0 0; width: 100%; padding: 10px 0; font-size: 16px; border-radius: 8px; border: none; background: #3a7afe; color: #fff; font-weight: 600; cursor: pointer;';
    form.appendChild(emailInput);
    form.appendChild(passInput);
    form.appendChild(errorDiv);
    form.appendChild(loginBtn);
    form.onsubmit = async (e) => {
        e.preventDefault();
        loginBtn.disabled = true;
        errorDiv.textContent = '';
        try {
            const success = await AuthService.login(emailInput.value, passInput.value);
            if (success) {
                modal.remove();
                (doc as any).renderNotes?.();
                window.location.reload();
            } else {
                errorDiv.textContent = 'Неверный email или пароль';
            }
        } catch (err) {
            errorDiv.textContent = 'Ошибка авторизации';
        } finally {
            loginBtn.disabled = false;
        }
    };
    // Можно добавить кнопку регистрации, если появится реализация
    box.appendChild(title);
    box.appendChild(form);

    // Добавляю кнопку регистрации
    const registerBtn = doc.createElement('button');
    registerBtn.type = 'button';
    registerBtn.textContent = 'Нет аккаунта? Зарегистрироваться';
    registerBtn.style.cssText = 'margin-top: 16px; background: none; border: none; color: #3a7afe; font-size: 15px; cursor: pointer; text-decoration: underline;';
    registerBtn.onclick = () => {
        window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
    };
    box.appendChild(registerBtn);

    modal.appendChild(box);
    doc.body.appendChild(modal);
} 