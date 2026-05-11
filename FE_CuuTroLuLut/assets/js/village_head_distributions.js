document.addEventListener('DOMContentLoaded', () => {
    const listEl = document.getElementById('distributions-list');
    const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');

    if (!listEl) return;

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

    let allData = [];
    let currentTab = 'upcoming';
    let selectedItem = null;

    // --- Render cards ---
    const renderCards = (list) => {
        if (!list.length) {
            listEl.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-box-open" style="color:#94a3b8;"></i>
                    <p>Không có dữ liệu cấp phát.</p>
                </div>`;
            return;
        }

        listEl.innerHTML = list.map(item => {
            const tenDot = getAny(item, ['tenDot', 'TenDot']);
            const tenThon = getAny(item, ['tenThon', 'TenThon']);
            const tenHang = getAny(item, ['tenHang', 'TenHang']);
            const soLuong = getAny(item, ['soLuong', 'SoLuong']);
            const donViTinh = getAny(item, ['donViTinh', 'DonViTinh']);
            const ngayBatDau = getAny(item, ['ngayBatDau', 'NgayBatDau']);
            const ngayKetThuc = getAny(item, ['ngayKetThuc', 'NgayKetThuc']);
            const trangThai = getAny(item, ['trangThai', 'TrangThai']);
            const maCapPhat = getAny(item, ['maCapPhat', 'MaCapPhat']);

            // Parse ngày để hiển thị
            const dateObj = ngayBatDau ? new Date(ngayBatDau) : null;
            const day = dateObj ? dateObj.getDate() : '—';
            const month = dateObj ? dateObj.toLocaleString('vi-VN', { month: 'short' }) : '';

            const isDone = trangThai === 'Đã nhận';

            return `
            <div class="event-card" data-id="${escapeHtml(maCapPhat)}">
                <div class="event-date">
                    <div class="date-day">${day}</div>
                    <div class="date-month">${month}</div>
                    <div class="date-time">${escapeHtml(ngayBatDau) || '—'}</div>
                </div>
                <div class="event-body">
                    <div class="event-title">${escapeHtml(tenDot)}</div>
                    <div class="event-desc">Cấp phát hàng cứu trợ cho thôn <strong>${escapeHtml(tenThon)}</strong></div>
                    <div class="event-meta">
                        <div class="meta-item">
                            <i class="fa-solid fa-box-open"></i>
                            <span>${escapeHtml(tenHang)} — ${escapeHtml(soLuong)} ${escapeHtml(donViTinh)}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fa-regular fa-calendar-xmark"></i>
                            <span>Kết thúc: ${escapeHtml(ngayKetThuc) || '—'}</span>
                        </div>
                        <div class="meta-item">
                            ${isDone
                                ? `<span style="color:#16a34a;font-weight:700;"><i class="fa-solid fa-circle-check"></i> Đã hoàn thành</span>`
                                : `<span style="color:#d97706;font-weight:700;"><i class="fa-solid fa-clock"></i> Chưa nhận</span>`
                            }
                        </div>
                    </div>
                </div>
                <div class="event-actions">
                    ${!isDone
                        ? `<button class="btn-details btn-start-distribute" data-id="${escapeHtml(maCapPhat)}">
                               <i class="fa-solid fa-play"></i> Tiến Hành
                           </button>`
                        : `<button class="btn-details" data-id="${escapeHtml(maCapPhat)}" data-action="view">
                               <i class="fa-solid fa-eye"></i> Chi Tiết
                           </button>`
                    }
                </div>
            </div>`;
        }).join('');
    };

    const applyTab = () => {
        const filtered = allData.filter(item => {
            const tt = getAny(item, ['trangThai', 'TrangThai']);
            return currentTab === 'upcoming' ? tt !== 'Đã nhận' : tt === 'Đã nhận';
        });
        renderCards(filtered);
    };

    // --- Load data ---
    const loadData = async () => {
        listEl.innerHTML = `<div class="loading-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Đang tải kế hoạch cấp phát...</p></div>`;
        try {
            const maThon = localStorage.getItem('maThon') || '';
            const endpoint = maThon
                ? `/api/LichSuCapPhat/by-thon/${encodeURIComponent(maThon)}`
                : '/api/LichSuCapPhat';
            const data = await window.CuuTroApi.requestJson(endpoint);
            allData = Array.isArray(data) ? data : [];
            applyTab();
        } catch (err) {
            listEl.innerHTML = `<div class="loading-state" style="color:#dc2626;">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Không tải được dữ liệu. ${escapeHtml(err.message || '')}</p>
            </div>`;
        }
    };

    // --- Tab switch ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.getAttribute('data-tab');
            applyTab();
        });
    });

    // --- Click "Tiến Hành" → mở modal OTP ---
    listEl.addEventListener('click', (e) => {
        const startBtn = e.target?.closest?.('.btn-start-distribute');
        if (startBtn) {
            const id = startBtn.getAttribute('data-id');
            selectedItem = allData.find(x => getAny(x, ['maCapPhat', 'MaCapPhat']) === id);
            if (selectedItem) openOtpModal(selectedItem);
            return;
        }
        const viewBtn = e.target?.closest?.('.btn-details[data-action="view"]');
        if (viewBtn) {
            const id = viewBtn.getAttribute('data-id');
            selectedItem = allData.find(x => getAny(x, ['maCapPhat', 'MaCapPhat']) === id);
            if (selectedItem) openDetailsModal(selectedItem);
        }
    });

    // --- Modal chi tiết ---
    window.openDetailsModal = (item) => {
        const tenDot = getAny(item, ['tenDot', 'TenDot']);
        const tenThon = getAny(item, ['tenThon', 'TenThon']);
        const tenHang = getAny(item, ['tenHang', 'TenHang']);
        const soLuong = getAny(item, ['soLuong', 'SoLuong']);
        const donViTinh = getAny(item, ['donViTinh', 'DonViTinh']);
        const ngayBatDau = getAny(item, ['ngayBatDau', 'NgayBatDau']);
        const ngayKetThuc = getAny(item, ['ngayKetThuc', 'NgayKetThuc']);
        const trangThai = getAny(item, ['trangThai', 'TrangThai']);

        document.getElementById('modal-details-content').innerHTML = `
            <div class="detail-row"><span class="detail-label">Đợt cứu trợ</span><span class="detail-value">${escapeHtml(tenDot)}</span></div>
            <div class="detail-row"><span class="detail-label">Thôn nhận</span><span class="detail-value">${escapeHtml(tenThon)}</span></div>
            <div class="detail-row"><span class="detail-label">Hàng hóa</span><span class="detail-value">${escapeHtml(tenHang)} — ${escapeHtml(soLuong)} ${escapeHtml(donViTinh)}</span></div>
            <div class="detail-row"><span class="detail-label">Thời gian</span><span class="detail-value">${escapeHtml(ngayBatDau)} → ${escapeHtml(ngayKetThuc)}</span></div>
            <div class="detail-row"><span class="detail-label">Trạng thái</span><span class="detail-value">${escapeHtml(trangThai)}</span></div>
        `;
        const modal = document.getElementById('details-modal');
        modal.style.display = 'flex';
        setTimeout(() => { modal.style.opacity = '1'; modal.querySelector('.modal-content').style.transform = 'scale(1)'; }, 10);
    };

    window.closeDetailsModal = () => {
        const modal = document.getElementById('details-modal');
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.95)';
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    };

    // --- Modal OTP ---
    window.openOtpModal = (item) => {
        const tenDot = getAny(item, ['tenDot', 'TenDot']);
        document.getElementById('verify-campaign-name').textContent = tenDot;
        document.getElementById('otp-input').value = '';
        document.getElementById('verify-result-area').style.display = 'none';
        document.getElementById('verify-error-area').style.display = 'none';
        document.getElementById('btn-confirm-delivery').style.display = 'none';

        const modal = document.getElementById('otp-verify-modal');
        modal.style.display = 'flex';
        setTimeout(() => { modal.style.opacity = '1'; modal.querySelector('.modal-content').style.transform = 'scale(1)'; }, 10);
    };

    window.closeOtpVerifyModal = () => {
        const modal = document.getElementById('otp-verify-modal');
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.95)';
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    };

    // Kiểm tra mã OTP — tìm người dân trong thôn theo mã yêu cầu
    window.verifyOtp = async () => {
        const code = (document.getElementById('otp-input').value || '').trim();
        if (!code) { alert('Vui lòng nhập mã nhận hàng.'); return; }

        const resultArea = document.getElementById('verify-result-area');
        const errorArea = document.getElementById('verify-error-area');
        const confirmBtn = document.getElementById('btn-confirm-delivery');

        resultArea.style.display = 'none';
        errorArea.style.display = 'none';
        confirmBtn.style.display = 'none';

        try {
            // Tìm yêu cầu cứu trợ theo mã (dùng MaYeuCau làm "mã nhận hàng")
            const maDot = selectedItem ? getAny(selectedItem, ['maDot', 'MaDot']) : '';
            const data = await window.CuuTroApi.requestJson(`/api/YeuCauCuuTro`);
            const found = Array.isArray(data)
                ? data.find(yc =>
                    getAny(yc, ['maYeuCau', 'MaYeuCau']) === code &&
                    getAny(yc, ['maDot', 'MaDot']) === maDot &&
                    getAny(yc, ['trangThai', 'TrangThai']) === 'Đã duyệt'
                  )
                : null;

            if (found) {
                document.getElementById('verify-recipient-name').textContent = getAny(found, ['hoTen', 'HoTen'], '—');
                document.getElementById('verify-recipient-id').textContent = getAny(found, ['maNguoiDung', 'MaNguoiDung'], '—');
                document.getElementById('verify-items-desc').textContent = getAny(found, ['noiDung', 'NoiDung'], '—');
                resultArea.style.display = 'block';
                confirmBtn.style.display = 'inline-flex';
            } else {
                errorArea.style.display = 'block';
            }
        } catch (err) {
            errorArea.style.display = 'block';
        }
    };

    // Xác nhận đã giao → cập nhật trạng thái LichSuCapPhat
    window.confirmDelivery = async () => {
        if (!selectedItem) return;
        const maCapPhat = getAny(selectedItem, ['maCapPhat', 'MaCapPhat']);
        try {
            await window.CuuTroApi.requestJson(`/api/LichSuCapPhat/${encodeURIComponent(maCapPhat)}/trang-thai`, {
                method: 'PATCH',
                body: JSON.stringify({ TrangThai: 'Đã nhận' })
            });
            closeOtpVerifyModal();
            await loadData();
        } catch (err) {
            alert(`Lỗi xác nhận: ${err.message || ''}`);
        }
    };

    // User name
    const displayUserName = document.getElementById('display-user-name');
    if (displayUserName) {
        const name = localStorage.getItem('userName');
        if (name) displayUserName.textContent = name;
    }

    loadData();
});
