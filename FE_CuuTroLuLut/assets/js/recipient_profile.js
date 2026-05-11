document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profile-form');
    const msgEl = document.getElementById('profile-msg');
    const submitBtn = document.getElementById('profile-submit');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newPass = document.getElementById('profile-new-pass').value;
            const confirmPass = document.getElementById('profile-confirm-pass').value;

            if (newPass && newPass !== confirmPass) {
                msgEl.textContent = 'Mật khẩu xác nhận không khớp!';
                msgEl.style.color = '#dc2626';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
            msgEl.textContent = '';

            // Giả lập API call
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu Thay Đổi';
                msgEl.textContent = 'Cập nhật thông tin thành công!';
                msgEl.style.color = '#16a34a';
                
                // Cập nhật tên hiển thị trên header nếu có thay đổi
                const newName = document.getElementById('profile-name').value;
                const displayName = document.getElementById('display-user-name');
                if (displayName) displayName.textContent = newName;

                // Xóa trống ô mật khẩu sau khi lưu
                document.getElementById('profile-new-pass').value = '';
                document.getElementById('profile-confirm-pass').value = '';
            }, 800);
        });
    }
});
