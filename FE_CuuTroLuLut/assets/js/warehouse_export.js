document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.querySelector('#exports-table tbody');
    const searchInput = document.getElementById('export-search');

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

    let allExports   = [];
    let allHang      = [];
    let allCampaigns = [];
    let currentExportId = null;

    // ─── Render bảng ────────────────────────────────────
    const getBadge = (trangThai) => {
        switch (trangThai) {
            case 'Đã xuất kho':
            case 'Đã hoàn thành':
                return `<span class="status-badge status-done"><i class="fa-solid fa-circle-check"></i> ${escapeHtml(trangThai)}</span>`;
            case 'Chờ xuất kho':
                return `<span class="status-badge status-waiting"><i class="fa-solid fa-hourglass-half"></i> Chờ xuất kho</span>`;
            case 'Chờ xác nhận xuất':
                return `<span class="status-badge status-pending-confirm"><i class="fa-solid fa-bell"></i> Chờ xác nhận xuất</span>`;
            case 'Đang vận chuyển':
                return `<span class="status-badge status-transit"><i class="fa-solid fa-truck-fast"></i> Đang vận chuyển</span>`;
            case 'Có vấn đề':
                return `<span class="status-badge status-issue"><i class="fa-solid fa-triangle-exclamation"></i> Có vấn đề</span>`;
            default:
                return `<span class="status-badge status-waiting"><i class="fa-solid fa-clock"></i> ${escapeHtml(trangThai)}</span>`;
        }
    };

    // Chỉ cho phép xuất khi tài xế đã nhận và đang chờ thủ kho xác nhận
    const isEditable = (trangThai) =>
        trangThai === 'Chờ xác nhận xuất';

    const renderTable = (list) => {
        if (!list.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="loading-cell">Chưa có phiếu xuất nào.</td></tr>`;
            return;
        }
        tbody.innerHTML = list.map(item => {
            const ma        = getAny(item, ['maPhieuXuat', 'MaPhieuXuat']);
            const ngay      = getAny(item, ['ngayXuat', 'NgayXuat']);
            const tenDot    = getAny(item, ['tenDot', 'TenDot'], '—');
            const taiXe     = getAny(item, ['taiXe', 'TaiXe'], '—');
            const sdtTaiXe  = getAny(item, ['sdtTaiXe', 'SdtTaiXe'], '');
            const hangHoa   = getAny(item, ['hangHoa', 'HangHoa'], '—');
            const trangThai = getAny(item, ['trangThai', 'TrangThai'], 'Chờ xuất kho');
            const maXN      = getAny(item, ['maXacNhan', 'MaXacNhan'], '');

            // Cột mã xác nhận — chỉ hiện khi chưa có tài xế nhận (Chờ xuất kho)
            const maXNCell = maXN
                ? `<span class="ma-xn-badge" title="Mã xác nhận giao cho tài xế">${escapeHtml(maXN)}</span>`
                : `<span style="color:var(--text-muted);font-size:0.8rem;">—</span>`;

            const actionBtn = isEditable(trangThai)
                ? `<button class="btn-action btn btn-sm" data-action="view" title="Xem & xác nhận xuất"><i class="fa-solid fa-eye"></i> Xuất Hàng</button>`
                : `<button class="btn btn-sm" style="background:#e2e8f0;color:#64748b;border:none;cursor:default;"><i class="fa-solid fa-check"></i> Hoàn Tất</button>`;

            return `
            <tr data-id="${escapeHtml(ma)}">
                <td><strong style="color:var(--accent-orange);">${escapeHtml(ma)}</strong></td>
                <td>${escapeHtml(ngay)}</td>
                <td style="font-weight:600;">${escapeHtml(tenDot)}</td>
                <td>
                    <div style="font-weight:600;">${escapeHtml(taiXe)}</div>
                    ${sdtTaiXe ? `<div style="font-size:0.8rem;color:var(--text-muted);">${escapeHtml(sdtTaiXe)}</div>` : ''}
                </td>
                <td style="max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(hangHoa)}">${escapeHtml(hangHoa)}</td>
                <td>${maXNCell}</td>
                <td>${getBadge(trangThai)}</td>
                <td>
                    <div class="action-buttons">${actionBtn}</div>
                </td>
            </tr>`;
        }).join('');
    };

    const updateStats = (list) => {
        const doneToday = list.filter(x => getAny(x, ['trangThai', 'TrangThai']) === 'Đã xuất kho').length;
        const pending   = list.filter(x => getAny(x, ['trangThai', 'TrangThai']) !== 'Đã xuất kho').length;
        const el1 = document.querySelector('.stat-card:nth-child(1) .stat-number');
        const el2 = document.querySelector('.stat-card:nth-child(2) .stat-number');
        const el3 = document.querySelector('.stat-card:nth-child(3) .stat-number');
        if (el1) el1.textContent = pending;
        if (el2) el2.textContent = doneToday;
        if (el3) el3.textContent = list.length;
    };

    // ─── Load danh sách phiếu xuất ──────────────────────
    const loadExports = async () => {
        tbody.innerHTML = `<tr><td colspan="8" class="loading-cell"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải dữ liệu...</td></tr>`;
        try {
            const data = await window.CuuTroApi.requestJson('/api/PhieuXuat');
            allExports = Array.isArray(data) ? data : [];
            renderTable(allExports);
            updateStats(allExports);
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" class="loading-cell" style="color:#dc2626;">Không tải được dữ liệu. ${escapeHtml(err.message || '')}</td></tr>`;
        }
    };

    // ─── Load hàng hóa & đợt cho modal tạo phiếu ───────
    const loadFormData = async () => {
        try {
            const [hangData, dotData] = await Promise.all([
                window.CuuTroApi.requestJson('/api/HangCuuTro'),
                window.CuuTroApi.requestJson('/api/DotCuuTro'),
            ]);
            allHang      = Array.isArray(hangData) ? hangData : [];
            allCampaigns = Array.isArray(dotData)  ? dotData  : [];

            const dotSelect = document.getElementById('ce-ma-dot');
            if (dotSelect) {
                dotSelect.innerHTML = '<option value="">-- Không gắn với đợt cụ thể --</option>';
                allCampaigns.forEach(c => {
                    const id   = getAny(c, ['maDot', 'MaDot']);
                    const name = getAny(c, ['tenDot', 'TenDot']);
                    dotSelect.innerHTML += `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`;
                });
            }
        } catch (_) {}
    };

    // ─── Search ─────────────────────────────────────────
    searchInput?.addEventListener('input', () => {
        const kw = searchInput.value.toLowerCase().trim();
        if (!kw) { renderTable(allExports); return; }
        renderTable(allExports.filter(item =>
            getAny(item, ['maPhieuXuat', 'MaPhieuXuat']).toLowerCase().includes(kw) ||
            getAny(item, ['taiXe', 'TaiXe']).toLowerCase().includes(kw) ||
            getAny(item, ['tenDot', 'TenDot']).toLowerCase().includes(kw)
        ));
    });

    // ─── Click "Xuất Hàng" → mở modal xác nhận ──────────
    tbody.addEventListener('click', async (e) => {
        const btn = e.target?.closest?.('button[data-action="view"]');
        if (!btn) return;
        const id = btn.closest('tr[data-id]')?.getAttribute('data-id') || '';
        if (!id) return;

        const item = allExports.find(x => getAny(x, ['maPhieuXuat', 'MaPhieuXuat']) === id);
        if (!item) return;
        currentExportId = id;

        // Điền thông tin tài xế
        document.getElementById('modal-driver-name').textContent  = getAny(item, ['taiXe', 'TaiXe'], '—');
        document.getElementById('modal-driver-phone').textContent = getAny(item, ['sdtTaiXe', 'SdtTaiXe'], '—');
        document.getElementById('modal-driver-plate').textContent = getAny(item, ['bienSoXe', 'BienSoXe'], '—');

        // Reset checkbox
        const verifyCheck = document.getElementById('verify-driver-export');
        if (verifyCheck) verifyCheck.checked = false;
        document.getElementById('btn-confirm-export').disabled = true;

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
                    return `<li class="check-item">
                        <div style="display:flex;align-items:center;gap:1rem;">
                            <input type="checkbox" class="custom-checkbox item-checker" id="ex-item-${i}">
                            <label for="ex-item-${i}" class="item-name">${escapeHtml(ten)}</label>
                        </div>
                        <span class="item-qty">${escapeHtml(sl)} ${escapeHtml(dv)}</span>
                    </li>`;
                }).join('');

                // Gắn sự kiện checkbox
                goodsList.querySelectorAll('.item-checker').forEach(cb => {
                    cb.addEventListener('change', (e) => {
                        e.target.closest('.check-item').classList.toggle('checked', e.target.checked);
                        checkExportValidity();
                    });
                });
            } else {
                goodsList.innerHTML = '<li style="color:var(--text-muted);">Không có chi tiết hàng hóa.</li>';
            }
        } catch (_) {
            goodsList.innerHTML = '<li style="color:#dc2626;">Không tải được chi tiết.</li>';
        }

        openConfirmModal();
    });

    function checkExportValidity() {
        const verifyDriver = document.getElementById('verify-driver-export')?.checked;
        const checkers     = [...document.querySelectorAll('.item-checker')];
        const allChecked   = checkers.length > 0 && checkers.every(c => c.checked);
        document.getElementById('btn-confirm-export').disabled = !(verifyDriver && allChecked);
    }

    document.getElementById('verify-driver-export')?.addEventListener('change', checkExportValidity);

    // ─── Nút Xác Nhận Đã Xuất Kho ───────────────────────
    document.getElementById('btn-confirm-export')?.addEventListener('click', async () => {
        if (!currentExportId) return;
        const btn = document.getElementById('btn-confirm-export');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xử lý...';
        try {
            await window.CuuTroApi.requestJson(`/api/PhieuXuat/${encodeURIComponent(currentExportId)}/trang-thai`, {
                method: 'PATCH',
                body: JSON.stringify({ TrangThai: 'Đang vận chuyển' })
            });
            alert(`Xác nhận xuất kho phiếu ${currentExportId} thành công!`);
            closeConfirmModal();
            currentExportId = null;
            await loadExports();
        } catch (err) {
            alert(`Lỗi: ${err.message || ''}`);
            btn.disabled = false;
        } finally {
            btn.innerHTML = '<i class="fa-solid fa-file-export"></i> Xác Nhận Đã Xuất Kho';
            checkExportValidity();
        }
    });

    // ─── Modal helpers ───────────────────────────────────
    window.openConfirmModal = () => {
        const modal = document.getElementById('confirm-export-modal');
        modal.style.display = 'flex';
        setTimeout(() => { modal.style.opacity = '1'; modal.querySelector('.modal-content').style.transform = 'scale(1)'; }, 10);
    };

    window.closeConfirmModal = () => {
        const modal = document.getElementById('confirm-export-modal');
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.95)';
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    };

    window.openCreateExportModal = () => {
        document.getElementById('create-export-form')?.reset();
        const goodsList = document.getElementById('ce-goods-list');
        if (goodsList) { goodsList.innerHTML = ''; window.addExportRow(); }
        const modal = document.getElementById('create-export-modal');
        modal.style.display = 'flex';
        setTimeout(() => { modal.style.opacity = '1'; modal.querySelector('.modal-content').style.transform = 'scale(1)'; }, 10);
    };

    window.closeCreateExportModal = () => {
        const modal = document.getElementById('create-export-modal');
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.95)';
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    };

    // ─── Modal mã xác nhận sau khi tạo phiếu ────────────
    function showMaXacNhanModal(maXN) {
        const el = document.getElementById('new-ma-xacnhan-value');
        if (el) el.textContent = maXN || '——';
        const modal = document.getElementById('ma-xacnhan-modal');
        if (!modal) return;
        modal.style.display = 'flex';
        setTimeout(() => { modal.style.opacity = '1'; modal.querySelector('.modal-content').style.transform = 'scale(1)'; }, 10);
    }

    window.closeMaXacNhanModal = () => {
        const modal = document.getElementById('ma-xacnhan-modal');
        if (!modal) return;
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.95)';
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    };

    window.copyNewMa = () => {
        const val = document.getElementById('new-ma-xacnhan-value')?.textContent || '';
        navigator.clipboard?.writeText(val).then(() => {
            const btn = document.getElementById('btn-copy-new-ma');
            if (btn) { btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã sao chép!'; setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy"></i> Sao chép mã'; }, 1500); }
        });
    };

    // ─── Thêm / xóa dòng hàng hóa trong modal tạo phiếu ─
    window.addExportRow = () => {
        const container = document.getElementById('ce-goods-list');
        if (!container) return;

        const hangOptions = allHang.map(h => {
            const ma  = getAny(h, ['maHang', 'MaHang']);
            const ten = getAny(h, ['tenHang', 'TenHang']);
            const ton = getAny(h, ['soLuongTon', 'SoLuongTon'], 0);
            const dv  = getAny(h, ['donViTinh', 'DonViTinh'], '');
            return `<option value="${escapeHtml(ma)}" data-ton="${ton}">${escapeHtml(ten)} (Tồn: ${ton}${dv ? ' ' + dv : ''})</option>`;
        }).join('');

        const row = document.createElement('div');
        row.className = 'goods-row';
        row.innerHTML = `
            <div class="goods-row-inner">
                <div class="form-group goods-col-hang">
                    <label>Mặt Hàng <span class="required">*</span></label>
                    <select class="form-control goods-select" required>
                        <option value="">-- Chọn mặt hàng --</option>
                        ${hangOptions}
                    </select>
                </div>
                <div class="form-group goods-col-sl">
                    <label>Số Lượng <span class="required">*</span></label>
                    <input type="number" class="form-control goods-sl" min="1" step="0.01" placeholder="0" required>
                </div>
                <div class="goods-col-remove">
                    <button type="button" class="btn-remove-row" onclick="removeExportRow(this)" title="Xóa dòng">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(row);
    };

    window.removeExportRow = (btn) => {
        btn.closest('.goods-row')?.remove();
    };

    // ─── Submit tạo phiếu xuất ───────────────────────────
    window.submitCreateExport = async () => {
        const maDot  = document.getElementById('ce-ma-dot')?.value?.trim() || null;
        const taiXe  = document.getElementById('ce-tai-xe')?.value?.trim() || null;
        const sdtTaiXe = document.getElementById('ce-sdt-tai-xe')?.value?.trim() || null;
        const userId = localStorage.getItem('userId') || '';

        if (!userId) { alert('Không xác định được người dùng. Vui lòng đăng nhập lại.'); return; }

        // Thu thập chi tiết hàng hóa
        const rows = document.querySelectorAll('#ce-goods-list .goods-row');
        if (!rows.length) { alert('Vui lòng thêm ít nhất 1 mặt hàng.'); return; }

        const chiTiet = [];
        let hasError = false;

        rows.forEach((row, i) => {
            const maHang = row.querySelector('.goods-select')?.value?.trim();
            const sl     = parseFloat(row.querySelector('.goods-sl')?.value) || 0;
            const ton    = parseFloat(row.querySelector('.goods-select option:checked')?.dataset?.ton || '0');

            if (!maHang) { alert(`Dòng ${i + 1}: Vui lòng chọn mặt hàng.`); hasError = true; return; }
            if (sl <= 0)  { alert(`Dòng ${i + 1}: Số lượng phải lớn hơn 0.`); hasError = true; return; }
            if (sl > ton) { alert(`Dòng ${i + 1}: Số lượng xuất (${sl}) vượt quá tồn kho (${ton}).`); hasError = true; return; }
            chiTiet.push({ MaHang: maHang, SoLuong: sl });
        });

        if (hasError) return;

        // Ghi chú tài xế vào trường MaNguoiVanChuyen (text) nếu không có mã ND
        // API nhận MaNguoiVanChuyen là mã người dùng; nếu nhập tay thì để null và lưu vào ghi chú
        const payload = {
            MaNguoiLap:       userId,
            MaNguoiVanChuyen: null,
            MaDot:            maDot,
            TrangThai:        'Chờ xuất kho',
            ChiTiet:          chiTiet,
            // Thông tin tài xế nhập tay sẽ được lưu vào TrangThai mở rộng (xem note bên dưới)
        };

        // Vì schema PhieuXuat không có cột tên tài xế tự do, ta ghi vào TrangThai dạng "Chờ xuất kho | Tài xế: X | SĐT: Y"
        const extras = [taiXe && `Tài xế: ${taiXe}`, sdtTaiXe && `SĐT: ${sdtTaiXe}`].filter(Boolean);
        if (extras.length) payload.TrangThai = `Chờ xuất kho | ${extras.join(' | ')}`;

        try {
            const result = await window.CuuTroApi.requestJson('/api/PhieuXuat', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            closeCreateExportModal();
            document.getElementById('create-export-form').reset();
            document.getElementById('ce-goods-list').innerHTML = '';
            await loadExports();

            // Hiển thị modal mã xác nhận
            const maXN = result?.MaXacNhan || result?.maXacNhan || '';
            showMaXacNhanModal(maXN);
        } catch (err) {
            alert(`Lỗi: ${err.message || ''}`);
        }
    };

    // ─── Tên người dùng ──────────────────────────────────
    const displayUserName = document.getElementById('display-user-name');
    if (displayUserName) {
        const name = localStorage.getItem('userName');
        if (name) displayUserName.textContent = name;
    }

    // ─── Init ────────────────────────────────────────────
    loadExports();
    loadFormData();
});
