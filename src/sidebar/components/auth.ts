import { AuthService } from '../../services/auth';
import { TranslationService } from '../../services/translations';

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
    // Показывать только если это не основной document (т.е. iframe)
    if (doc === window.document && window.top === window.self) return; // Не показывать на основном сайте

    // Detect theme using the same logic as in sidebar
    const getCurrentTheme = (): 'light' | 'dark' => {
        // Check if there's a theme class on body
        const bodyTheme = doc.body.classList.contains('theme-light') ? 'light' :
            doc.body.classList.contains('theme-dark') ? 'dark' : null;

        if (bodyTheme) return bodyTheme;

        // Check if there's a dark class on html
        if (doc.documentElement.classList.contains('dark')) return 'dark';

        // Check system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const isDarkTheme = getCurrentTheme() === 'dark';

    const modal = doc.createElement('div');
    modal.id = 'auth-modal';
    modal.style.cssText = `
        position: fixed;
        z-index: 9999;
        left: 0; top: 0; right: 0; bottom: 0;
        background: ${isDarkTheme ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.4)'};
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
    `;

    const box = doc.createElement('div');
    box.style.cssText = `
        background: ${isDarkTheme ? '#1a1a1a' : '#ffffff'};
        padding: 40px;
        border-radius: 20px;
        box-shadow: ${isDarkTheme
            ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'};
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 380px;
        max-width: 420px;
        animation: slideUp 0.3s ease-out;
        border: 1px solid ${isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
    `;

    const title = doc.createElement('div');
    title.textContent = TranslationService.translate('auth_required');
    title.style.cssText = `
        font-size: 24px; 
        font-weight: 700; 
        margin-bottom: 8px;
        color: ${isDarkTheme ? '#ffffff' : '#1a1a1a'};
        text-align: center;
    `;

    const subtitle = doc.createElement('div');
    subtitle.textContent = TranslationService.translate('auth_subtitle');
    subtitle.style.cssText = `
        font-size: 14px;
        color: ${isDarkTheme ? '#a0a0a0' : '#666666'};
        margin-bottom: 32px;
        text-align: center;
        line-height: 1.4;
    `;

    // Форма логина
    const form = doc.createElement('form');
    form.style.cssText = 'display: flex; flex-direction: column; gap: 16px; width: 100%;';

    const emailInput = doc.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = TranslationService.translate('email');
    emailInput.required = true;
    emailInput.style.cssText = `
        padding: 14px 16px; 
        border-radius: 12px; 
        border: 2px solid ${isDarkTheme ? '#333333' : '#e0e0e0'};
        background: ${isDarkTheme ? '#2a2a2a' : '#f8f8f8'};
        color: ${isDarkTheme ? '#ffffff' : '#1a1a1a'};
        font-size: 15px;
        transition: all 0.2s ease;
        outline: none;
        box-sizing: border-box;
    `;

    const passInput = doc.createElement('input');
    passInput.type = 'password';
    passInput.placeholder = TranslationService.translate('password');
    passInput.required = true;
    passInput.style.cssText = emailInput.style.cssText;

    // Focus styles
    const focusStyle = `
        border-color: #6F58D5;
        box-shadow: 0 0 0 3px ${isDarkTheme ? 'rgba(111, 88, 213, 0.2)' : 'rgba(111, 88, 213, 0.1)'};
    `;

    emailInput.addEventListener('focus', () => {
        emailInput.style.cssText = emailInput.style.cssText + focusStyle;
    });
    emailInput.addEventListener('blur', () => {
        emailInput.style.cssText = emailInput.style.cssText.replace(focusStyle, '');
    });

    passInput.addEventListener('focus', () => {
        passInput.style.cssText = passInput.style.cssText + focusStyle;
    });
    passInput.addEventListener('blur', () => {
        passInput.style.cssText = passInput.style.cssText.replace(focusStyle, '');
    });

    const errorDiv = doc.createElement('div');
    errorDiv.style.cssText = `
        color: #ff5252; 
        font-size: 14px; 
        min-height: 20px;
        text-align: center;
        font-weight: 500;
    `;
    errorDiv.textContent = '';

    const loginBtn = doc.createElement('button');
    loginBtn.type = 'submit';
    loginBtn.textContent = TranslationService.translate('login');
    loginBtn.style.cssText = `
        margin: 8px 0 0 0; 
        width: 100%; 
        padding: 14px 0; 
        font-size: 16px; 
        border-radius: 12px; 
        border: none; 
        background: linear-gradient(135deg, #6F58D5 0%, #8B7AE6 100%);
        color: #ffffff; 
        font-weight: 600; 
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 16px rgba(111, 88, 213, 0.3);
    `;

    // Hover effect for button
    loginBtn.addEventListener('mouseenter', () => {
        loginBtn.style.transform = 'translateY(-2px)';
        loginBtn.style.boxShadow = '0 6px 20px rgba(111, 88, 213, 0.4)';
    });
    loginBtn.addEventListener('mouseleave', () => {
        loginBtn.style.transform = 'translateY(0)';
        loginBtn.style.boxShadow = '0 4px 16px rgba(111, 88, 213, 0.3)';
    });

    form.appendChild(emailInput);
    form.appendChild(passInput);
    form.appendChild(errorDiv);
    form.appendChild(loginBtn);

    form.onsubmit = async (e) => {
        e.preventDefault();
        loginBtn.disabled = true;
        loginBtn.textContent = TranslationService.translate('logging_in');
        loginBtn.style.background = 'linear-gradient(135deg, #5a4bb8 0%, #7a6ad8 100%)';
        errorDiv.textContent = '';

        try {
            const success = await AuthService.login(emailInput.value, passInput.value);
            if (success) {
                modal.remove();
                (doc as any).renderNotes?.();
                window.location.reload();
            } else {
                errorDiv.textContent = 'Неверный email или пароль';
                // Shake animation for error
                box.style.animation = 'shake 0.5s ease-in-out';
                setTimeout(() => {
                    box.style.animation = '';
                }, 500);
            }
        } catch (err) {
            errorDiv.textContent = 'Ошибка авторизации';
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = TranslationService.translate('login');
            loginBtn.style.background = 'linear-gradient(135deg, #6F58D5 0%, #8B7AE6 100%)';
        }
    };

    box.appendChild(title);
    box.appendChild(subtitle);
    box.appendChild(form);

    // Добавляю кнопку регистрации
    const registerBtn = doc.createElement('button');
    registerBtn.type = 'button';
    registerBtn.textContent = TranslationService.translate('register');
    registerBtn.style.cssText = `
        margin-top: 24px; 
        background: none; 
        border: none; 
        color: #6F58D5; 
        font-size: 14px; 
        cursor: pointer; 
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s ease;
    `;

    registerBtn.addEventListener('mouseenter', () => {
        registerBtn.style.color = '#8B7AE6';
    });
    registerBtn.addEventListener('mouseleave', () => {
        registerBtn.style.color = '#6F58D5';
    });

    registerBtn.addEventListener('click', () => {
        window.open('https://yourmegan.me/auth', '_blank');
    });

    box.appendChild(registerBtn);

    // Add close (X) button to the top right of the modal
    const closeSidebarBtn = doc.createElement('button');
    closeSidebarBtn.textContent = '×';
    closeSidebarBtn.setAttribute('aria-label', 'Закрыть сайдбар');
    closeSidebarBtn.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        color: ${isDarkTheme ? '#fff' : '#232323'};
        font-size: 28px;
        font-weight: 700;
        cursor: pointer;
        z-index: 10;
        padding: 0 8px;
        border-radius: 4px;
        transition: background 0.2s, color 0.2s;
    `;
    closeSidebarBtn.addEventListener('mouseenter', () => {
        closeSidebarBtn.style.background = isDarkTheme ? '#232323' : '#ececec';
    });
    closeSidebarBtn.addEventListener('mouseleave', () => {
        closeSidebarBtn.style.background = 'none';
    });
    closeSidebarBtn.onclick = () => {
        // Try to close the sidebar via Sidebar instance or global function
        if (typeof (window as any).sidebarInstance?.closeSidebar === 'function') {
            (window as any).sidebarInstance.closeSidebar();
        } else if (typeof (window as any).closeSidebar === 'function') {
            (window as any).closeSidebar();
        } else {
            // Fallback: remove modal
            modal.remove();
        }
    };
    box.appendChild(closeSidebarBtn);

    // Add CSS animations
    const style = doc.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from { 
                opacity: 0; 
                transform: translateY(20px) scale(0.95);
            }
            to { 
                opacity: 1; 
                transform: translateY(0) scale(1);
            }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    doc.head.appendChild(style);

    modal.appendChild(box);
    doc.body.appendChild(modal);

    // Focus on email input
    setTimeout(() => {
        emailInput.focus();
    }, 100);
} 