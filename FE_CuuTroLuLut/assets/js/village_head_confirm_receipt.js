document.addEventListener('DOMContentLoaded', () => {
    const tbody       = document.querySelector('#shipments-table tbody');
    const searchInput = document.getElementById('shipment-search');

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

    let allShipments    = [];
    let currentId       = null;
    const userId        = localStorage.getItem('userId') || '';
    const maThon        = localStorage.getItem('maThon') || '';

    // ─── Render bảng ────────────────────────────────
    const renderTable = (list) => {
        if (!list.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">Chưa có chuyến xe nào.</td></tr>`;
            return;
        }

        tbody.innerHTML = list.map(item => {
            const ma       = getAny(item, ['maPhieuXuat', 'MaPhieuXuat']);
            const ngay     = getAny(item, ['ngayXuat', 'NgayXuat'], '—');
            const nguoiLap = getAny(item, ['nguoiLap', 'NguoiLap'], '—');
            const taiXe    = getAny(item, ['taiXe', 'TaiXe'], '—');
            const sdtTaiXe = getAny(item, ['sdtTaiXe', 'SdtTaiXe'], '');
            const bienSo   = getAny(item, ['bienSoXe', 'BienSoXe'], '—');
            const hangHoa  = getAny(item, ['hangHoa', 'HangHoa'], '—');
            const tt       = getAny(item, ['trangThai', 'TrangThai'], '—');

            const isDone = tt === 'Đã hoàn thành' || tt === 'Đã giao thành công';

            const badge = isDone
                ? `<span class="status-badge badge-received"><i class="fa-solid fa-check"></i> Đã Nhận</span>`
                : `<span class="status-badge badge-incoming"><i class="fa-solid fa-truck-fast"></i> Đang Đến</span>`;

            const actionBtn = isDone
                ? `<button class="btn btn-sm" style="background:#e2e8f0;color:#64748b;border:none;cursor:default;"><i class="fa-solid fa-check"></i> Đã Hoàn Tất</button>`
                : `<button class="btn btn-sm btn-action" data-action="confirm" title="Xác nhận nhận hàng">
                       <i class="fa-solid fa-handshake"></i> Xác Nhận Nhận Hàng
                   </button>`;

            return `
            <tr data-id="${escapeHtml(ma)}">
                <td><strong style="color:var(--primary-color);">${escapeHtml(ma)}</strong></td>
                <td>${escapeHtml(nguoiLap)}</td>
                <td>
                    <div style="font-weight:600;">${escapeHtml(taiXe)}</div>
                    ${sdtTaiXe ? `<div style="font-size:0.8rem;color:var(--text-muted);"><i class="fa-solid fa-phone"></i> ${escapeHtml(sdtTaiXe)}</div>` : ''}
                    <div style="font-size:0.8rem;color:var(--accent-orange);"><i class="fa-solid fa-truck"></i> ${escapeHtml(bienSo)}</div>
                </td>
                <td style="color:var(--accent-orange);font-weight:600;">${escapeHtml(ngay)}</td>
                <td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(hangHoa)}">${escapeHtml(hangHoa)}</td>
                <td>${badge}</td>
                <td><div class="action-buttons">${actionBtn}</div></td>
            </tr>`;
        }).join('');
    };

    const updateStats = (list) => {
        const incoming = list.filter(x => {
            const tt = getAny(x, ['trangThai', 'TrangThai']);
            return tt === 'Đang vận chuyển';
        }).length;
        const received = list.filter(x => {
            const tt = getAny(x, ['trangThai', 'TrangThai']);
            return tt === 'Đã hoàn thành' || tt === 'Đã giao thành công';
        }).length;

        const el1 = document.querySelector('.stat-card:nth-child(1) .stat-number');
        const el2 = document.querySelector('.stat-card:nth-child(2) .stat-number');
        if (el1) el1.textContent = incoming;
        if (el2) el2.textContent = received;
    };

    // ─── Load dữ liệu ───────────────────────────────
    const loadShipments = async () => {
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải dữ liệu...</td></tr>`;
        try {
            const data = await window.CuuTroApi.requestJson('/api/PhieuXuat/cho-thon/all');
            allShipments = Array.isArray(data) ? data : [];
            renderTable(allShipments);
            updateStats(allShipments);
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" class="loading-cell" style="color:#dc2626;">Không tải được dữ liệu. ${escapeHtml(err.message || '')}</td></tr>`;
        }
    };

    // ─── Search ──────────────────────────────────────
    searchInput?.addEventListener('input', () => {
        const kw = searchInput.value.toLowerCase().trim();
        if (!kw) { renderTable(allShipments); return; }
        renderTable(allShipments.filter(s =>
            getAny(s, ['maPhieuXuat', 'MaPhieuXuat']).toLowerCase().includes(kw) ||
            getAny(s, ['taiXe', 'TaiXe']).toLowerCase().includes(kw) ||
            getAny(s, ['tenDot', 'TenDot']).toLowerCase().includes(kw)
        ));
    });

    // ─── Click Xác Nhận Nhận Hàng ───────────────────
    tbody.addEventListener('click', async (e) => {
        const btn = e.target?.closest?.('button[data-action="confirm"]');
        if (!btn) return;
        const id = btn.closest('tr[data-id]')?.getAttribute('data-id') || '';
        if (!id) return;

        const item = allShipments.find(x => getAny(x, ['maPhieuXuat', 'MaPhieuXuat']) === id);
        if (!item) return;
        currentId = id;

        // Điền thông tin tài xế
        document.getElementById('modal-driver-name').textContent  = getAny(item, ['taiXe', 'TaiXe'], '—');
        document.getElementById('modal-driver-phone').textContent = getAny(item, ['sdtTaiXe', 'SdtTaiXe'], '—');
        document.getElementById('modal-driver-plate').textContent = getAny(item, ['bienSoXe', 'BienSoXe'], '—');

        // Reset ô OTP
        const otpInput = document.getElementById('modal-otp-input');
        if (otpInput) otpInput.value = '';
        const otpHint = document.getElementById('otp-input-hint');
        if (otpHint) { otpHint.textContent = ''; otpHint.style.color = ''; }

        // Reset checkbox
        const verifyCheck = document.getElementById('verify-driver-receipt');
        if (verifyCheck) verifyCheck.checked = false;
        document.getElementById('btn-confirm-receipt').disabled = true;

        // Load chi tiết hàng hóa
        const goodsList = document.getElementById('modal-goods-list');
        goodsList.innerHTML = '<li style="color:var(--text-muted);">Đang tải...</li>';

        try {
            const details = await window.CuuTroApi.requestJson(`/api/PhieuXuat/${encodeURIComponent(id)}`);
            if (Array.isArray(details) && details.length) {
                goodsList.innerHTML = details.map((d, i) => {
                    const ten = getAny(d, ['tenHang', 'TenHang']);
                    const sl  = getAny(d, ['soLuong', 'SoLuong']);
                    const dv  = getAny(d, ['donViTinh', 'DonViTinh']);
                    return `<li class="checklist-item">
                        <input type="checkbox" class="goods-check custom-checkbox" id="item-${i}">
                        <label for="item-${i}">
                            <strong>${escapeHtml(ten)}</strong>
                            <span style="color:var(--accent-orange);margin-left:0.5rem;">${escapeHtml(sl)} ${escapeHtml(dv)}</span>
                        </label>
                    </li>`;
                }).join('');

                goodsList.querySelectorAll('.goods-check').forEach(cb => {
                    cb.addEventListener('change', checkValidity);
                });
            } else {
                goodsList.innerHTML = '<li style="color:var(--text-muted);">Không có chi tiết hàng hóa.</li>';
            }
        } catch (_) {
            goodsList.innerHTML = '<li style="color:#dc2626;">Không tải được chi tiết.</li>';
        }

        openConfirmModal();
    });

    function checkValidity() {
        const verifyDriver = document.getElementById('verify-driver-receipt')?.checked;
        const checkers     = [...document.querySelectorAll('.goods-check')];
        const allChecked   = checkers.length === 0 || checkers.every(c => c.checked);
        const otpVal       = document.getElementById('modal-otp-input')?.value?.trim() || '';
        document.getElementById('btn-confirm-receipt').disabled = !(verifyDriver && allChecked && otpVal.length === 6);
    }

    document.getElementById('verify-driver-receipt')?.addEventListener('change', checkValidity);

    // Validate OTP realtime
    document.getElementById('modal-otp-input')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const len = e.target.value.trim().length;
        const hint = document.getElementById('otp-input-hint');
        if (hint) {
            if (len === 0)    hint.textContent = '';
            else if (len < 6) hint.textContent = `Còn thiếu ${6 - len} ký tự.`;
            else              hint.textContent = '✓ Đủ 6 ký tự.';
        }
        checkValidity();
    });

    // ─── Nút Xác Nhận Đã Nhận Hàng ─────────────────
    document.getElementById('btn-confirm-receipt')?.addEventListener('click', async () => {
        if (!currentId) return;
        const maOTP = document.getElementById('modal-otp-input')?.value?.trim().toUpperCase() || '';
        if (maOTP.length !== 6) { alert('Vui lòng nhập đủ mã 6 ký tự từ tài xế.'); return; }

        const btn = document.getElementById('btn-confirm-receipt');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xử lý...';

        try {
            await window.CuuTroApi.requestJson(`/api/PhieuXuat/${encodeURIComponent(currentId)}/xac-nhan-giao`, {
                method: 'PATCH',
                body: JSON.stringify({
                    MaOTP:  maOTP,
                    GhiChu: document.querySelector('#confirm-receipt-modal textarea')?.value || null
                })
            });
            alert(`Xác nhận mã thành công! Đang chờ tài xế xác nhận giao hàng hoàn tất.`);
            closeConfirmModal();
            currentId = null;
            await loadShipments();
        } catch (err) {
            const msg = err.message || '';
            if (msg.toLowerCase().includes('mã') || msg.toLowerCase().includes('không đúng')) {
                const hint = document.getElementById('otp-input-hint');
                if (hint) { hint.textContent = msg; hint.style.color = '#dc2626'; }
            } else {
                alert(`Lỗi: ${msg}`);
            }
            btn.disabled = false;
        } finally {
            btn.innerHTML = '<i class="fa-solid fa-file-signature"></i> Xác Nhận Đã Nhận Hàng';
            checkValidity();
        }
    });

    // ─── Modal helpers ───────────────────────────────
    window.openConfirmModal = () => {
        const modal = document.getElementById('confirm-receipt-modal');
        modal.style.display = 'flex';
        setTimeout(() => { modal.style.opacity = '1'; }, 10);
    };

    window.closeConfirmModal = () => {
        const modal = document.getElementById('confirm-receipt-modal');
        modal.style.opacity = '0';
        setTimeout(() => { modal.style.display = 'none'; currentId = null; }, 300);
    };

    // ─── Tên người dùng ──────────────────────────────
    const displayUserName = document.getElementById('display-user-name');
    if (displayUserName) {
        const name = localStorage.getItem('userName');
        if (name) displayUserName.textContent = name;
    }

    // ─── Init ─────────────────────────────────────────
    loadShipments();
});
