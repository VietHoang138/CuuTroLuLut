document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('api-villages-table');
    const openBtn = document.getElementById('btn-open-village-modal');
    const overlay = document.getElementById('village-modal-overlay');
    const closeBtn = document.getElementById('btn-close-village-modal');
    const cancelBtn = document.getElementById('btn-cancel-village');
    const form = document.getElementById('village-form');
    const titleEl = document.getElementById('village-modal-title');
    const idEl = document.getElementById('village-id');
    const nameEl = document.getElementById('village-name');
    const phuongXaEl = document.getElementById('village-phuongxa');
    const saveBtn = document.getElementById('btn-save-village');

    if (!tableBody || !form || !overlay) return;

    let villagesCache = [];

    const getAny = (obj, keys, fallback = '') => {
        if (!obj) return fallback;
        for (const k of keys) {
            const v = obj?.[k];
            if (v !== undefined && v !== null && `${v}` !== '') return v;
        }
        return fallback;
    };

    const normalizeVillage = (v) => ({
        MaThonToDanPho: getAny(v, ['MaThonToDanPho', 'maThonToDanPho']),
        TenThonToDanPho: getAny(v, ['TenThonToDanPho', 'tenThonToDanPho']),
        MaPhuongXa: getAny(v, ['MaPhuongXa', 'maPhuongXa']),
        TenPhuongXa: getAny(v, ['TenPhuongXa', 'tenPhuongXa']),
        MaTinhThanhPho: getAny(v, ['MaTinhThanhPho', 'maTinhThanhPho']),
        TenTinhThanhPho: getAny(v, ['TenTinhThanhPho', 'tenTinhThanhPho']),
        SoHoDan: getAny(v, ['SoHoDan', 'soHoDan'], 0)
    });

    const escapeHtml = (v) => `${v ?? ''}`
        .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;').replaceAll('"', '&quot;');

    const openModal = ({ mode, village }) => {
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        if (mode === 'edit' && village) {
            titleEl.textContent = 'Sửa Thôn';
            idEl.value = village.MaThonToDanPho || '';
            nameEl.value = village.TenThonToDanPho || '';
            if (phuongXaEl) phuongXaEl.value = village.MaPhuongXa || '';
        } else {
            titleEl.textContent = 'Thêm Thôn';
            idEl.value = '';
            nameEl.value = '';
            if (phuongXaEl) phuongXaEl.value = '';
        }
    };

    const closeModal = () => {
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
    };

    const renderVillages = (list = []) => {
        if (!list.length) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
                        Không có dữ liệu thôn.
                    </td>
                </tr>`;
            return;
        }

        tableBody.innerHTML = list.map(v => `
            <tr data-id="${escapeHtml(v.MaThonToDanPho)}">
                <td>${escapeHtml(v.MaThonToDanPho)}</td>
                <td>${escapeHtml(v.TenThonToDanPho)}</td>
                <td>${escapeHtml(v.TenPhuongXa || v.MaPhuongXa || '—')}</td>
                <td>${escapeHtml(v.TenTinhThanhPho || '—')}</td>
                <td>${escapeHtml(v.SoHoDan ?? 0)}</td>
                <td style="text-align:right;">
                    <div class="action-buttons">
                        <button class="btn-action" data-action="edit" type="button">Sửa</button>
                        <button class="btn-action btn-danger" data-action="delete" type="button">Xóa</button>
                    </div>
                </td>
            </tr>
        `).join('');
    };

    const loadVillages = async () => {
        try {
            const data = await window.CuuTroApi.requestJson('/api/ThonToDanPho');
            villagesCache = Array.isArray(data) ? data.map(normalizeVillage) : [];
            renderVillages(villagesCache);
        } catch (error) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:2.5rem; color:#dc2626;">
                        Không tải được danh sách thôn. ${escapeHtml(error.message || '')}
                    </td>
                </tr>`;
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
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

    tableBody.addEventListener('click', async (e) => {
        const btn = e.target?.closest?.('button[data-action]');
        if (!btn) return;
        const tr = btn.closest('tr[data-id]');
        const id = tr?.getAttribute('data-id') || '';
        if (!id) return;
        const action = btn.getAttribute('data-action');
        const village = villagesCache.find(x => x.MaThonToDanPho === id);

        if (action === 'edit') {
            openModal({ mode: 'edit', village });
            return;
        }

        if (action === 'delete') {
            const ok = confirm(`Bạn có chắc muốn xóa thôn "${id}"?`);
            if (!ok) return;
            try {
                await window.CuuTroApi.requestJson(`/api/ThonToDanPho/${encodeURIComponent(id)}`, { method: 'DELETE' });
                await loadVillages();
            } catch (error) {
                const raw = error.message || '';
                if (raw.startsWith('[409]')) {
                    let detail = '';
                    try { detail = JSON.parse(raw.replace(/^\[409\]\s*/, '')).message; } catch (_) {}
                    alert(detail || `Không thể xóa thôn "${id}" vì đang có dữ liệu liên quan.`);
                } else {
                    alert(`Lỗi xóa: ${raw}`);
                }
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = (idEl.value || '').trim();
        const payload = {
            TenThonToDanPho: (nameEl.value || '').trim(),
            MaPhuongXa: phuongXaEl ? (phuongXaEl.value || '').trim() : ''
        };

        if (!payload.TenThonToDanPho) {
            alert('Vui lòng nhập tên thôn.');
            return;
        }

        try {
            setBusy(true);
            if (id) {
                await window.CuuTroApi.requestJson(`/api/ThonToDanPho/${encodeURIComponent(id)}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                await window.CuuTroApi.requestJson('/api/ThonToDanPho', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }
            closeModal();
            await loadVillages();
        } catch (error) {
            alert(`Lỗi lưu thôn: ${error.message || ''}`);
        } finally {
            setBusy(false);
        }
    });

    loadVillages();
});
