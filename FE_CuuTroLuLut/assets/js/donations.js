document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('api-donations-table');
    const detailOverlay = document.getElementById('detail-modal-overlay');
    const detailBody = document.getElementById('detail-modal-body');
    const detailTitle = document.getElementById('detail-modal-title');
    const btnCloseDetail = document.getElementById('btn-close-detail');

    if (!tableBody) return;

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

    const statusBadge = (tt) => {
        const s = `${tt || ''}`;
        if (s.toLowerCase().includes('tiếp nhận') && !s.includes('Chờ'))
            return `<span class="status-badge status-active">${escapeHtml(s)}</span>`;
        if (s.includes('Chờ') || s.includes('chờ'))
            return `<span class="status-badge" style="background:#fef3c7;color:#92400e;">${escapeHtml(s)}</span>`;
        if (s.toLowerCase().includes('từ chối'))
            return `<span class="status-badge" style="background:#fef2f2;color:#dc2626;">${escapeHtml(s)}</span>`;
        return `<span class="status-badge" style="background:#e0f2fe;color:#0369a1;">${escapeHtml(s)}</span>`;
    };

    let cache = [];

    // --- Modal ---
    const openDetail = () => {
        detailOverlay.classList.add('is-open');
        detailOverlay.setAttribute('aria-hidden', 'false');
    };
    const closeDetail = () => {
        detailOverlay.classList.remove('is-open');
        detailOverlay.setAttribute('aria-hidden', 'true');
    };
    btnCloseDetail?.addEventListener('click', closeDetail);
    detailOverlay?.addEventListener('click', (e) => { if (e.target === detailOverlay) closeDetail(); });

    const showDetail = async (id) => {
        detailTitle.textContent = `Chi Tiết Phiếu: ${id}`;
        detailBody.innerHTML = `<div style="text-align:center;padding:2rem;">
            <div style="display:inline-block;width:32px;height:32px;border:4px solid #e2e8f0;border-top-color:var(--accent-orange);border-radius:50%;animation:spin 1s linear infinite;"></div>
            <p style="margin-top:0.75rem;color:var(--text-muted);">Đang tải...</p>
        </div>`;
        openDetail();

        try {
            const data = await window.CuuTroApi.requestJson(`/api/UngHo/${encodeURIComponent(id)}`);
            const tt = data.ThongTin || data.thongTin || {};
            const hang = data.DanhSachHang || data.danhSachHang || [];

            const trangThai = getAny(tt, ['TrangThai', 'trangThai']);
            const maUH = getAny(tt, ['MaUngHo', 'maUngHo']);

            const hangRows = hang.length
                ? hang.map(h => `
                    <tr>
                        <td>${escapeHtml(getAny(h, ['TenHang', 'tenHang']))}</td>
                        <td>${escapeHtml(getAny(h, ['TenLoaiHang', 'tenLoaiHang']))}</td>
                        <td style="text-align:right;font-weight:600;">
                            ${escapeHtml(getAny(h, ['SoLuong', 'soLuong']))}
                            ${escapeHtml(getAny(h, ['DonViTinh', 'donViTinh']))}
                        </td>
                    </tr>`).join('')
                : `<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:1rem;">Chưa có hàng hóa.</td></tr>`;

            const isActionable = trangThai === 'Chờ tiếp nhận' || trangThai === '';

            detailBody.innerHTML = `
                <!-- Thông tin phiếu -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem;">
                    <div>
                        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.25rem;">Mã phiếu</p>
                        <p style="font-weight:700;color:var(--text-dark);">${escapeHtml(maUH)}</p>
                    </div>
                    <div>
                        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.25rem;">Trạng thái</p>
                        <p>${statusBadge(trangThai)}</p>
                    </div>
                    <div>
                        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.25rem;">Người ủng hộ</p>
                        <p style="font-weight:600;">${escapeHtml(getAny(tt, ['HoTen', 'hoTen']))}</p>
                    </div>
                    <div>
                        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.25rem;">Ngày ủng hộ</p>
                        <p>${escapeHtml(getAny(tt, ['NgayUngHo', 'ngayUngHo']))}</p>
                    </div>
                    <div>
                        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.25rem;">Số điện thoại</p>
                        <p>${escapeHtml(getAny(tt, ['SoDienThoai', 'soDienThoai']) || '—')}</p>
                    </div>
                    <div>
                        <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.25rem;">Chiến dịch</p>
                        <p style="font-weight:600;color:var(--primary-color);">${escapeHtml(getAny(tt, ['TenDot', 'tenDot']))}</p>
                    </div>
                </div>

                <!-- Danh sách hàng hóa -->
                <div style="margin-bottom:1.25rem;">
                    <p style="font-size:0.85rem;font-weight:600;color:var(--text-dark);margin-bottom:0.75rem;">
                        <i class="fa-solid fa-boxes-stacked" style="margin-right:6px;color:var(--accent-orange);"></i>Danh Sách Hàng Hóa
                    </p>
                    <div style="border:1px solid var(--border-color);border-radius:8px;overflow:hidden;">
                        <table style="width:100%;border-collapse:collapse;font-size:0.875rem;">
                            <thead>
                                <tr style="background:var(--bg-color);">
                                    <th style="padding:0.625rem 1rem;text-align:left;font-weight:600;color:var(--text-muted);font-size:0.75rem;text-transform:uppercase;">Tên hàng</th>
                                    <th style="padding:0.625rem 1rem;text-align:left;font-weight:600;color:var(--text-muted);font-size:0.75rem;text-transform:uppercase;">Loại</th>
                                    <th style="padding:0.625rem 1rem;text-align:right;font-weight:600;color:var(--text-muted);font-size:0.75rem;text-transform:uppercase;">Số lượng</th>
                                </tr>
                            </thead>
                            <tbody>${hangRows}</tbody>
                        </table>
                    </div>
                </div>

                <!-- Nút hành động -->
                ${isActionable ? `
                <div style="display:flex;gap:0.75rem;justify-content:flex-end;padding-top:1rem;border-top:1px solid var(--border-color);">
                    <button class="btn btn-outline" id="btn-detail-reject" data-id="${escapeHtml(maUH)}"
                        style="color:#dc2626;border-color:#fecaca;">
                        <i class="fa-solid fa-xmark"></i> Từ Chối
                    </button>
                    <button class="btn btn-primary" id="btn-detail-approve" data-id="${escapeHtml(maUH)}">
                        <i class="fa-solid fa-check"></i> Xác Nhận Tiếp Nhận
                    </button>
                </div>` : `
                <div style="padding-top:1rem;border-top:1px solid var(--border-color);text-align:right;">
                    <span style="font-size:0.85rem;color:var(--text-muted);">Phiếu này đã được xử lý.</span>
                </div>`}
            `;

            // Gắn event cho nút trong modal
            document.getElementById('btn-detail-approve')?.addEventListener('click', async (e) => {
                await updateStatus(e.target.closest('button').getAttribute('data-id'), 'Đã tiếp nhận');
            });
            document.getElementById('btn-detail-reject')?.addEventListener('click', async (e) => {
                await updateStatus(e.target.closest('button').getAttribute('data-id'), 'Từ chối');
            });

        } catch (err) {
            detailBody.innerHTML = `<p style="color:#dc2626;padding:1rem;">Không tải được chi tiết. ${escapeHtml(err.message || '')}</p>`;
        }
    };

    const updateStatus = async (id, newStatus) => {
        const label = newStatus === 'Đã tiếp nhận' ? 'xác nhận tiếp nhận' : 'từ chối';
        if (!confirm(`Xác nhận ${label} phiếu "${id}"?`)) return;
        try {
            await window.CuuTroApi.requestJson(`/api/UngHo/${encodeURIComponent(id)}/trang-thai`, {
                method: 'PATCH',
                body: JSON.stringify({ TrangThai: newStatus })
            });
            closeDetail();
            await loadDonations();
        } catch (err) {
            alert(`Lỗi cập nhật: ${err.message || ''}`);
        }
    };

    // --- Render bảng ---
    const renderTable = (list) => {
        if (!list.length) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:var(--text-muted);">Chưa có phiếu ủng hộ nào.</td></tr>`;
            return;
        }
        tableBody.innerHTML = list.map(d => {
            const ma = getAny(d, ['maUngHo', 'MaUngHo']);
            const hoTen = getAny(d, ['hoTen', 'HoTen']);
            const tenDot = getAny(d, ['tenDot', 'TenDot']);
            const ngay = getAny(d, ['ngayUngHo', 'NgayUngHo']);
            const noiDung = getAny(d, ['noiDung', 'NoiDung'], '—');
            const trangThai = getAny(d, ['trangThai', 'TrangThai']);

            return `
            <tr data-id="${escapeHtml(ma)}">
                <td><strong>${escapeHtml(ma)}</strong></td>
                <td>
                    <div style="font-weight:600;color:var(--text-dark);">${escapeHtml(hoTen)}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">${escapeHtml(noiDung)}</div>
                </td>
                <td>${escapeHtml(tenDot)}</td>
                <td>${escapeHtml(ngay)}</td>
                <td>${statusBadge(trangThai)}</td>
                <td style="text-align:right;">
                    <div class="action-buttons">
                        <button class="btn-action" data-action="view">
                            <i class="fa-solid fa-eye"></i> Xem
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    };

    const updateStats = (list) => {
        const total = list.length;
        const pending = list.filter(d => `${getAny(d, ['trangThai', 'TrangThai'])}`.includes('Chờ')).length;
        const accepted = list.filter(d => `${getAny(d, ['trangThai', 'TrangThai'])}`.toLowerCase().includes('tiếp nhận')).length;
        const rejected = list.filter(d => `${getAny(d, ['trangThai', 'TrangThai'])}`.toLowerCase().includes('từ chối')).length;
        const el = (id) => document.getElementById(id);
        if (el('stat-total')) el('stat-total').textContent = total;
        if (el('stat-pending')) el('stat-pending').textContent = pending;
        if (el('stat-accepted')) el('stat-accepted').textContent = accepted;
        if (el('stat-rejected')) el('stat-rejected').textContent = rejected;
    };

    const loadDonations = async () => {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;">
            <div style="display:inline-block;width:40px;height:40px;border:4px solid var(--border-color);border-top-color:var(--accent-orange);border-radius:50%;animation:spin 1s linear infinite;"></div>
            <p style="margin-top:1rem;color:var(--text-muted);">Đang kết nối API...</p>
        </td></tr>`;
        try {
            const data = await window.CuuTroApi.requestJson('/api/UngHo/admin/all');
            cache = Array.isArray(data) ? data : [];
            renderTable(cache);
            updateStats(cache);
        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:#dc2626;">
                Không tải được dữ liệu. ${escapeHtml(err.message || '')}
            </td></tr>`;
        }
    };

    // Click "Xem" → mở modal chi tiết
    tableBody.addEventListener('click', (e) => {
        const btn = e.target?.closest?.('button[data-action="view"]');
        if (!btn) return;
        const id = btn.closest('tr[data-id]')?.getAttribute('data-id') || '';
        if (id) showDetail(id);
    });

    loadDonations();
});
