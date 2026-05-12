document.addEventListener('DOMContentLoaded', () => {
    const container   = document.getElementById('shipments-list');
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
    let selectedId      = null;
    const userId        = localStorage.getItem('userId') || '';

    // ─── Render danh sách card ───────────────────────
    const renderShipments = (list) => {
        if (!list.length) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-box-open" style="color:#cbd5e1;font-size:3rem;margin-bottom:1rem;"></i>
                    <p>Hiện không có chuyến hàng nào đang chờ tài xế.</p>
                </div>`;
            return;
        }

        container.innerHTML = list.map(shp => {
            const ma         = getAny(shp, ['maPhieuXuat', 'MaPhieuXuat']);
            const ngay       = getAny(shp, ['ngayXuat', 'NgayXuat'], '—');
            const tenDot     = getAny(shp, ['tenDot', 'TenDot'], '—');
            const hangHoa    = getAny(shp, ['hangHoa', 'HangHoa'], '—');
            const nguoiLap   = getAny(shp, ['nguoiLap', 'NguoiLap'], '—');
            const sdtNguoiLap = getAny(shp, ['sdtNguoiLap', 'SdtNguoiLap'], '');
            const tongSL     = getAny(shp, ['tongSoLuong', 'TongSoLuong'], 0);
            const trangThai  = getAny(shp, ['trangThai', 'TrangThai'], 'Chờ xuất kho');

            return `
            <div class="shipment-card" data-id="${escapeHtml(ma)}">
                <div class="shipment-timeline">
                    <div class="timeline-line"></div>
                    <div class="timeline-point point-pickup">
                        <div class="point-label">Điểm Nhận Hàng</div>
                        <div class="point-address">Kho Trung Tâm Hòa Vang</div>
                        <div class="point-contact">
                            <i class="fa-solid fa-user"></i> ${escapeHtml(nguoiLap)}
                            ${sdtNguoiLap ? `<span style="color:var(--accent-cyan);margin-left:0.5rem;"><i class="fa-solid fa-phone"></i> ${escapeHtml(sdtNguoiLap)}</span>` : ''}
                        </div>
                        <div class="point-contact" style="color:var(--accent-orange);margin-top:4px;">
                            <i class="fa-regular fa-clock"></i> ${escapeHtml(ngay)}
                        </div>
                    </div>
                    <div class="timeline-point point-delivery">
                        <div class="point-label">Đợt Cứu Trợ</div>
                        <div class="point-address">${escapeHtml(tenDot)}</div>
                        <div class="point-contact" style="color:var(--text-muted);">
                            <i class="fa-solid fa-circle-info"></i> Địa điểm giao hàng theo lịch đợt cứu trợ
                        </div>
                    </div>
                </div>

                <div class="shipment-details">
                    <div class="detail-row">
                        <span class="detail-label">Mã phiếu:</span>
                        <span class="detail-value" style="color:var(--accent-cyan);">${escapeHtml(ma)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Đợt cứu trợ:</span>
                        <span class="detail-value" style="max-width:400px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(tenDot)}">${escapeHtml(tenDot)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Hàng hóa:</span>
                        <span class="detail-value" style="max-width:400px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(hangHoa)}">${escapeHtml(hangHoa)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Tổng số lượng:</span>
                        <span class="detail-value">${escapeHtml(tongSL)} đơn vị</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Trạng thái:</span>
                        <span class="status-badge-sm">${escapeHtml(trangThai)}</span>
                    </div>
                </div>

                <div class="shipment-actions">
                    <button class="btn-accept" data-id="${escapeHtml(ma)}" onclick="openAcceptModal('${escapeHtml(ma)}')">
                        Nhận Chuyến <i class="fa-solid fa-check"></i>
                    </button>
                    <button class="btn-detail" onclick="toggleDetail('${escapeHtml(ma)}')">
                        <i class="fa-solid fa-list"></i> Chi Tiết
                    </button>
                </div>
            </div>

            <div class="shipment-detail-panel" id="detail-${escapeHtml(ma)}" style="display:none;">
                <div class="detail-panel-inner">
                    <i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải chi tiết hàng hóa...
                </div>
            </div>`;
        }).join('');
    };

    // ─── Toggle chi tiết hàng hóa ───────────────────
    window.toggleDetail = async (id) => {
        const panel = document.getElementById(`detail-${id}`);
        if (!panel) return;

        if (panel.style.display !== 'none') {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';
        panel.querySelector('.detail-panel-inner').innerHTML =
            '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải...';

        try {
            const details = await window.CuuTroApi.requestJson(`/api/PhieuXuat/${encodeURIComponent(id)}`);
            if (Array.isArray(details) && details.length) {
                panel.querySelector('.detail-panel-inner').innerHTML = `
                    <table class="detail-table">
                        <thead><tr><th>Mặt Hàng</th><th>Số Lượng</th><th>Đơn Vị</th></tr></thead>
                        <tbody>
                            ${details.map(d => `
                                <tr>
                                    <td>${escapeHtml(getAny(d, ['tenHang', 'TenHang']))}</td>
                                    <td style="font-weight:700;color:var(--accent-orange);">${escapeHtml(getAny(d, ['soLuong', 'SoLuong']))}</td>
                                    <td>${escapeHtml(getAny(d, ['donViTinh', 'DonViTinh']))}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>`;
            } else {
                panel.querySelector('.detail-panel-inner').innerHTML =
                    '<p style="color:var(--text-muted);text-align:center;">Không có chi tiết hàng hóa.</p>';
            }
        } catch (err) {
            panel.querySelector('.detail-panel-inner').innerHTML =
                `<p style="color:#dc2626;">Không tải được chi tiết: ${escapeHtml(err.message)}</p>`;
        }
    };

    // ─── Load danh sách chuyến chờ ───────────────────
    const loadShipments = async () => {
        container.innerHTML = `
            <div class="loading-state">
                <i class="fa-solid fa-truck-fast fa-bounce"></i>
                <p>Đang tìm chuyến hàng...</p>
            </div>`;
        try {
            const data = await window.CuuTroApi.requestJson('/api/PhieuXuat/cho-nhan');
            allShipments = Array.isArray(data) ? data : [];
            renderShipments(allShipments);
        } catch (err) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-circle-exclamation" style="color:#dc2626;"></i>
                    <p style="color:#dc2626;">Không tải được dữ liệu: ${escapeHtml(err.message || '')}</p>
                </div>`;
        }
    };

    // ─── Search ──────────────────────────────────────
    searchInput?.addEventListener('input', () => {
        const kw = searchInput.value.toLowerCase().trim();
        if (!kw) { renderShipments(allShipments); return; }
        renderShipments(allShipments.filter(s =>
            getAny(s, ['maPhieuXuat', 'MaPhieuXuat']).toLowerCase().includes(kw) ||
            getAny(s, ['tenDot', 'TenDot']).toLowerCase().includes(kw) ||
            getAny(s, ['hangHoa', 'HangHoa']).toLowerCase().includes(kw)
        ));
    });

    // ─── Modal nhận chuyến ───────────────────────────
    window.openAcceptModal = (id) => {
        selectedId = id;
        const shp = allShipments.find(s => getAny(s, ['maPhieuXuat', 'MaPhieuXuat']) === id);
        if (!shp) return;

        const summary = document.getElementById('modal-shipment-summary');
        summary.innerHTML = `
            <div class="summary-row"><span>Mã phiếu:</span><strong style="color:var(--accent-cyan);">${escapeHtml(id)}</strong></div>
            <div class="summary-row"><span>Đợt cứu trợ:</span><strong>${escapeHtml(getAny(shp, ['tenDot', 'TenDot']))}</strong></div>
            <div class="summary-row"><span>Hàng hóa:</span><span>${escapeHtml(getAny(shp, ['hangHoa', 'HangHoa']))}</span></div>
            <div class="summary-row"><span>Ngày tạo:</span><span>${escapeHtml(getAny(shp, ['ngayXuat', 'NgayXuat']))}</span></div>
        `;

        // Reset ô OTP
        const otpInput = document.getElementById('accept-otp-input');
        if (otpInput) otpInput.value = '';
        setOtpStatus('none', '');
        document.getElementById('confirm-accept-btn').disabled = true;

        const modal = document.getElementById('accept-modal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
            otpInput?.focus();
        }, 10);
    };

    window.closeAcceptModal = () => {
        const modal = document.getElementById('accept-modal');
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.95)';
        setTimeout(() => { modal.style.display = 'none'; selectedId = null; }, 300);
    };

    // Validate OTP realtime
    function setOtpStatus(type, msg) {
        const icon  = document.getElementById('accept-otp-icon');
        const hint  = document.getElementById('accept-otp-hint');
        const input = document.getElementById('accept-otp-input');
        if (!icon || !hint || !input) return;

        if (type === 'ok') {
            icon.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#10b981;"></i>';
            hint.style.color = '#10b981';
            hint.textContent = 'Mã hợp lệ — đủ 6 ký tự.';
            input.style.borderColor = '#10b981';
        } else if (type === 'error') {
            icon.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color:#dc2626;"></i>';
            hint.style.color = '#dc2626';
            hint.textContent = msg || 'Mã không đúng.';
            input.style.borderColor = '#dc2626';
        } else {
            icon.innerHTML = '';
            hint.textContent = '';
            input.style.borderColor = '';
        }
    }

    document.getElementById('accept-otp-input')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const len = e.target.value.trim().length;
        if (len === 0)    setOtpStatus('none', '');
        else if (len < 6) setOtpStatus('error', `Còn thiếu ${6 - len} ký tự.`);
        else              setOtpStatus('ok', '');
        document.getElementById('confirm-accept-btn').disabled = len < 6;
    });

    document.getElementById('confirm-accept-btn')?.addEventListener('click', async () => {
        if (!selectedId) return;
        if (!userId) { alert('Không xác định được tài khoản. Vui lòng đăng nhập lại.'); return; }

        const maXacNhan = document.getElementById('accept-otp-input')?.value?.trim().toUpperCase() || '';
        if (maXacNhan.length !== 6) {
            setOtpStatus('error', 'Vui lòng nhập đủ 6 ký tự.');
            return;
        }

        const btn = document.getElementById('confirm-accept-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xử lý...';

        try {
            await window.CuuTroApi.requestJson(`/api/PhieuXuat/${encodeURIComponent(selectedId)}/nhan-chuyen`, {
                method: 'PATCH',
                body: JSON.stringify({ MaNguoiVanChuyen: userId, MaXacNhan: maXacNhan })
            });
            closeAcceptModal();

            // Hiển thị thông báo chờ thủ kho xác nhận
            alert(`✅ Đã gửi yêu cầu nhận chuyến ${selectedId} thành công!\n\n⏳ Vui lòng chờ thủ kho xác nhận xuất hàng. Sau khi được xác nhận, chuyến hàng sẽ chuyển sang trạng thái "Đang vận chuyển".`);
            await loadShipments();
        } catch (err) {
            const msg = err.message || '';
            if (msg.toLowerCase().includes('mã xác nhận') || msg.toLowerCase().includes('không đúng')) {
                setOtpStatus('error', msg);
            } else {
                alert(`Lỗi: ${msg}`);
            }
            btn.disabled = false;
        } finally {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Xác Nhận Nhận Chuyến';
            // Re-check validity
            const len = document.getElementById('accept-otp-input')?.value?.trim().length || 0;
            document.getElementById('confirm-accept-btn').disabled = len < 6;
        }
    });

    // ─── Tên người dùng ──────────────────────────────
    const displayUserName = document.getElementById('display-user-name');
    if (displayUserName) {
        const name = localStorage.getItem('userName');
        if (name) displayUserName.textContent = name;
    }

    // ─── Init ─────────────────────────────────────────
    loadShipments();
});
