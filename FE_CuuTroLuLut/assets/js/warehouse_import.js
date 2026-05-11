document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.querySelector('#imports-table tbody');
    const searchInput = document.getElementById('import-search');

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

    let allImports = [];
    let allHang = [];
    let allUngHo = [];
    let allCampaigns = [];
    let currentImportId = null; // lưu id phiếu đang xem

    // --- Render bảng ---
    const renderTable = (list) => {
        if (!list.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">Chưa có phiếu nhập nào.</td></tr>`;
            return;
        }
        tbody.innerHTML = list.map(item => {
            const ma = getAny(item, ['maPhieuNhap', 'MaPhieuNhap']);
            const ngay = getAny(item, ['ngayNhap', 'NgayNhap']);
            const nguonHang = getAny(item, ['nguonHang', 'NguonHang'], '—');  // Nhà tài trợ / nguồn
            const taiXe = getAny(item, ['taiXe', 'TaiXe'], '—');
            const sdtTaiXe = getAny(item, ['sdtTaiXe', 'SdtTaiXe'], '');
            const hangHoa = getAny(item, ['hangHoa', 'HangHoa'], '—');
            const trangThai = getAny(item, ['trangThai', 'TrangThai'], 'Chờ xác nhận');

            const trangThaiBadge = trangThai === 'Đã xác nhận'
                ? `<span class="status-badge status-active">Đã xác nhận</span>`
                : `<span class="status-badge" style="background:#fef3c7;color:#92400e;">Chờ xác nhận</span>`;

            return `
            <tr data-id="${escapeHtml(ma)}">
                <td><strong>${escapeHtml(ma)}</strong></td>
                <td>${escapeHtml(ngay)}</td>
                <td>${escapeHtml(nguonHang)}</td>
                <td>
                    <div style="font-weight:600;">${escapeHtml(taiXe)}</div>
                    ${sdtTaiXe ? `<div style="font-size:0.8rem;color:var(--text-muted);">${escapeHtml(sdtTaiXe)}</div>` : ''}
                </td>
                <td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(hangHoa)}">${escapeHtml(hangHoa)}</td>
                <td>${trangThaiBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action" data-action="view" title="Xem & xác nhận">
                            <i class="fa-solid fa-eye"></i> Xem
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    };

    const updateStats = (list) => {
        const totalEl = document.querySelector('.stat-card:nth-child(2) .stat-number');
        if (totalEl) totalEl.textContent = list.length;
    };

    const loadImports = async () => {
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải dữ liệu...</td></tr>`;
        try {
            const data = await window.CuuTroApi.requestJson('/api/PhieuNhap');
            allImports = Array.isArray(data) ? data : [];
            renderTable(allImports);
            updateStats(allImports);
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" class="loading-cell" style="color:#dc2626;">Không tải được dữ liệu. ${escapeHtml(err.message || '')}</td></tr>`;
        }
    };

    // --- Load hàng hóa và đợt cho modal tạo phiếu ---
    const loadFormData = async () => {
        try {
            const [hangData, dotData, ungHoData] = await Promise.all([
                window.CuuTroApi.requestJson('/api/HangCuuTro'),
                window.CuuTroApi.requestJson('/api/DotCuuTro'),
                window.CuuTroApi.requestJson('/api/UngHo/admin/all')
            ]);
            allHang = Array.isArray(hangData) ? hangData : [];
            allCampaigns = Array.isArray(dotData) ? dotData : [];
            allUngHo = Array.isArray(ungHoData) ? ungHoData : [];

            // Điền dropdown đợt trong modal tạo phiếu
            const dotSelect = document.querySelector('#create-import-form select');
            if (dotSelect) {
                dotSelect.innerHTML = '<option value="">-- Chọn đợt cứu trợ --</option>';
                allCampaigns.forEach(c => {
                    const id = getAny(c, ['maDot', 'MaDot']);
                    const name = getAny(c, ['tenDot', 'TenDot']);
                    dotSelect.innerHTML += `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`;
                });
                dotSelect.innerHTML += '<option value="">Không gắn với đợt cụ thể (Nhập kho dự trữ)</option>';
            }
        } catch (_) {}
    };

    // --- Search ---
    searchInput?.addEventListener('input', () => {
        const kw = searchInput.value.toLowerCase().trim();
        if (!kw) { renderTable(allImports); return; }
        renderTable(allImports.filter(item =>
            getAny(item, ['maPhieuNhap', 'MaPhieuNhap']).toLowerCase().includes(kw) ||
            getAny(item, ['taiXe', 'TaiXe']).toLowerCase().includes(kw) ||
            getAny(item, ['nguoiLap', 'NguoiLap']).toLowerCase().includes(kw) ||
            getAny(item, ['tenDot', 'TenDot']).toLowerCase().includes(kw)
        ));
    });

    // --- Click xem chi tiết ---
    tbody.addEventListener('click', async (e) => {
        const btn = e.target?.closest?.('button[data-action="view"]');
        if (!btn) return;
        const id = btn.closest('tr[data-id]')?.getAttribute('data-id') || '';
        if (!id) return;

        const item = allImports.find(x => getAny(x, ['maPhieuNhap', 'MaPhieuNhap']) === id);
        if (!item) return;
        currentImportId = id;

        // Điền thông tin vào modal xác nhận
        document.getElementById('modal-driver-name').textContent = getAny(item, ['taiXe', 'TaiXe'], '—');
        document.getElementById('modal-driver-phone').textContent = getAny(item, ['sdtTaiXe', 'SdtTaiXe'], '—');
        document.getElementById('modal-driver-plate').textContent = getAny(item, ['bienSoXe', 'BienSoXe'], '—');

        // Load chi tiết hàng hóa
        const goodsList = document.getElementById('modal-goods-list');
        goodsList.innerHTML = '<li style="color:var(--text-muted);">Đang tải...</li>';

        try {
            const details = await window.CuuTroApi.requestJson(`/api/PhieuNhap/${encodeURIComponent(id)}`);
            if (Array.isArray(details) && details.length) {
                goodsList.innerHTML = details.map(d => {
                    const ten = getAny(d, ['tenHang', 'TenHang']);
                    const slCT = getAny(d, ['soLuongChungTu', 'SoLuongChungTu']);
                    const slThuc = getAny(d, ['soLuongThucNhap', 'SoLuongThucNhap']);
                    const dv = getAny(d, ['donViTinh', 'DonViTinh']);
                    return `<li class="checklist-item">
                        <input type="checkbox" class="goods-check">
                        <span><strong>${escapeHtml(ten)}</strong> — Chứng từ: ${escapeHtml(slCT)} ${escapeHtml(dv)} | Thực nhập: ${escapeHtml(slThuc)} ${escapeHtml(dv)}</span>
                    </li>`;
                }).join('');

                // Enable nút xác nhận khi check hết
                goodsList.querySelectorAll('.goods-check').forEach(cb => {
                    cb.addEventListener('change', () => {
                        const allChecked = [...goodsList.querySelectorAll('.goods-check')].every(c => c.checked);
                        const verifyDriver = document.getElementById('verify-driver');
                        document.getElementById('btn-confirm-receipt').disabled = !(allChecked && verifyDriver?.checked);
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

    // Verify driver checkbox
    document.getElementById('verify-driver')?.addEventListener('change', () => {
        const allChecked = [...document.querySelectorAll('.goods-check')].every(c => c.checked);
        const verifyDriver = document.getElementById('verify-driver');
        document.getElementById('btn-confirm-receipt').disabled = !(allChecked && verifyDriver?.checked);
    });

    // --- Nút Xác Nhận Đã Nhập Kho ---
    document.getElementById('btn-confirm-receipt')?.addEventListener('click', async () => {
        if (!currentImportId) return;
        const btn = document.getElementById('btn-confirm-receipt');
        btn.disabled = true;
        btn.textContent = 'Đang xử lý...';
        try {
            await window.CuuTroApi.requestJson(`/api/PhieuNhap/${encodeURIComponent(currentImportId)}/trang-thai`, {
                method: 'PATCH',
                body: JSON.stringify({ TrangThai: 'Đã xác nhận' })
            });
            alert(`Đã xác nhận nhập kho phiếu ${currentImportId} thành công!`);
            closeConfirmModal();
            document.getElementById('verify-driver').checked = false;
            currentImportId = null;
            await loadImports();
        } catch (err) {
            alert(`Lỗi: ${err.message || ''}`);
            btn.disabled = false;
        } finally {
            btn.textContent = 'Xác Nhận Đã Nhập Kho';
        }
    });

    // --- Modal helpers ---
    window.openConfirmModal = () => {
        const modal = document.getElementById('confirm-import-modal');
        modal.style.display = 'flex';
        setTimeout(() => { modal.style.opacity = '1'; }, 10);
    };

    window.closeConfirmModal = () => {
        const modal = document.getElementById('confirm-import-modal');
        modal.style.opacity = '0';
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    };

    window.openCreateImportModal = () => {
        const modal = document.getElementById('create-import-modal');
        modal.style.display = 'flex';
        setTimeout(() => { modal.style.opacity = '1'; }, 10);
    };

    window.closeCreateImportModal = () => {
        const modal = document.getElementById('create-import-modal');
        modal.style.opacity = '0';
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    };

    window.submitCreateImport = async () => {
        const form = document.getElementById('create-import-form');
        const inputs = form.querySelectorAll('input, select');
        const userId = localStorage.getItem('userId') || '';

        const payload = {
            MaNguoiDung: userId,
            MaUngHo: null,
            NguoiVanChuyen: inputs[1]?.value?.trim() || null,
            ChiTiet: []
        };

        try {
            await window.CuuTroApi.requestJson('/api/PhieuNhap', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            closeCreateImportModal();
            form.reset();
            await loadImports();
            alert('Tạo phiếu nhập thành công!');
        } catch (err) {
            alert(`Lỗi: ${err.message || ''}`);
        }
    };

    // User name
    const displayUserName = document.getElementById('display-user-name');
    if (displayUserName) {
        const name = localStorage.getItem('userName');
        if (name) displayUserName.textContent = name;
    }

    // Init
    loadImports();
    loadFormData();
});
