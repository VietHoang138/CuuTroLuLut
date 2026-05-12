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
                return { cls: 'status-waiting-confirm', icon: 'fa-bell',                  label: 'Chờ xác nhận xuất' };
            case 'Chờ tài xế xác nhận':
                return { cls: 'status-waiting-driver',  icon: 'fa-handshake',             label: 'Chờ tài xế xác nhận' };
            case 'Đang vận chuyển':
            case 'Đang di chuyển':
                return { cls: 'status-moving',          icon: 'fa-truck-fast',            label: trangThai };
            case 'Đang lấy hàng':
                return { cls: 'status-picking',         icon: 'fa-box-open',              label: 'Đang lấy hàng' };
            case 'Đã giao thành công':
            case 'Đã hoàn thành':
            case 'Đã xuất kho':
                return { cls: 'status-delivered',       icon: 'fa-check-double',          label: trangThai };
            case 'Có vấn đề':
                return { cls: 'status-issue',           icon: 'fa-triangle-exclamation',  label: 'Có vấn đề' };
            default:
                return { cls: 'status-received',        icon: 'fa-clock',                 label: trangThai };
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

            const maXN     = getAny(item, ['maXacNhan', 'MaXacNhan'], '');
            const isWaitingConfirm = tt === 'Chờ xác nhận xuất';
            const isWaitingDriver  = tt === 'Chờ tài xế xác nhận';

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
                : isWaitingDriver
                ? `<div class="sc-actions">
                       <div class="waiting-driver-box">
                           <p class="otp-label"><i class="fa-solid fa-key"></i> Mã giao cho trưởng thôn:</p>
                           <div class="otp-display">${escapeHtml(maXN || '——')}</div>
                           <p style="font-size:0.78rem;color:#92400e;margin:0.5rem 0 0.75rem;">Trưởng thôn đã nhập mã. Tích xác nhận để hoàn tất.</p>
                           <label class="driver-confirm-label">
                               <input type="checkbox" class="driver-confirm-check" data-id="${escapeHtml(ma)}">
                               <span>Tôi xác nhận đã giao hàng thành công</span>
                           </label>
                           <button class="btn-confirm-delivery" data-id="${escapeHtml(ma)}" disabled>
                               <i class="fa-solid fa-handshake"></i> Xác Nhận Giao Hàng
                           </button>
                       </div>
                   </div>`
                : isApproved(tt)
                ? `<div class="sc-actions">
                       <div class="approved-box">
                           <div class="otp-section">
                               <p class="otp-label"><i class="fa-solid fa-key"></i> Đọc mã này cho trưởng thôn:</p>
                               <div class="otp-display">${escapeHtml(maXN || '——')}</div>
                               <p style="font-size:0.78rem;color:#92400e;margin:0.4rem 0 0.75rem;text-align:center;">
                                   Trưởng thôn nhập mã vào hệ thống để xác nhận nhận hàng.
                               </p>
                           </div>
                           <button class="btn-refresh-status" onclick="refreshSingle('${escapeHtml(ma)}')">
                               <i class="fa-solid fa-rotate-right"></i> Kiểm tra xác nhận
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
            <div class="schedule-card${isWaitingConfirm ? ' card-waiting' : ''}${isApproved(tt) ? ' card-approved' : ''}${isWaitingDriver ? ' card-waiting-driver' : ''}">
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

    // ─── Refresh 1 phiếu cụ thể ─────────────────────
    window.refreshSingle = async (id) => {
        try {
            const data = await window.CuuTroApi.requestJson(`/api/PhieuXuat/tai-xe/${encodeURIComponent(userId)}`);
            allSchedule = Array.isArray(data) ? data : [];
            renderSchedule();
        } catch (_) {}
    };

    // ─── Event delegation cho nút xác nhận giao hàng ─
    document.getElementById('schedule-list')?.addEventListener('change', (e) => {
        const cb = e.target?.closest?.('.driver-confirm-check');
        if (!cb) return;
        const id = cb.getAttribute('data-id');
        const btn = cb.closest('.waiting-driver-box')?.querySelector('.btn-confirm-delivery');
        if (btn) btn.disabled = !cb.checked;
    });

    document.getElementById('schedule-list')?.addEventListener('click', async (e) => {
        const btn = e.target?.closest?.('.btn-confirm-delivery');
        if (!btn || btn.disabled) return;
        const id = btn.getAttribute('data-id');
        if (!id) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xử lý...';

        try {
            await window.CuuTroApi.requestJson(`/api/PhieuXuat/${encodeURIComponent(id)}/hoan-thanh-giao`, {
                method: 'PATCH'
            });
            alert(`Xác nhận giao hàng phiếu ${id} thành công!`);
            await loadSchedule();
        } catch (err) {
            alert(`Lỗi: ${err.message || ''}`);
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-handshake"></i> Xác Nhận Giao Hàng';
        }
    });

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
