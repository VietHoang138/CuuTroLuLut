document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('history-table-body');
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

    const statusBadge = (trangThai) => {
        const s = `${trangThai || ''}`;
        if (s.includes('tiếp nhận') || s.includes('Tiếp nhận')) {
            return `<span class="status-badge status-active">${escapeHtml(s)}</span>`;
        }
        if (s.includes('Chờ') || s.includes('chờ')) {
            return `<span class="status-badge status-pending">${escapeHtml(s)}</span>`;
        }
        return `<span class="status-badge">${escapeHtml(s)}</span>`;
    };

    // Lấy userId từ localStorage (lưu khi đăng nhập)
    const userId = localStorage.getItem('userId') || '';

    const loadHistory = async () => {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding:2.5rem;">
                    <div style="display:inline-block; width:32px; height:32px; border:4px solid #e2e8f0; border-top-color:var(--accent-orange); border-radius:50%; animation:spin 1s linear infinite;"></div>
                    <p style="margin-top:0.75rem; color:var(--text-muted);">Đang tải lịch sử...</p>
                </td>
            </tr>`;

        if (!userId) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
                        Vui lòng <a href="login.html">đăng nhập</a> để xem lịch sử đóng góp.
                    </td>
                </tr>`;
            return;
        }

        try {
            const data = await window.CuuTroApi.requestJson(`/api/UngHo/by-user/${encodeURIComponent(userId)}`);
            const list = Array.isArray(data) ? data : [];

            if (!list.length) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
                            Bạn chưa có lịch sử đóng góp nào.
                        </td>
                    </tr>`;
                return;
            }

            tableBody.innerHTML = list.map(h => {
                const maUH = getAny(h, ['maUngHo', 'MaUngHo']);
                const tenDot = getAny(h, ['tenDot', 'TenDot']);
                const ngay = getAny(h, ['ngayUngHo', 'NgayUngHo']);
                const noiDung = getAny(h, ['noiDung', 'NoiDung'], '—');
                const trangThai = getAny(h, ['trangThai', 'TrangThai']);

                return `
                    <tr>
                        <td><strong>${escapeHtml(maUH)}</strong></td>
                        <td>${escapeHtml(tenDot)}</td>
                        <td>${escapeHtml(ngay)}</td>
                        <td>${escapeHtml(noiDung)}</td>
                        <td>${statusBadge(trangThai)}</td>
                    </tr>`;
            }).join('');

        } catch (error) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:2.5rem; color:#dc2626;">
                        Không tải được lịch sử. ${escapeHtml(error.message || '')}
                    </td>
                </tr>`;
        }
    };

    // Hiển thị tên user trên header
    const displayUserName = document.getElementById('display-user-name');
    if (displayUserName) {
        displayUserName.textContent = localStorage.getItem('userName') || 'Người dùng';
    }

    loadHistory();
});
