document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('request-form');
    const campaignSelect = document.getElementById('req-campaign');
    const msgEl = document.getElementById('req-msg');
    const submitBtn = document.getElementById('req-submit');

    // Giả lập load danh sách đợt cứu trợ
    const loadCampaigns = () => {
        const campaigns = [
            { id: 1, name: 'Cứu trợ Bão Yagi (Đang diễn ra)' },
            { id: 2, name: 'Hỗ trợ sửa nhà sau bão (Sắp tới)' },
            { id: 3, name: 'Hỗ trợ khắc phục ngập lụt diện rộng' }
        ];
        
        if (campaignSelect) {
            campaignSelect.innerHTML = '<option value="" disabled selected>-- Chọn đợt cứu trợ phù hợp --</option>';
            campaigns.forEach(c => {
                campaignSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
            });

            // Lấy ID từ URL nếu có (từ trang Danh sách đợt ủng hộ)
            const urlParams = new URLSearchParams(window.location.search);
            const prefillId = urlParams.get('campaignId');
            if (prefillId) {
                campaignSelect.value = prefillId;
            }
        }
    };

    loadCampaigns();

    const showMessage = (text, type) => {
        msgEl.textContent = text;
        msgEl.className = `msg-alert msg-${type}`;
    };

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validation
            const checkboxes = document.querySelectorAll('.needs-grid input[type="checkbox"]:checked');
            if (checkboxes.length === 0) {
                showMessage('Vui lòng chọn ít nhất một nhu cầu hỗ trợ.', 'error');
                return;
            }

            // Animate button
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang xử lý...</span>';
            msgEl.className = 'msg-alert hidden';

            // Giả lập API call
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span>Gửi Yêu Cầu Khẩn Cấp</span> <i class="fa-solid fa-paper-plane"></i>';
                showMessage('Gửi yêu cầu khẩn cấp thành công! Hệ thống đã ghi nhận và sẽ phản hồi trong thời gian sớm nhất.', 'success');
                form.reset();
                
                // Cuộn xuống thông báo
                msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 1500);
        });
    }
});
