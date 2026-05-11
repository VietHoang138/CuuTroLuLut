document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('submit-list-form');
    const campaignSelect = document.getElementById('campaign-select');
    const tbody = document.getElementById('households-tbody');
    const btnAddRow = document.getElementById('btn-add-row');
    const totalHouseholdsEl = document.getElementById('total-households');
    const totalPeopleEl = document.getElementById('total-people');

    if (!form) return;

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

    // --- Load thông tin thôn từ localStorage ---
    const maThon = localStorage.getItem('maThon') || '';
    const userName = localStorage.getItem('userName') || 'Trưởng thôn';
    const displayUserName = document.getElementById('display-user-name');
    if (displayUserName) displayUserName.textContent = userName;

    // Hiển thị tên thôn
    const thonInput = document.querySelector('input[readonly]');

    const loadThonInfo = async () => {
        if (!maThon || !thonInput) return;
        try {
            const data = await window.CuuTroApi.requestJson(`/api/ThonToDanPho/${encodeURIComponent(maThon)}`);
            if (data) {
                const tenThon = getAny(data, ['tenThonToDanPho', 'TenThonToDanPho']);
                const tenPX = getAny(data, ['tenPhuongXa', 'TenPhuongXa']);
                thonInput.value = [tenThon, tenPX].filter(Boolean).join(', ') || maThon;
            }
        } catch (_) {}
    };

    // --- Load đợt cứu trợ đang hoạt động ---
    const loadCampaigns = async () => {
        try {
            const data = await window.CuuTroApi.requestJson('/api/DotCuuTro');
            const active = Array.isArray(data)
                ? data.filter(c => {
                    const tt = getAny(c, ['trangThai', 'TrangThai']);
                    return tt === 'Đang vận động' || tt === 'Đang phân bổ';
                })
                : [];

            campaignSelect.innerHTML = '<option value="">-- Chọn đợt cứu trợ --</option>';
            active.forEach(c => {
                const id = getAny(c, ['maDot', 'MaDot']);
                const name = getAny(c, ['tenDot', 'TenDot']);
                campaignSelect.innerHTML += `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`;
            });

            // Nếu có ?dot= trong URL thì chọn sẵn
            const params = new URLSearchParams(window.location.search);
            const dotParam = params.get('dot');
            if (dotParam) campaignSelect.value = dotParam;

        } catch (_) {
            campaignSelect.innerHTML = '<option value="">Không tải được dữ liệu</option>';
        }
    };

    // --- Cập nhật tổng ---
    const updateSummary = () => {
        const rows = tbody.querySelectorAll('tr');
        let totalPeople = 0;
        rows.forEach(row => {
            const numInput = row.querySelector('input[type="number"]');
            totalPeople += parseInt(numInput?.value || '0') || 0;
        });
        if (totalHouseholdsEl) totalHouseholdsEl.textContent = rows.length;
        if (totalPeopleEl) totalPeopleEl.textContent = totalPeople;
    };

    // --- Tạo dòng mới ---
    const createRow = (index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="row-num">${index}</td>
            <td><input type="text" class="form-control input-sm" placeholder="Họ và tên" required></td>
            <td><input type="number" class="form-control input-sm" placeholder="Số người" min="1" required></td>
            <td>
                <select class="form-control input-sm" required>
                    <option value="Nặng (Sập/Ngập hoàn toàn)">Nặng (Sập/Ngập hoàn toàn)</option>
                    <option value="Trung bình (Ngập một phần)">Trung bình (Ngập một phần)</option>
                    <option value="Nhẹ (Hư hỏng tài sản)">Nhẹ (Hư hỏng tài sản)</option>
                    <option value="Bị cô lập">Bị cô lập</option>
                </select>
            </td>
            <td><input type="text" class="form-control input-sm" placeholder="Tùy chọn"></td>
            <td><button type="button" class="btn-remove-row" title="Xóa dòng"><i class="fa-solid fa-trash-can"></i></button></td>
        `;
        tr.querySelector('.btn-remove-row').addEventListener('click', () => {
            tr.remove();
            reindexRows();
            updateSummary();
        });
        tr.querySelector('input[type="number"]').addEventListener('input', updateSummary);
        return tr;
    };

    const reindexRows = () => {
        tbody.querySelectorAll('tr').forEach((tr, i) => {
            const numCell = tr.querySelector('.row-num');
            if (numCell) numCell.textContent = i + 1;
        });
    };

    // Gắn event cho dòng đầu tiên có sẵn
    const firstRow = tbody.querySelector('tr');
    if (firstRow) {
        firstRow.querySelector('.btn-remove-row')?.addEventListener('click', () => {
            if (tbody.querySelectorAll('tr').length > 1) {
                firstRow.remove();
                reindexRows();
                updateSummary();
            }
        });
        firstRow.querySelector('input[type="number"]')?.addEventListener('input', updateSummary);
    }

    btnAddRow?.addEventListener('click', () => {
        const index = tbody.querySelectorAll('tr').length + 1;
        tbody.appendChild(createRow(index));
        updateSummary();
    });

    // --- Submit form → tạo YeuCauCuuTro cho từng hộ ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const maDot = campaignSelect.value;
        if (!maDot) { alert('Vui lòng chọn đợt cứu trợ.'); return; }

        const userId = localStorage.getItem('userId') || '';
        const rows = tbody.querySelectorAll('tr');
        if (!rows.length) { alert('Vui lòng thêm ít nhất một hộ dân.'); return; }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const inputs = row.querySelectorAll('input, select');
            const hoTen = inputs[0]?.value?.trim() || '';
            const soNguoi = inputs[1]?.value?.trim() || '1';
            const mucDo = inputs[2]?.value || 'Trung bình (Ngập một phần)';
            const ghiChu = inputs[3]?.value?.trim() || '';

            if (!hoTen) continue;

            const noiDung = `Chủ hộ: ${hoTen} | Nhân khẩu: ${soNguoi} | Thiệt hại: ${mucDo}${ghiChu ? ' | Ghi chú: ' + ghiChu : ''}`;

            try {
                await window.CuuTroApi.requestJson('/api/YeuCauCuuTro', {
                    method: 'POST',
                    body: JSON.stringify({
                        MaNguoiDung: userId,
                        MaDot: maDot,
                        NoiDung: noiDung,
                        TrangThai: 'Chờ duyệt',
                        MucDoUuTien: mucDo.includes('Nặng') ? 'Cao' : mucDo.includes('Trung bình') ? 'Trung bình' : 'Thấp'
                    })
                });
                successCount++;
            } catch (_) {
                errorCount++;
            }
        }

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi Danh Sách';

        if (successCount > 0) {
            alert(`Đã gửi thành công ${successCount} yêu cầu cứu trợ!${errorCount > 0 ? ` (${errorCount} lỗi)` : ''}`);
            form.reset();
            tbody.innerHTML = '';
            tbody.appendChild(createRow(1));
            updateSummary();
            await loadCampaigns();
        } else {
            alert('Gửi thất bại. Vui lòng thử lại.');
        }
    });

    // Init
    Promise.all([loadCampaigns(), loadThonInfo()]);
    updateSummary();
});
