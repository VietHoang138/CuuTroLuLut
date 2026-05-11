document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('api-users-table');
    const openBtn = document.getElementById('btn-open-user-modal');

    const overlay = document.getElementById('user-modal-overlay');
    const closeBtn = document.getElementById('btn-close-user-modal');
    const cancelBtn = document.getElementById('btn-cancel-user');
    const form = document.getElementById('user-form');

    const titleEl = document.getElementById('user-modal-title');
    const idEl = document.getElementById('user-id');
    const nameEl = document.getElementById('user-name');
    const emailEl = document.getElementById('user-email');
    const phoneEl = document.getElementById('user-phone');
    const roleEl = document.getElementById('user-role');
    const passwordGroupEl = document.getElementById('password-group');
    const passwordEl = document.getElementById('user-password');
    const statusEl = document.getElementById('user-status');
    const addressEl = document.getElementById('user-address');
    const villageEl = document.getElementById('user-village');
    const saveBtn = document.getElementById('btn-save-user');

    if (!tableBody || !form || !overlay) return;

    let roles = [];
    let usersCache = [];

    const getAny = (obj, keys, fallback = '') => {
        if (!obj) return fallback;
        for (const k of keys) {
            const v = obj?.[k];
            if (v !== undefined && v !== null && `${v}` !== '') return v;
        }
        return fallback;
    };

    const normalizeRole = (r) => ({
        MaVaiTro: getAny(r, ['MaVaiTro', 'maVaiTro']),
        TenVaiTro: getAny(r, ['TenVaiTro', 'tenVaiTro']),
        TrangThai: getAny(r, ['TrangThai', 'trangThai'])
    });

    const normalizeUser = (u) => ({
        MaNguoiDung: getAny(u, ['MaNguoiDung', 'maNguoiDung']),
        HoTen: getAny(u, ['HoTen', 'hoTen']),
        Email: getAny(u, ['Email', 'email']),
        SoDienThoai: getAny(u, ['SoDienThoai', 'soDienThoai']),
        DiaChiCuThe: getAny(u, ['DiaChiCuThe', 'diaChiCuThe']),
        MaThonToDanPho: getAny(u, ['MaThonToDanPho', 'maThonToDanPho']),
        MaVaiTro: getAny(u, ['MaVaiTro', 'maVaiTro']),
        TenVaiTro: getAny(u, ['TenVaiTro', 'tenVaiTro']),
        TrangThai: getAny(u, ['TrangThai', 'trangThai'], 'Hoạt động')
    });

    const escapeHtml = (value) => {
        const str = `${value ?? ''}`;
        return str
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    };

    const isLocked = (trangThai) => `${trangThai || ''}`.toLowerCase().includes('khóa');

    const statusBadgeHtml = (trangThai) => {
        const locked = isLocked(trangThai);
        if (!locked) {
            return `<span class="status-badge status-active">Hoạt động</span>`;
        }
        return `<span class="status-badge" style="background:#fef3c7;color:#92400e;">Tạm khóa</span>`;
    };

    const openModal = ({ mode, user }) => {
        const u = user ? normalizeUser(user) : null;
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');

        if (mode === 'edit' && u) {
            titleEl.textContent = 'Sửa Người Dùng';
            idEl.value = u.MaNguoiDung || '';
            nameEl.value = u.HoTen || '';
            emailEl.value = u.Email || '';
            phoneEl.value = u.SoDienThoai || '';
            roleEl.value = u.MaVaiTro || '';
            statusEl.value = u.TrangThai || 'Hoạt động';
            if (addressEl) addressEl.value = u.DiaChiCuThe || '';
            if (villageEl) villageEl.value = u.MaThonToDanPho || '';

            passwordEl.value = '';
            passwordGroupEl.style.display = 'none';
        } else {
            titleEl.textContent = 'Thêm Người Dùng';
            idEl.value = '';
            nameEl.value = '';
            emailEl.value = '';
            phoneEl.value = '';
            roleEl.value = '';
            statusEl.value = 'Hoạt động';
            if (addressEl) addressEl.value = '';
            if (villageEl) villageEl.value = '';

            passwordEl.value = '';
            passwordGroupEl.style.display = '';
        }
    };

    const closeModal = () => {
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
    };

    const renderUsers = (users = []) => {
        if (!users.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
                        Không có người dùng.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = users.map(raw => {
            const u = normalizeUser(raw);
            const locked = isLocked(u.TrangThai);
            const lockLabel = locked ? 'Mở khóa' : 'Khóa';
            const lockAction = locked ? 'unlock' : 'lock';
            const roleName = u.TenVaiTro || u.MaVaiTro || 'Chưa cập nhật';

            return `
                <tr data-id="${escapeHtml(u.MaNguoiDung)}">
                    <td>${escapeHtml(u.MaNguoiDung)}</td>
                    <td>${escapeHtml(u.HoTen)}</td>
                    <td>${escapeHtml(u.Email)}</td>
                    <td>${escapeHtml(roleName)}</td>
                    <td>${statusBadgeHtml(u.TrangThai)}</td>
                    <td style="text-align:right;">
                        <div class="action-buttons">
                            <button class="btn-action" data-action="edit" type="button">Sửa</button>
                            <button class="btn-action btn-danger" data-action="delete" type="button">Xóa</button>
                            <button class="btn-action" data-action="${lockAction}" type="button">${lockLabel}</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    };

    const loadRoles = async () => {
        try {
            const data = await window.CuuTroApi.requestJson('/api/VaiTro');
            roles = Array.isArray(data) ? data.map(normalizeRole) : [];
        } catch (_) {
            roles = [];
        }

        if (!roleEl) return;
        const options = roles.map(r => {
            const value = r.MaVaiTro || '';
            const label = r.TenVaiTro || r.MaVaiTro || '';
            return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
        }).join('');

        roleEl.innerHTML = `<option value="">-- Chọn vai trò --</option>${options}`;
    };

    const loadUsers = async () => {
        try {
            const data = await window.CuuTroApi.requestJson('/api/NguoiDung');
            usersCache = Array.isArray(data) ? data.map(normalizeUser) : [];
            renderUsers(usersCache);
        } catch (error) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding: 2.5rem; color: #dc2626;">
                        Không tải được danh sách người dùng từ API. ${escapeHtml(error.message || '')}
                    </td>
                </tr>
            `;
        }
    };

    const setBusy = (busy) => {
        if (!saveBtn) return;
        saveBtn.disabled = !!busy;
        saveBtn.textContent = busy ? 'Đang lưu...' : 'Lưu';
    };

    openBtn?.addEventListener('click', () => openModal({ mode: 'create' }));
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    tableBody.addEventListener('click', async (e) => {
        const btn = e.target?.closest?.('button[data-action]');
        if (!btn) return;

        const tr = btn.closest('tr[data-id]');
        const id = tr?.getAttribute('data-id') || '';
        if (!id) return;

        const action = btn.getAttribute('data-action');
        const user = usersCache.find(x => x.MaNguoiDung === id);

        if (action === 'edit') {
            openModal({ mode: 'edit', user });
            return;
        }

        if (action === 'delete') {
            const ok = confirm(`Bạn có chắc muốn xóa người dùng ${id}?\nLưu ý: Không thể xóa nếu người dùng có dữ liệu liên quan.`);
            if (!ok) return;
            try {
                await window.CuuTroApi.requestJson(`/api/NguoiDung/${encodeURIComponent(id)}`, { method: 'DELETE' });
                await loadUsers();
            } catch (error) {
                const raw = error.message || '';
                // Lỗi 409: có dữ liệu liên quan (FK constraint)
                if (raw.startsWith('[409]')) {
                    let detail = '';
                    try { detail = JSON.parse(raw.replace(/^\[409\]\s*/, '')).message; } catch (_) {}
                    alert(detail || `Không thể xóa người dùng "${id}".\n\nNgười dùng này đang có phiếu nhập/xuất liên quan.\nVui lòng dùng chức năng "Khóa" tài khoản thay vì xóa.`);
                } else {
                    alert(`Lỗi xóa người dùng: ${raw}`);
                }
            }
            return;
        }

        if (action === 'lock' || action === 'unlock') {
            const label = action === 'lock' ? 'khóa' : 'mở khóa';
            const ok = confirm(`Bạn có chắc muốn ${label} tài khoản ${id}?`);
            if (!ok) return;
            await window.CuuTroApi.requestJson(`/api/NguoiDung/${encodeURIComponent(id)}/${action}`, { method: 'PATCH' });
            await loadUsers();
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = (idEl.value || '').trim();
        const payload = {
            MaNguoiDung: id || undefined,
            HoTen: (nameEl.value || '').trim(),
            Email: (emailEl.value || '').trim(),
            SoDienThoai: (phoneEl.value || '').trim(),
            MaVaiTro: (roleEl.value || '').trim(),
            TrangThai: (statusEl.value || '').trim(),
            DiaChiCuThe: addressEl ? (addressEl.value || '').trim() : '',
            MaThonToDanPho: villageEl ? (villageEl.value || '').trim() : ''
        };

        if (!payload.HoTen || !payload.Email || !payload.MaVaiTro) {
            alert('Vui lòng nhập Họ tên, Email và Vai trò.');
            return;
        }

        try {
            setBusy(true);
            if (id) {
                await window.CuuTroApi.requestJson(`/api/NguoiDung/${encodeURIComponent(id)}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                const password = (passwordEl.value || '').trim();
                if (!password) {
                    alert('Vui lòng nhập mật khẩu khi tạo mới.');
                    return;
                }
                await window.CuuTroApi.requestJson('/api/NguoiDung', {
                    method: 'POST',
                    body: JSON.stringify({ ...payload, MatKhau: password })
                });
            }

            closeModal();
            await loadUsers();
        } catch (error) {
            alert(`Lỗi lưu người dùng: ${error.message || ''}`);
        } finally {
            setBusy(false);
        }
    });

    Promise.all([loadRoles(), loadUsers()]).catch(() => {});
});

