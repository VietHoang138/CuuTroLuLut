document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('api-campaigns-table');
    const openBtn = document.getElementById('btn-open-campaign-modal');
    const overlay = document.getElementById('campaign-modal-overlay');
    const closeBtn = document.getElementById('btn-close-campaign-modal');
    const cancelBtn = document.getElementById('btn-cancel-campaign');
    const form = document.getElementById('campaign-form');
    const titleEl = document.getElementById('campaign-modal-title');
    const saveBtn = document.getElementById('btn-save-campaign');

    if (!tableBody || !form || !overlay) return;

    let cache = [];

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

    const normalize = (c) => ({
        MaDot: getAny(c, ['maDot', 'MaDot']),
        TenDot: getAny(c, ['tenDot', 'TenDot']),
        MoTa: getAny(c, ['moTa', 'MoTa']),
        NgayBatDau: getAny(c, ['ngayBatDau', 'NgayBatDau']),
        NgayKetThuc: getAny(c, ['ngayKetThuc', 'NgayKetThuc']),
        TrangThai: getAny(c, ['trangThai', 'TrangThai'])
    });

    const statusBadge = (tt) => {
        if (tt === 'Đang vận động') return `<span class="status-badge status-active">${escapeHtml(tt)}</span>`;
        if (tt === 'Đang phân bổ') return `<span class="status-badge" style="background:#fef3c7;color:#92400e;">${escapeHtml(tt)}</span>`;
        if (tt === 'Đã kết thúc') return `<span class="status-badge" style="background:#f1f5f9;color:#64748b;">${escapeHtml(tt)}</span>`;
        return `<span class="status-badge" style="background:#e0f2fe;color:#0369a1;">${escapeHtml(tt)}</span>`;
    };

    const openModal = ({ mode, item }) => {
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        if (mode === 'edit' && item) {
            titleEl.textContent = 'Sửa Chiến Dịch';
            document.getElementById('campaign-id').value = item.MaDot;
            document.getElementById('campaign-name').value = item.TenDot;
            document.getElementById('campaign-desc').value = item.MoTa;
            document.getElementById('campaign-start').value = item.NgayBatDau;
            document.getElementById('campaign-end').value = item.NgayKetThuc;
            document.getElementById('campaign-status').value = item.TrangThai;
        } else {
            titleEl.textContent = 'Tạo Chiến Dịch';
            form.reset();
            document.getElementById('campaign-id').value = '';
        }
    };

    const closeModal = () => {
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
    };

    const renderTable = (list) => {
        if (!list.length) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:var(--text-muted);">Chưa có chiến dịch nào.</td></tr>`;
            return;
        }
        tableBody.innerHTML = list.map(c => `
            <tr data-id="${escapeHtml(c.MaDot)}">
                <td><strong>${escapeHtml(c.MaDot)}</strong></td>
                <td>${escapeHtml(c.TenDot)}</td>
                <td>${escapeHtml(c.NgayBatDau) || '—'}</td>
                <td>${escapeHtml(c.NgayKetThuc) || '—'}</td>
                <td>${statusBadge(c.TrangThai)}</td>
                <td style="text-align:right;">
                    <div class="action-buttons">
                        <button class="btn-action" data-action="edit">Sửa</button>
                        <button class="btn-action btn-danger" data-action="delete">Xóa</button>
                    </div>
                </td>
            </tr>`).join('');
    };

    const loadCampaigns = async () => {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;">
            <div style="display:inline-block;width:36px;height:36px;border:4px solid var(--border-color);border-top-color:var(--accent-orange);border-radius:50%;animation:spin 1s linear infinite;"></div>
            <p style="margin-top:1rem;color:var(--text-muted);">Đang tải...</p></td></tr>`;
        try {
            const data = await window.CuuTroApi.requestJson('/api/DotCuuTro');
            cache = Array.isArray(data) ? data.map(normalize) : [];
            renderTable(cache);
            updateStats(cache);
        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2.5rem;color:#dc2626;">Không tải được dữ liệu. ${escapeHtml(err.message)}</td></tr>`;
        }
    };

    const updateStats = (list) => {
        const total = list.length;
        const active = list.filter(c => c.TrangThai === 'Đang vận động').length;
        const distributing = list.filter(c => c.TrangThai === 'Đang phân bổ').length;
        const ended = list.filter(c => c.TrangThai === 'Đã kết thúc').length;
        const el = (id) => document.getElementById(id);
        if (el('stat-total')) el('stat-total').textContent = total;
        if (el('stat-active')) el('stat-active').textContent = active;
        if (el('stat-distributing')) el('stat-distributing').textContent = distributing;
        if (el('stat-ended')) el('stat-ended').textContent = ended;
    };

    const setBusy = (busy) => {
        if (!saveBtn) return;
        saveBtn.disabled = !!busy;
        saveBtn.textContent = busy ? 'Đang lưu...' : 'Lưu';
    };

    openBtn?.addEventListener('click', () => openModal({ mode: 'create' }));
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    tableBody.addEventListener('click', async (e) => {
        const btn = e.target?.closest?.('button[data-action]');
        if (!btn) return;
        const tr = btn.closest('tr[data-id]');
        const id = tr?.getAttribute('data-id') || '';
        if (!id) return;
        const action = btn.getAttribute('data-action');
        const item = cache.find(x => x.MaDot === id);

        if (action === 'edit') { openModal({ mode: 'edit', item }); return; }

        if (action === 'delete') {
            if (!confirm(`Xóa chiến dịch "${id}"?`)) return;
            try {
                await window.CuuTroApi.requestJson(`/api/DotCuuTro/${encodeURIComponent(id)}`, { method: 'DELETE' });
                await loadCampaigns();
            } catch (err) {
                const raw = err.message || '';
                if (raw.startsWith('[409]')) {
                    let msg = '';
                    try { msg = JSON.parse(raw.replace(/^\[409\]\s*/, '')).message; } catch (_) {}
                    alert(msg || 'Không thể xóa vì có dữ liệu liên quan.');
                } else {
                    alert(`Lỗi xóa: ${raw}`);
                }
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('campaign-id').value.trim();
        const payload = {
            TenDot: document.getElementById('campaign-name').value.trim(),
            MoTa: document.getElementById('campaign-desc').value.trim(),
            NgayBatDau: document.getElementById('campaign-start').value,
            NgayKetThuc: document.getElementById('campaign-end').value,
            TrangThai: document.getElementById('campaign-status').value
        };
        if (!payload.TenDot) { alert('Vui lòng nhập tên chiến dịch.'); return; }
        try {
            setBusy(true);
            if (id) {
                await window.CuuTroApi.requestJson(`/api/DotCuuTro/${encodeURIComponent(id)}`, {
                    method: 'PUT', body: JSON.stringify(payload)
                });
            } else {
                await window.CuuTroApi.requestJson('/api/DotCuuTro', {
                    method: 'POST', body: JSON.stringify(payload)
                });
            }
            closeModal();
            await loadCampaigns();
        } catch (err) {
            alert(`Lỗi lưu: ${err.message || ''}`);
        } finally {
            setBusy(false);
        }
    });

    loadCampaigns();
});
