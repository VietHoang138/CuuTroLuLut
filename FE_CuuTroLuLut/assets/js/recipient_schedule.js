document.addEventListener('DOMContentLoaded', () => {
    const scheduleList = document.getElementById('schedule-list');
    if (!scheduleList) return;

    const getAny = (obj, keys, fallback = '') => {
        if (!obj) return fallback;
        for (const k of keys) {
            const v = obj?.[k];
            if (v !== undefined && v !== null && `${v}` !== '') return v;
        }
        return fallback;
    };

    const escapeHtml = (v) => `${v ?? ''}`
        .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;').replaceAll('"', '&quot;');

    const statusClass = (tt) => {
        if (tt === 'Đã nhận') return 'status-done';
        if (tt === 'Chưa nhận') return 'status-upcoming';
        return '';
    };

    const statusBadge = (tt) => {
        if (tt === 'Đã nhận') return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.78rem;font-weight:600;color:#16a34a;background:#dcfce7;padding:2px 10px;border-radius:999px;"><i class="fa-solid fa-check"></i>${escapeHtml(tt)}</span>`;
        return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.78rem;font-weight:600;color:#d97706;background:#fef3c7;padding:2px 10px;border-radius:999px;"><i class="fa-solid fa-clock"></i>${escapeHtml(tt)}</span>`;
    };

    const renderSchedule = (list) => {
        if (!list.length) {
            scheduleList.innerHTML = `
                <div style="text-align:center;padding:3rem;color:var(--text-muted);">
                    <i class="fa-solid fa-calendar-xmark" style="font-size:2.5rem;margin-bottom:1rem;color:#94a3b8;"></i>
                    <p>Chưa có lịch cấp phát nào cho thôn của bạn.</p>
                </div>`;
            return;
        }

        scheduleList.innerHTML = list.map(item => {
            const tenDot = getAny(item, ['tenDot', 'TenDot']);
            const tenThon = getAny(item, ['tenThon', 'TenThon']);
            const tenHang = getAny(item, ['tenHang', 'TenHang']);
            const soLuong = getAny(item, ['soLuong', 'SoLuong']);
            const donViTinh = getAny(item, ['donViTinh', 'DonViTinh']);
            const ngayBatDau = getAny(item, ['ngayBatDau', 'NgayBatDau']);
            const ngayKetThuc = getAny(item, ['ngayKetThuc', 'NgayKetThuc']);
            const trangThai = getAny(item, ['trangThai', 'TrangThai']);
            const cls = statusClass(trangThai);

            return `
            <div class="schedule-item ${cls}">
                <div class="schedule-date">
                    <i class="fa-regular fa-calendar"></i>
                    ${escapeHtml(ngayBatDau) || '—'}
                    ${ngayKetThuc ? ` → ${escapeHtml(ngayKetThuc)}` : ''}
                </div>
                <div class="schedule-card">
                    <div class="schedule-title">${escapeHtml(tenDot)}</div>
                    <div class="schedule-details">
                        <div><i class="fa-solid fa-location-dot"></i> Thôn: <strong>${escapeHtml(tenThon)}</strong></div>
                        <div><i class="fa-solid fa-box-open"></i> Hàng hóa: <strong>${escapeHtml(tenHang)}</strong> — ${escapeHtml(soLuong)} ${escapeHtml(donViTinh)}</div>
                        <div style="margin-top:1rem; display: flex; justify-content: space-between; align-items: center;">
                            ${statusBadge(trangThai)}
                            ${trangThai === 'Chưa nhận' ? `<button onclick="openOtpModal('${escapeHtml(item.id || Math.floor(100000 + Math.random() * 900000))}')" style="background: var(--primary-color); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><i class="fa-solid fa-ticket"></i> Xem Mã Nhận Hàng</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    };

    const loadSchedule = async () => {
        // Lấy maThon từ localStorage (lưu khi đăng nhập)
        const maThon = localStorage.getItem('maThon') || '';

        try {
            // Nếu có maThon → lọc theo thôn, không thì lấy tất cả
            const endpoint = maThon
                ? `/api/LichSuCapPhat/by-thon/${encodeURIComponent(maThon)}`
                : '/api/LichSuCapPhat';

            const data = await window.CuuTroApi.requestJson(endpoint);
            renderSchedule(Array.isArray(data) ? data : []);
        } catch (err) {
            scheduleList.innerHTML = `
                <div style="text-align:center;padding:3rem;color:#dc2626;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;margin-bottom:1rem;"></i>
                    <p>Không tải được lịch trình. ${escapeHtml(err.message || '')}</p>
                </div>`;
        }
    };

    // Hiển thị tên user
    const displayUserName = document.getElementById('display-user-name');
    if (displayUserName) {
        const name = localStorage.getItem('userName');
        if (name) displayUserName.textContent = name;
    }

    loadSchedule();
});

// Modal Logic for OTP
window.openOtpModal = function(otpCode) {
    const modal = document.getElementById('otp-modal');
    const displayOtp = document.getElementById('display-otp-code');
    if (modal && displayOtp) {
        displayOtp.textContent = otpCode;
        modal.style.display = 'flex';
        // Simple animation
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
    }
};

window.closeOtpModal = function() {
    const modal = document.getElementById('otp-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
};
