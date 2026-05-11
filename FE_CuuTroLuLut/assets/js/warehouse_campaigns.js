document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('campaigns-list');
    const searchInput = document.getElementById('campaign-search');
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (!grid) return;

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

    const headerGradient = (tt) => {
        if (tt === 'Đang vận động') return 'linear-gradient(135deg,#0f172a,#1e3a8a)';
        if (tt === 'Đang phân bổ') return 'linear-gradient(135deg,#1e293b,#0f766e)';
        return 'linear-gradient(135deg,#334155,#475569)';
    };

    const statusLabel = (tt) => {
        if (tt === 'Đang vận động') return { cls: 'status-active', label: 'Đang diễn ra' };
        if (tt === 'Đang phân bổ') return { cls: 'status-upcoming', label: 'Đang phân bổ' };
        return { cls: '', label: tt, style: 'background:rgba(100,116,139,0.85);' };
    };

    let allCampaigns = [];
    let currentFilter = 'all';

    const renderCards = (list) => {
        if (!list.length) {
            grid.innerHTML = `<div class="loading-state"><i class="fa-solid fa-box-open" style="color:#94a3b8;"></i><p>Không có đợt cứu trợ nào.</p></div>`;
            return;
        }

        grid.innerHTML = list.map(c => {
            const maDot = getAny(c, ['maDot', 'MaDot']);
            const tenDot = getAny(c, ['tenDot', 'TenDot']);
            const moTa = getAny(c, ['moTa', 'MoTa'], 'Chiến dịch cứu trợ đang cần hỗ trợ kho vận.');
            const ngayBatDau = getAny(c, ['ngayBatDau', 'NgayBatDau']);
            const ngayKetThuc = getAny(c, ['ngayKetThuc', 'NgayKetThuc']);
            const trangThai = getAny(c, ['trangThai', 'TrangThai']);
            const hinhAnh = getAny(c, ['hinhAnh', 'HinhAnh']);
            const { cls, label, style = '' } = statusLabel(trangThai);
            const isEnded = trangThai === 'Đã kết thúc';

            const headerHtml = hinhAnh
                ? `<div class="camp-header" style="position:relative;">
                       <img src="${escapeHtml(hinhAnh)}" alt="" class="camp-image"
                            onerror="this.parentElement.style.background='${headerGradient(trangThai)}';this.remove();" />
                   </div>`
                : `<div class="camp-header" style="background:${headerGradient(trangThai)};display:flex;align-items:center;justify-content:center;">
                       <i class="fa-solid fa-pallet" style="font-size:4rem;color:rgba(255,255,255,0.2);"></i>
                   </div>`;

            return `
            <div class="camp-card" style="${isEnded ? 'opacity:0.7;' : ''}position:relative;">
                ${headerHtml}
                <span class="camp-status ${cls}" style="position:absolute;top:1rem;right:1rem;${style}">${escapeHtml(label)}</span>
                <div class="camp-body">
                    <h3 class="camp-title">${escapeHtml(tenDot)}</h3>
                    <p class="camp-desc">${escapeHtml(moTa)}</p>
                    <div class="camp-meta">
                        <div class="meta-item">
                            <i class="fa-regular fa-calendar"></i>
                            <span>Bắt đầu: <strong>${escapeHtml(ngayBatDau) || '—'}</strong></span>
                        </div>
                        <div class="meta-item">
                            <i class="fa-regular fa-calendar-xmark"></i>
                            <span>Kết thúc: <strong>${escapeHtml(ngayKetThuc) || '—'}</strong></span>
                        </div>
                    </div>
                    ${!isEnded ? `
                    <div class="camp-action">
                        <a href="warehouse_import.html?dot=${encodeURIComponent(maDot)}" class="btn-import">
                            <i class="fa-solid fa-truck-arrow-right"></i> Nhập Hàng
                        </a>
                        <a href="warehouse_export.html?dot=${encodeURIComponent(maDot)}" class="btn-export">
                            <i class="fa-solid fa-truck-fast"></i> Xuất Hàng
                        </a>
                    </div>` : `
                    <div class="camp-action">
                        <span style="flex:1;text-align:center;padding:0.85rem;background:#f1f5f9;color:#94a3b8;border-radius:8px;font-weight:600;">Đã kết thúc</span>
                    </div>`}
                </div>
            </div>`;
        }).join('');
    };

    const applyFilter = () => {
        const kw = (searchInput?.value || '').toLowerCase().trim();
        let filtered = allCampaigns;
        if (currentFilter === 'active') filtered = filtered.filter(c => getAny(c, ['trangThai', 'TrangThai']) === 'Đang vận động');
        else if (currentFilter === 'upcoming') filtered = filtered.filter(c => getAny(c, ['trangThai', 'TrangThai']) === 'Đang phân bổ');
        if (kw) filtered = filtered.filter(c =>
            getAny(c, ['tenDot', 'TenDot']).toLowerCase().includes(kw) ||
            getAny(c, ['moTa', 'MoTa']).toLowerCase().includes(kw)
        );
        renderCards(filtered);
    };

    const loadCampaigns = async () => {
        grid.innerHTML = `<div class="loading-state"><i class="fa-solid fa-circle-notch fa-spin"></i><p>Đang tải dữ liệu...</p></div>`;
        try {
            const data = await window.CuuTroApi.requestJson('/api/DotCuuTro');
            allCampaigns = Array.isArray(data) ? data : [];
            applyFilter();
        } catch (err) {
            grid.innerHTML = `<div class="loading-state"><i class="fa-solid fa-triangle-exclamation" style="color:#dc2626;"></i><p style="color:#dc2626;">Không tải được dữ liệu. ${escapeHtml(err.message || '')}</p></div>`;
        }
    };

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter') || 'all';
            applyFilter();
        });
    });

    searchInput?.addEventListener('input', applyFilter);

    const displayUserName = document.getElementById('display-user-name');
    if (displayUserName) {
        const name = localStorage.getItem('userName');
        if (name) displayUserName.textContent = name;
    }

    loadCampaigns();
});
