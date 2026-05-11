document.addEventListener('DOMContentLoaded', () => {
    // --- Logout: xóa localStorage và về trang login ---
    document.querySelectorAll('.logout-btn, [href="login.html"]').forEach(el => {
        // Chỉ gắn cho nút logout thực sự (có class logout-btn)
        if (el.classList.contains('logout-btn')) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                localStorage.removeItem('maVaiTro');
                sessionStorage.removeItem('apiWorkingBase');
                window.location.href = 'login.html';
            });
        }
    });

    // --- Hiển thị tên user trên header ---
    const displayUserName = document.getElementById('display-user-name');
    if (displayUserName && !displayUserName.dataset.bound) {
        displayUserName.dataset.bound = '1';
        const name = localStorage.getItem('userName');
        if (name) displayUserName.textContent = name;
    }

    // Handling form tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                tabBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked
                btn.classList.add('active');
                
                // Cập nhật giá trị ẩn hoặc hiển thị các trường phụ thuộc vào role
                // Ví dụ: Người ủng hộ, Người nhận, Tình nguyện viên
            });
        });
    }

    // Toggle password visibility placeholder
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const input = e.currentTarget.previousElementSibling;
            const icon = e.currentTarget.querySelector('i');
            
            if (input && input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else if (input && input.type === 'text') {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
});

// Shared API configuration/client for all frontend pages.
(() => {
    const REQUEST_TIMEOUT_MS = 12000;

    const resolveCandidates = () => {
        const customBase = localStorage.getItem('apiBaseUrl');
        if (customBase) {
            return [customBase];
        }

        const protocol = window.location.protocol;
        if (protocol === 'https:') {
            return [
                'https://localhost:7221',
                'https://localhost:44379',
                'http://localhost:5159',
                'http://localhost:21577'
            ];
        }

        // For file:// or http://, prioritize http to avoid local SSL cert issues.
        return [
            'http://localhost:5159',
            'http://localhost:21577',
            'https://localhost:7221',
            'https://localhost:44379'
        ];
    };

    const normalizePath = (path) => (path.startsWith('/') ? path : `/${path}`);
    const getToken = () => localStorage.getItem('token') || '';
    let workingBase = sessionStorage.getItem('apiWorkingBase') || '';

    const tryRequest = async (baseUrl, path, options) => {
        const method = (options.method || 'GET').toUpperCase();
        const headers = new Headers(options.headers || {});
        if (!headers.has('Accept')) {
            headers.set('Accept', 'application/json, text/plain, */*');
        }
        if (options.body && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        const token = getToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        const response = await fetch(`${baseUrl}${normalizePath(path)}`, {
            ...options,
            method,
            headers,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            let message = '';
            try {
                message = await response.text();
            } catch (_) {
                message = '';
            }
            throw new Error(`[${response.status}] ${message || 'Request failed'}`);
        }

        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();
        if (!text) {
            return null;
        }
        if (contentType.includes('application/json')) {
            try {
                return JSON.parse(text);
            } catch (_) {
                return text;
            }
        }
        return text;
    };

    const requestJson = async (path, options = {}) => {
        const candidates = resolveCandidates();
        const ordered = workingBase
            ? [workingBase, ...candidates.filter(base => base !== workingBase)]
            : candidates;

        let lastError = null;
        for (const baseUrl of ordered) {
            try {
                const data = await tryRequest(baseUrl, path, options);
                workingBase = baseUrl;
                sessionStorage.setItem('apiWorkingBase', baseUrl);
                return data;
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError || new Error('Không thể kết nối API backend.');
    };

    window.CuuTroApi = {
        requestJson,
        setApiBaseUrl: (value) => {
            if (!value) {
                localStorage.removeItem('apiBaseUrl');
                sessionStorage.removeItem('apiWorkingBase');
                workingBase = '';
                return;
            }
            localStorage.setItem('apiBaseUrl', value);
            sessionStorage.setItem('apiWorkingBase', value);
            workingBase = value;
        },
        getCurrentBaseUrl: () => workingBase,
        getCandidateBaseUrls: () => resolveCandidates()
    };
})();
