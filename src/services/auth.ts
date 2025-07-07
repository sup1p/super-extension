interface AuthResponse {
    access_token: string;
    token_type: string;
}

async function loginViaBackground(url: string, email: string, password: string): Promise<AuthResponse> {
    return new Promise<AuthResponse>((resolve, reject) => {
        chrome.runtime.sendMessage(
            {
                type: "AUTH_LOGIN",
                url,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            },
            (response) => {
                if (!response) {
                    reject("No response from background");
                } else if (!response.ok) {
                    reject(response);
                } else if (!response.data || !response.data.access_token) {
                    reject("No access_token in response");
                } else {
                    resolve(response.data as AuthResponse);
                }
            }
        );
    });
}

export class AuthService {
    private static readonly TOKEN_KEY = 'auth_token';
    private static readonly API_URL = `${import.meta.env.VITE_API_URL}/auth/login`; // Replace with your actual API endpoint
    private static cachedToken: string | null = null;

    static async login(email: string, password: string): Promise<boolean> {
        try {
            const data = await loginViaBackground(this.API_URL, email, password);
            if (!data.access_token) {
                console.error('No access_token in response:', data);
                return false;
            }

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