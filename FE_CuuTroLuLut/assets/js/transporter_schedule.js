document.addEventListener('DOMContentLoaded', () => {
    const listContainer = document.getElementById('schedule-list');
    const tabBtns       = document.querySelectorAll('.tab-btn');

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

    let allSchedule     = [];
    let currentTab      = 'active';
    let currentEditingId = null;
    const userId        = localStorage.getItem('userId') || '';

    // ─── Trạng thái → class + icon ──────────────────
    const getStatusInfo = (trangThai) => {
        switch (trangThai) {
            case 'Chờ xác nhận xuất':
                return { cls: 'status-waiting-confirm', icon: 'fa-bell',         label: 'Chờ xác nhận xuất' };
            case 'Đang vận chuyển':
            case 'Đang di chuyển':
                return { cls: 'status-moving',          icon: 'fa-truck-fast',   label: trangThai };
            case 'Đang lấy hàng':
                return { cls: 'status-picking',         icon: 'fa-box-open',     label: 'Đang lấy hàng' };
            case 'Đã giao thành công':
            case 'Đã hoàn thành':
            case 'Đã xuất kho':
                return { cls: 'status-delivered',       icon: 'fa-check-double', label: trangThai };
            case 'Có vấn đề':
                return { cls: 'status-issue',           icon: 'fa-triangle-exclamation', label: 'Có vấn đề' };
            default:
                return { cls: 'status-received',        icon: 'fa-clock',        label: trangThai };
        }
    };

    const isDone = (trangThai) =>
        ['Đã giao thành công', 'Đã hoàn thành', 'Đã xuất kho'].includes(trangThai);

    // Phiếu được tính là "đang chạy" khi thủ kho đã duyệt (Đang vận chuyển trở đi)
    const isApproved = (trangThai) =>
        ['Đang vận chuyển', 'Đang lấy hàng', 'Đang di chuyển'].includes(trangThai);

    // ─── Render danh sách ────────────────────────────
    const renderSchedule = () => {
        const filtered = allSchedule.filter(item => {
            const tt = getAny(item, ['trangThai', 'TrangThai']);
            return currentTab === 'active' ? !isDone(tt) : isDone(tt);
        });

        if (!filtered.length) {
            listContainer.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-calendar-xmark" style="color:#cbd5e1;font-size:3rem;margin-bottom:1rem;"></i>
                    <p>Không có chuyến hàng nào trong mục này.</p>
                </div>`;
            return;
        }

        listContainer.innerHTML = filtered.map(item => {
            const ma       = getAny(item, ['maPhieuXuat', 'MaPhieuXuat']);
            const ngay     = getAny(item, ['ngayXuat', 'NgayXuat'], '—');
            const tenDot   = getAny(item, ['tenDot', 'TenDot'], '—');
            const hangHoa  = getAny(item, ['hangHoa', 'HangHoa'], '—');
            const nguoiLap = getAny(item, ['nguoiLap', 'NguoiLap'], '—');
            const sdtNL    = getAny(item, ['sdtNguoiLap', 'SdtNguoiLap'], '');
            const tongSL   = getAny(item, ['tongSoLuong', 'TongSoLuong'], 0);
            const tt       = getAny(item, ['trangThai', 'TrangThai'], '—');
            const si       = getStatusInfo(tt);

            const isWaitingConfirm = tt === 'Chờ xác nhận xuất';

            const actionSection = isDone(tt)
                ? `<div class="sc-actions">
                       <p style="font-size:0.85rem;color:#16a34a;font-weight:600;text-align:center;margin:0;">
                           <i class="fa-solid fa-circle-check" style="font-size:2rem;display:block;margin-bottom:0.5rem;"></i>
                           Hoàn thành
                       </p>
                   </div>`
                : isWaitingConfirm
                ? `<div class="sc-actions">
                       <div class="waiting-confirm-box">
                           <i class="fa-solid fa-hourglass-half"></i>
                           <p>Đang chờ thủ kho xác nhận xuất hàng</p>
                           <small>Bạn sẽ được thông báo khi hàng sẵn sàng.</small>
                       </div>
                   </div>`
                : isApproved(tt)
                ? `<div class="sc-actions">
                       <div class="approved-box">
                           <i class="fa-solid fa-circle-check" style="color:#10b981;font-size:1.5rem;display:block;margin-bottom:0.4rem;"></i>
                           <p style="color:#065f46;font-weight:700;font-size:0.85rem;margin:0 0 0.75rem;">Kho đã xác nhận xuất!</p>
                           <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:0.75rem;">Cập nhật lộ trình của bạn</p>
                           <button class="btn-update" onclick="openStatusModal('${escapeHtml(ma)}', '${escapeHtml(tt)}')">
                               <i class="fa-solid fa-pen-to-square"></i> Cập Nhật
                           </button>
                       </div>
                   </div>`
                : `<div class="sc-actions">
                       <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem;text-align:center;">Cập nhật lộ trình</p>
                       <button class="btn-update" onclick="openStatusModal('${escapeHtml(ma)}', '${escapeHtml(tt)}')">
                           <i class="fa-solid fa-pen-to-square"></i> Cập Nhật
                       </button>
                   </div>`;

            return `
            <div class="schedule-card${isWaitingConfirm ? ' card-waiting' : ''}${isApproved(tt) ? ' card-approved' : ''}">
                <div class="sc-header">
                    <span class="sc-id">
                        <i class="fa-solid fa-hashtag" style="color:var(--accent-cyan);margin-right:4px;"></i>
                        ${escapeHtml(ma)}
                        <span style="font-size:0.8rem;color:var(--text-muted);font-weight:400;margin-left:0.5rem;">${escapeHtml(ngay)}</span>
                    </span>
                    <span class="sc-status-badge ${si.cls}">
                        <i class="fa-solid ${si.icon}"></i> ${escapeHtml(si.label)}
                    </span>
                </div>
                <div class="sc-body">
                    <div class="sc-timeline">
                        <div class="tl-line"></div>
                        <div class="tl-point tl-pickup">
                            <div class="tl-label">Nhận hàng tại</div>
                            <div class="tl-address">Kho Trung Tâm Hòa Vang</div>
                            <div class="tl-contact">
                                <i class="fa-solid fa-user"></i> ${escapeHtml(nguoiLap)}
                                ${sdtNL ? `<span style="margin-left:0.5rem;color:var(--accent-cyan);"><i class="fa-solid fa-phone"></i> ${escapeHtml(sdtNL)}</span>` : ''}
                            </div>
                        </div>
                        <div class="tl-point tl-delivery">
                            <div class="tl-label">Đợt cứu trợ</div>
                            <div class="tl-address">${escapeHtml(tenDot)}</div>
                        </div>
                    </div>

                    <div class="sc-info">
                        <div class="sc-info-row">
                            <span class="sc-info-label"><i class="fa-solid fa-boxes-stacked"></i> Hàng hóa</span>
                            <span class="sc-info-value" title="${escapeHtml(hangHoa)}">${escapeHtml(hangHoa)}</span>
                        </div>
                        <div class="sc-info-row">
                            <span class="sc-info-label"><i class="fa-solid fa-weight-hanging"></i> Tổng SL</span>
                            <span class="sc-info-value">${escapeHtml(tongSL)} đơn vị</span>
                        </div>
                    </div>

                    ${actionSection}
                </div>
            </div>`;
        }).join('');
    };

    // ─── Load dữ liệu từ API ─────────────────────────
    const loadSchedule = async () => {
        listContainer.innerHTML = `
            <div class="loading-state">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                <p>Đang tải lịch trình...</p>
            </div>`;

        if (!userId) {
            listContainer.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-circle-exclamation" style="color:#dc2626;"></i>
                    <p style="color:#dc2626;">Không xác định được tài khoản. Vui lòng đăng nhập lại.</p>
                </div>`;
            return;
        }

        try {
            const data = await window.CuuTroApi.requestJson(`/api/PhieuXuat/tai-xe/${encodeURIComponent(userId)}`);
            allSchedule = Array.isArray(data) ? data : [];
            renderSchedule();
        } catch (err) {
            listContainer.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-circle-exclamation" style="color:#dc2626;"></i>
                    <p style="color:#dc2626;">Không tải được dữ liệu: ${escapeHtml(err.message || '')}</p>
                </div>`;
        }
    };

    // ─── Tabs ────────────────────────────────────────
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = e.target.getAttribute('data-tab');
            renderSchedule();
        });
    });

    // ─── Modal cập nhật trạng thái ───────────────────
    window.openStatusModal = (id, currentStatus) => {
        currentEditingId = id;
        document.getElementById('modal-shipment-id').textContent = id;
        const select = document.getElementById('new-status-select');
        if (select) select.value = currentStatus;

        const modal = document.getElementById('status-modal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
        }, 10);
    };

    window.closeStatusModal = () => {
        const modal = document.getElementById('status-modal');
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.95)';
        setTimeout(() => { modal.style.display = 'none'; currentEditingId = null; }, 300);
    };

    document.getElementById('save-status-btn')?.addEventListener('click', async () => {
        if (!currentEditingId) return;
        const newStatus = document.getElementById('new-status-select')?.value || '';
        const btn = document.getElementById('save-status-btn');
        btn.disabled = true;
        btn.textContent = 'Đang lưu...';

        try {
            await window.CuuTroApi.requestJson(`/api/PhieuXuat/${encodeURIComponent(currentEditingId)}/trang-thai`, {
                method: 'PATCH',
                body: JSON.stringify({ TrangThai: newStatus })
            });
            closeStatusModal();
            await loadSchedule();
        } catch (err) {
            alert(`Lỗi: ${err.message || ''}`);
            btn.disabled = false;
        } finally {
            btn.textContent = 'Lưu Trạng Thái';
        }
    });

    // ─── Tên người dùng ──────────────────────────────
    const displayUserName = document.getElementById('display-user-name');
    if (displayUserName) {
        const name = localStorage.getItem('userName');
        if (name) displayUserName.textContent = name;
    }

    // ─── Init ─────────────────────────────────────────
    loadSchedule();

    // Auto-refresh mỗi 30 giây để cập nhật khi thủ kho duyệt
    setInterval(() => {
        if (currentTab === 'active') loadSchedule();
    }, 30000);
});
