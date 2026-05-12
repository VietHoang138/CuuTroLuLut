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
        // Card 1: Xe đang đến — phiếu chờ xác nhận
        const choXacNhan = list.filter(x =>
            getAny(x, ['trangThai', 'TrangThai']) === 'Chờ xác nhận'
        ).length;

        // Card 2: Đã nhập — phiếu đã xác nhận
        const daXacNhan = list.filter(x =>
            getAny(x, ['trangThai', 'TrangThai']) === 'Đã xác nhận'
        ).length;

        // Card 3: Tổng số phiếu
        const tongPhieu = list.length;

        const el1 = document.querySelector('.stat-card:nth-child(1) .stat-number');
        const el2 = document.querySelector('.stat-card:nth-child(2) .stat-number');
        const el3 = document.querySelector('.stat-card:nth-child(3) .stat-number');
        if (el1) el1.textContent = choXacNhan;
        if (el2) el2.textContent = daXacNhan;
        if (el3) el3.textContent = tongPhieu;
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
            const [hangData, dotData] = await Promise.all([
                window.CuuTroApi.requestJson('/api/HangCuuTro'),
                window.CuuTroApi.requestJson('/api/DotCuuTro'),
            ]);
            allHang = Array.isArray(hangData) ? hangData : [];
            allCampaigns = Array.isArray(dotData) ? dotData : [];

            // Điền dropdown đợt trong modal tạo phiếu
            const dotSelect = document.getElementById('ci-ma-dot');
            if (dotSelect) {
                dotSelect.innerHTML = '<option value="">-- Không gắn với đợt cụ thể --</option>';
                allCampaigns.forEach(c => {
                    const id = getAny(c, ['maDot', 'MaDot']);
                    const name = getAny(c, ['tenDot', 'TenDot']);
                    dotSelect.innerHTML += `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`;
                });
            }

            // Thêm 1 dòng hàng hóa mặc định khi mở modal
            if (document.getElementById('ci-goods-list')?.children.length === 0) {
                window.addGoodsRow();
            }
        } catch (_) {}
    };

    // --- Thêm dòng hàng hóa ---
    window.addGoodsRow = () => {
        const container = document.getElementById('ci-goods-list');
        if (!container) return;

        const idx = container.children.length;
        const hangOptions = allHang.map(h => {
            const ma = getAny(h, ['maHang', 'MaHang']);
            const ten = getAny(h, ['tenHang', 'TenHang']);
            const dv = getAny(h, ['donViTinh', 'DonViTinh'], '');
            return `<option value="${escapeHtml(ma)}" data-dv="${escapeHtml(dv)}">${escapeHtml(ten)}${dv ? ' (' + dv + ')' : ''}</option>`;
        }).join('');

        const row = document.createElement('div');
        row.className = 'goods-row';
        row.dataset.idx = idx;
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
                    <label>SL Chứng Từ <span class="required">*</span></label>
                    <input type="number" class="form-control goods-slct" min="0" step="0.01" placeholder="0" required>
                </div>
                <div class="form-group goods-col-sl">
                    <label>SL Thực Nhập <span class="required">*</span></label>
                    <input type="number" class="form-control goods-slthuc" min="0" step="0.01" placeholder="0" required>
                </div>
                <div class="goods-col-remove">
                    <button type="button" class="btn-remove-row" onclick="removeGoodsRow(this)" title="Xóa dòng">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(row);
    };

    // --- Xóa dòng hàng hóa ---
    window.removeGoodsRow = (btn) => {
        const row = btn.closest('.goods-row');
        if (row) row.remove();
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
        // Reset form và thêm 1 dòng hàng hóa mặc định
        document.getElementById('create-import-form')?.reset();
        const goodsList = document.getElementById('ci-goods-list');
        if (goodsList) {
            goodsList.innerHTML = '';
            window.addGoodsRow();
        }
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
        const nguonHang = document.getElementById('ci-nguon-hang')?.value?.trim();
        const maDot = document.getElementById('ci-ma-dot')?.value?.trim() || null;
        const taiXe = document.getElementById('ci-tai-xe')?.value?.trim() || null;
        const sdtTaiXe = document.getElementById('ci-sdt-tai-xe')?.value?.trim() || null;
        const bienSo = document.getElementById('ci-bien-so')?.value?.trim() || null;
        const ghiChu = document.getElementById('ci-ghi-chu')?.value?.trim() || null;
        const userId = localStorage.getItem('userId') || '';

        if (!nguonHang) {
            alert('Vui lòng nhập Nguồn Hàng / Người Ủng Hộ.');
            return;
        }

        // Thu thập chi tiết hàng hóa
        const rows = document.querySelectorAll('#ci-goods-list .goods-row');
        const chiTiet = [];
        let hasError = false;

        rows.forEach((row, i) => {
            const maHang = row.querySelector('.goods-select')?.value?.trim();
            const slct = parseFloat(row.querySelector('.goods-slct')?.value) || 0;
            const slthuc = parseFloat(row.querySelector('.goods-slthuc')?.value) || 0;

            if (!maHang) {
                alert(`Dòng hàng hóa ${i + 1}: Vui lòng chọn mặt hàng.`);
                hasError = true;
                return;
            }
            if (slct <= 0 || slthuc <= 0) {
                alert(`Dòng hàng hóa ${i + 1}: Số lượng phải lớn hơn 0.`);
                hasError = true;
                return;
            }
            chiTiet.push({ MaHang: maHang, SoLuongChungTu: slct, SoLuongThucNhap: slthuc });
        });

        if (hasError) return;

        const payload = {
            MaNguoiDung: userId,
            MaUngHo: null,
            NguoiVanChuyen: taiXe,
            NguonHang: nguonHang,
            TrangThai: 'Chờ xác nhận',
            ChiTiet: chiTiet
        };

        // Gắn thêm thông tin tài xế / biển số vào NguoiVanChuyen nếu không có mã người dùng
        // (API hiện dùng MaNguoiDung cho NguoiVanChuyen, nên ta gửi tên + SĐT vào NguonHang mở rộng)
        // Nếu có biển số / SĐT, đính kèm vào ghi chú NguonHang
        let nguonFull = nguonHang;
        const extras = [taiXe && `Tài xế: ${taiXe}`, sdtTaiXe && `SĐT: ${sdtTaiXe}`, bienSo && `BSX: ${bienSo}`, ghiChu].filter(Boolean);
        if (extras.length) nguonFull += ` | ${extras.join(' | ')}`;
        payload.NguonHang = nguonFull;

        try {
            await window.CuuTroApi.requestJson('/api/PhieuNhap', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            closeCreateImportModal();
            document.getElementById('create-import-form').reset();
            document.getElementById('ci-goods-list').innerHTML = '';
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
