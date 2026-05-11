document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const submitBtn = document.getElementById('login-submit');
    const messageEl = document.getElementById('login-message');

    if (!form) return;

    const setMessage = (text, isError = false) => {
        messageEl.textContent = text;
        messageEl.style.color = isError ? '#dc2626' : '#16a34a';
    };

    // Điều hướng theo vai trò
    // VT01: Admin, VT02: NV Kho, VT03: Người dân/nhận, VT04: Vận chuyển, VT05: Người ủng hộ
    function redirectByRole(maVaiTro) {
        switch (maVaiTro) {
            case 'VT01':
                window.location.href = 'admin_NguoiDung.html';
                break;
            case 'VT02':
                window.location.href = 'warehouse_campaigns.html';
                break;
            case 'VT03':
                window.location.href = 'recipient_campaigns.html';
                break;
            case 'VT04':
                window.location.href = 'transporter_campaigns.html';
                break;
            case 'VT05':
                window.location.href = 'donor_register.html';
                break;
            case 'VT06':
                default:
                window.location.href = 'village_head_campaigns.html';
                break;
        }
    }            


    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setMessage('');

        const loginId = document.getElementById('login-id').value.trim();
        const password = document.getElementById('password').value;

        if (!loginId || !password) {
            setMessage('Vui lòng nhập đầy đủ thông tin.', true);
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang xử lý...';

        try {
            const result = await window.CuuTroApi.requestJson('/api/Auth/login', {
                method: 'POST',
                body: JSON.stringify({ Email: loginId, MatKhau: password })
            });

            // Lưu thông tin vào localStorage
            localStorage.setItem('token', result.token || result.Token || '');
            localStorage.setItem('userId', result.userId || result.UserId || '');
            localStorage.setItem('userName', result.hoTen || result.HoTen || 'Người dùng');
            localStorage.setItem('maVaiTro', result.maVaiTro || result.MaVaiTro || '');
            localStorage.setItem('maThon', result.maThon || result.MaThon || '');

            setMessage('Đăng nhập thành công! Đang chuyển hướng...');

            setTimeout(() => {
                redirectByRole(result.maVaiTro || result.MaVaiTro || '');
            }, 800);

        } catch (error) {
            const raw = error.message || '';
            if (raw.includes('401')) {
                setMessage('Sai tài khoản hoặc mật khẩu. Vui lòng thử lại.', true);
            } else if (raw.includes('400')) {
                setMessage('Vui lòng nhập đầy đủ tài khoản và mật khẩu.', true);
            } else {
                setMessage(`Đăng nhập thất bại: ${raw}`, true);
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Đăng Nhập';
        }
    });

    // Password toggle
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function () {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
});
