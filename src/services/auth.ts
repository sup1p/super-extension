interface AuthResponse {
    access_token: string;
    token_type: string;
}

export class AuthService {
    private static readonly TOKEN_KEY = 'auth_token';
    private static readonly API_URL = `${import.meta.env.VITE_API_URL}/auth/login`; // Replace with your actual API endpoint
    private static cachedToken: string | null = null;

    static async login(email: string, password: string): Promise<boolean> {
        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                console.log('Login failed:', response.status);
                return false;
            }

            const data: AuthResponse = await response.json();
            console.log('Login response:', data);

            // Store token in chrome.storage.local
            await chrome.storage.local.set({ [this.TOKEN_KEY]: data.access_token });
            this.cachedToken = data.access_token;


            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    static async logout(): Promise<void> {
        await chrome.storage.local.remove(this.TOKEN_KEY);
        this.cachedToken = null;
    }

    static async isAuthenticated(): Promise<boolean> {
        try {
            const result = await chrome.storage.local.get(this.TOKEN_KEY);
            return !!result[this.TOKEN_KEY];
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    }

    static async getToken(): Promise<string | null> {
        if (this.cachedToken) return this.cachedToken;
        try {
            const result = await chrome.storage.local.get(this.TOKEN_KEY);
            this.cachedToken = result[this.TOKEN_KEY] || null;
            return this.cachedToken;
        } catch (error) {
            console.error('Get token error:', error);
            return null;
        }
    }
}

if (typeof window !== 'undefined') {
    (window as any).AuthService = AuthService;
} 