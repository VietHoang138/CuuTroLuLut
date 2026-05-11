document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('api-recipients-table');
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
        if (s === 'Đã duyệt') return `<span class="status-badge status-active">${escapeHtml(s)}</span>`;
        if (s === 'Chờ duyệt') return `<span class="status-badge" style="background:#fef3c7;color:#92400e;">${escapeHtml(s)}</span>`;
        if (s === 'Đã từ chối') return `<span class="status-badge" style="background:#fef2f2;color:#dc2626;">${escapeHtml(s)}</span>`;
        return `<span class="status-badge" style="background:#f1f5f9;color:#64748b;">${escapeHtml(s)}</span>`;
    };

    const priorityBadge = (p) => {
        if (p === 'Cao') return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.75rem;font-weight:600;color:#dc2626;"><i class="fa-solid fa-circle-exclamation"></i>${escapeHtml(p)}</span>`;
        if (p === 'Trung bình') return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.75rem;font-weight:600;color:#d97706;"><i class="fa-solid fa-circle-minus"></i>${escapeHtml(p)}</span>`;
        return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:0.75rem;font-weight:600;color:#64748b;"><i class="fa-solid fa-circle-dot"></i>${escapeHtml(p)}</span>`;
    };

    let cache = [];

    const updateStats = (list) => {
        const el = (id) => document.getElementById(id);
        if (el('stat-total')) el('stat-total').textContent = list.length;
        if (el('stat-pending')) el('stat-pending').textContent = list.filter(x => getAny(x, ['trangThai', 'TrangThai']) === 'Chờ duyệt').length;
        if (el('stat-approved')) el('stat-approved').textContent = list.filter(x => getAny(x, ['trangThai', 'TrangThai']) === 'Đã duyệt').length;
        if (el('stat-high')) el('stat-high').textContent = list.filter(x => getAny(x, ['mucDoUuTien', 'MucDoUuTien']) === 'Cao').length;
    };

    const renderTable = (list) => {
        if (!list.length) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:var(--text-muted);">Chưa có yêu cầu cứu trợ nào.</td></tr>`;
            return;
        }
        tableBody.innerHTML = list.map(d => {
            const ma = getAny(d, ['maYeuCau', 'MaYeuCau']);
            const hoTen = getAny(d, ['hoTen', 'HoTen']);
            const sdt = getAny(d, ['soDienThoai', 'SoDienThoai']);
            const thon = getAny(d, ['tenThon', 'TenThon'], '—');
            const noiDung = getAny(d, ['noiDung', 'NoiDung']);
            const tenDot = getAny(d, ['tenDot', 'TenDot'], '—');
            const trangThai = getAny(d, ['trangThai', 'TrangThai']);
            const mucDo = getAny(d, ['mucDoUuTien', 'MucDoUuTien']);

            return `
            <tr data-id="${escapeHtml(ma)}">
                <td><strong>${escapeHtml(ma)}</strong></td>
                <td>
                    <div style="font-weight:600;color:var(--text-dark);">${escapeHtml(hoTen)}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted);">${escapeHtml(sdt || '—')}</div>
                </td>
                <td>${escapeHtml(thon)}</td>
                <td style="max-width:200px;">
                    <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(noiDung)}">${escapeHtml(noiDung)}</div>
                    <div style="font-size:0.78rem;color:var(--text-muted);">${escapeHtml(tenDot)}</div>
                </td>
                <td>${priorityBadge(mucDo)}</td>
                <td>${statusBadge(trangThai)}</td>
                <td style="text-align:right;">
                    <div class="action-buttons">
                        ${trangThai === 'Chờ duyệt' ? `
                        <button class="btn-action" data-action="approve" title="Duyệt" style="color:#16a34a;border-color:#bbf7d0;">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button class="btn-action btn-danger" data-action="reject" title="Từ chối">
                            <i class="fa-solid fa-xmark"></i>
                        </button>` : `
                        <button class="btn-action btn-danger" data-action="delete" title="Xóa">
                            <i class="fa-solid fa-trash"></i>
                        </button>`}
                    </div>
                </td>
            </tr>`;
        }).join('');
    };

    const loadRecipients = async () => {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:3rem;">
            <div style="display:inline-block;width:40px;height:40px;border:4px solid var(--border-color);border-top-color:var(--accent-orange);border-radius:50%;animation:spin 1s linear infinite;"></div>
            <p style="margin-top:1rem;color:var(--text-muted);">Đang kết nối API...</p>
        </td></tr>`;
        try {
            const data = await window.CuuTroApi.requestJson('/api/YeuCauCuuTro');
            cache = Array.isArray(data) ? data : [];
            renderTable(cache);
            updateStats(cache);
        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:#dc2626;">
                Không tải được dữ liệu. ${escapeHtml(err.message || '')}
            </td></tr>`;
        }
    };

    tableBody.addEventListener('click', async (e) => {
        const btn = e.target?.closest?.('button[data-action]');
        if (!btn) return;
        const tr = btn.closest('tr[data-id]');
        const id = tr?.getAttribute('data-id') || '';
        if (!id) return;
        const action = btn.getAttribute('data-action');

        if (action === 'approve') {
            if (!confirm(`Duyệt yêu cầu "${id}"?`)) return;
            try {
                await window.CuuTroApi.requestJson(`/api/YeuCauCuuTro/${encodeURIComponent(id)}/trang-thai`, {
                    method: 'PATCH', body: JSON.stringify({ TrangThai: 'Đã duyệt' })
                });
                await loadRecipients();
            } catch (err) { alert(`Lỗi: ${err.message}`); }
        }

        if (action === 'reject') {
            if (!confirm(`Từ chối yêu cầu "${id}"?`)) return;
            try {
                await window.CuuTroApi.requestJson(`/api/YeuCauCuuTro/${encodeURIComponent(id)}/trang-thai`, {
                    method: 'PATCH', body: JSON.stringify({ TrangThai: 'Đã từ chối' })
                });
                await loadRecipients();
            } catch (err) { alert(`Lỗi: ${err.message}`); }
        }

        if (action === 'delete') {
            if (!confirm(`Xóa yêu cầu "${id}"?`)) return;
            try {
                await window.CuuTroApi.requestJson(`/api/YeuCauCuuTro/${encodeURIComponent(id)}`, { method: 'DELETE' });
                await loadRecipients();
            } catch (err) { alert(`Lỗi xóa: ${err.message}`); }
        }
    });

    loadRecipients();
});
