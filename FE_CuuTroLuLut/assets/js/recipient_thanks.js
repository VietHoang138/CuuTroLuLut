document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('thanks-form');
    const msgEl = document.getElementById('thanks-msg');
    const submitBtn = document.getElementById('thanks-submit');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
            msgEl.textContent = '';

            // Giả lập API call
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Gửi Lời Yêu Thương';
                msgEl.textContent = 'Thư cảm ơn của bạn đã được gửi đi thành công. Trân trọng cảm ơn bạn!';
                msgEl.style.color = '#16a34a';
                form.reset();
            }, 1200);
        });
    }
});
