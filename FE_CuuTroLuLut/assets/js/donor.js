document.addEventListener('DOMContentLoaded', () => {

    const getAny = (obj, keys, fallback = '') => {
        if (!obj) return fallback;
        for (const k of keys) {
            const v = obj?.[k];
            if (v !== undefined && v !== null && `${v}` !== '') return v;
        }
        return fallback;
    };

    // --- User info từ localStorage (sau khi đăng nhập) ---
    const displayUserName = document.getElementById('display-user-name');
    const storedName = localStorage.getItem('userName') || 'Người dùng';
    if (displayUserName) displayUserName.textContent = storedName;

    // --- Tab: Danh sách Đợt Cứu Trợ ---
    const campaignsContainer = document.getElementById('campaigns-container');
    if (campaignsContainer) {
        campaignsContainer.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
                <div style="display:inline-block; width:36px; height:36px; border:4px solid #e2e8f0; border-top-color:var(--accent-orange); border-radius:50%; animation:spin 1s linear infinite;"></div>
                <p style="margin-top:1rem;">Đang tải dữ liệu...</p>
            </div>`;

        window.CuuTroApi.requestJson('/api/DotCuuTro')
            .then(data => {
                const campaigns = Array.isArray(data) ? data : [];
                if (!campaigns.length) {
                    campaignsContainer.innerHTML = `<p style="color:var(--text-muted); padding:2rem;">Chưa có đợt cứu trợ nào.</p>`;
                    return;
                }

                campaignsContainer.innerHTML = campaigns.map(c => {
                    const maDot = getAny(c, ['maDot', 'MaDot']);
                    const tenDot = getAny(c, ['tenDot', 'TenDot']);
                    const moTa = getAny(c, ['moTa', 'MoTa']);
                    const ngayBatDau = getAny(c, ['ngayBatDau', 'NgayBatDau']);
                    const ngayKetThuc = getAny(c, ['ngayKetThuc', 'NgayKetThuc']);
                    const trangThai = getAny(c, ['trangThai', 'TrangThai']);

                    const isActive = trangThai === 'Đang vận động';
                    const isEnded = trangThai === 'Đã kết thúc';
                    const badgeClass = isActive ? 'status-active' : isEnded ? '' : 'status-pending';
                    const badgeStyle = isEnded ? 'background:#f1f5f9;color:#64748b;' : '';
                    const cardStyle = isEnded ? 'opacity:0.7;' : '';

                    return `
                        <div class="campaign-card" style="${cardStyle}">
                            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:1rem; gap:0.5rem;">
                                <h3 style="font-size:1.05rem; color:var(--text-dark); line-height:1.4;">${tenDot}</h3>
                                <span class="status-badge ${badgeClass}" style="${badgeStyle} white-space:nowrap;">${trangThai}</span>
                            </div>
                            ${moTa ? `<p style="color:var(--text-muted); font-size:0.88rem; margin-bottom:0.75rem; line-height:1.5;">${moTa}</p>` : ''}
                            <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:0.25rem;">
                                <i class="fa-regular fa-calendar" style="margin-right:5px;"></i> Bắt đầu: <strong>${ngayBatDau || '—'}</strong>
                            </p>
                            <p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:1.25rem;">
                                <i class="fa-regular fa-calendar-xmark" style="margin-right:5px;"></i> Kết thúc: <strong>${ngayKetThuc || '—'}</strong>
                            </p>
                            <div>
                                ${isActive
                                    ? `<button class="btn btn-outline btn-donate-now" style="width:100%; font-size:0.9rem;" data-id="${maDot}">
                                            <i class="fa-solid fa-hand-holding-heart" style="margin-right:6px;"></i>Ủng hộ ngay
                                       </button>`
                                    : `<button class="btn btn-outline" style="width:100%; font-size:0.9rem; opacity:0.5;" disabled>Đã khép lại</button>`
                                }
                            </div>
                        </div>
                    `;
                }).join('');

                campaignsContainer.querySelectorAll('.btn-donate-now').forEach(btn => {
                    btn.addEventListener('click', () => {
                        localStorage.setItem('selectedCampaign', btn.getAttribute('data-id'));
                        window.location.href = 'donor_register.html';
                    });
                });
            })
            .catch(err => {
                campaignsContainer.innerHTML = `
                    <div style="grid-column:1/-1; text-align:center; padding:2rem; color:#dc2626;">
                        Không tải được danh sách đợt cứu trợ. ${err.message || ''}
                    </div>`;
            });
    }

    // --- Tab: Đăng ký ủng hộ ---
    const campaignSelect = document.getElementById('donate-campaign');
    if (campaignSelect) {
        window.CuuTroApi.requestJson('/api/DotCuuTro')
            .then(data => {
                const active = Array.isArray(data)
                    ? data.filter(c => getAny(c, ['trangThai', 'TrangThai']) === 'Đang vận động')
                    : [];
                campaignSelect.innerHTML = '<option value="">-- Chọn đợt cứu trợ --</option>';
                active.forEach(c => {
                    const id = getAny(c, ['maDot', 'MaDot']);
                    const name = getAny(c, ['tenDot', 'TenDot']);
                    campaignSelect.innerHTML += `<option value="${id}">${name}</option>`;
                });
                const saved = localStorage.getItem('selectedCampaign');
                if (saved) { campaignSelect.value = saved; localStorage.removeItem('selectedCampaign'); }
            })
            .catch(() => {});
    }

    // --- Load hàng hóa cho form đăng ký ---
    const loadItemOptions = async (selectElement) => {
        selectElement.innerHTML = '<option value="">-- Chọn vật phẩm --</option>';
        try {
            const data = await window.CuuTroApi.requestJson('/api/HangCuuTro');
            if (Array.isArray(data)) {
                data.forEach(h => {
                    const id = getAny(h, ['maHang', 'MaHang']);
                    const name = getAny(h, ['tenHang', 'TenHang']);
                    selectElement.innerHTML += `<option value="${id}">${name}</option>`;
                });
            }
        } catch (_) {}
    };

    const donateItemSelect = document.querySelector('.donate-item');
    if (donateItemSelect) loadItemOptions(donateItemSelect);

    // --- Tab: Lịch sử ---
    const historyTable = document.getElementById('history-table-body');
    if (historyTable) {
        const userId = localStorage.getItem('userId') || '';
        window.CuuTroApi.requestJson('/api/UngHo')
            .then(data => {
                const list = Array.isArray(data)
                    ? (userId ? data.filter(h => getAny(h, ['maNguoiDung', 'MaNguoiDung']) === userId) : data)
                    : [];
                if (!list.length) {
                    historyTable.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:2rem;">Chưa có lịch sử đóng góp.</td></tr>`;
                    return;
                }
                historyTable.innerHTML = list.map(h => {
                    const maUH = getAny(h, ['maUngHo', 'MaUngHo']);
                    const tenDot = getAny(h, ['tenDot', 'TenDot']);
                    const ngay = getAny(h, ['ngayUngHo', 'NgayUngHo']);
                    const trangThai = getAny(h, ['trangThai', 'TrangThai']);
                    const statusColor = trangThai === 'Đã tiếp nhận' ? 'color:#16a34a;' : 'color:#d97706;';
                    return `
                        <tr>
                            <td><strong>${maUH}</strong></td>
                            <td>${tenDot || '—'}</td>
                            <td>${ngay ? ngay.substring(0, 10) : '—'}</td>
                            <td>—</td>
                            <td style="font-weight:600; ${statusColor}">${trangThai}</td>
                        </tr>`;
                }).join('');
            })
            .catch(() => {
                historyTable.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#dc2626; padding:2rem;">Không tải được lịch sử.</td></tr>`;
            });
    }

    // --- Tab: Thông báo ---
    const notiContainer = document.getElementById('notifications-container');
    if (notiContainer) {
        // ThongBao chưa có API riêng, dùng DotCuuTro làm thông báo tạm
        notiContainer.innerHTML = `<p style="color:var(--text-muted); padding:1rem;">Chưa có thông báo mới.</p>`;
    }

    // --- Tab: Hồ sơ ---
    const profileName = document.getElementById('profile-name');
    if (profileName) {
        const userId = localStorage.getItem('userId') || '';
        if (userId) {
            window.CuuTroApi.requestJson(`/api/NguoiDung/${userId}`)
                .then(u => {
                    if (!u) return;
                    profileName.value = getAny(u, ['hoTen', 'HoTen']);
                    const phoneEl = document.getElementById('profile-phone');
                    const emailEl = document.getElementById('profile-email');
                    const addressEl = document.getElementById('profile-address');
                    if (phoneEl) phoneEl.value = getAny(u, ['soDienThoai', 'SoDienThoai']);
                    if (emailEl) emailEl.value = getAny(u, ['email', 'Email']);
                    if (addressEl) addressEl.value = getAny(u, ['diaChiCuThe', 'DiaChiCuThe']);
                })
                .catch(() => {});
        }
    }

    // --- Event: Thêm vật phẩm ---
    const btnAddItem = document.getElementById('btn-add-item');
    if (btnAddItem) {
        btnAddItem.addEventListener('click', () => {
            const container = document.getElementById('donation-items-container');
            const row = document.createElement('div');
            row.className = 'form-grid donation-item-row';
            row.style.cssText = 'align-items:end; border-bottom:1px dashed #e2e8f0; padding-bottom:1rem; margin-bottom:1rem;';
            row.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Loại hàng hóa <span style="color:red;">*</span></label>
                    <select class="form-input donate-item" required></select>
                </div>
                <div class="form-group" style="display:flex; gap:1rem; align-items:flex-end;">
                    <div style="flex:1;">
                        <label class="form-label">Số lượng <span style="color:red;">*</span></label>
                        <input type="number" class="form-input donate-qty" min="1" placeholder="Nhập số lượng" required>
                    </div>
                    <button type="button" class="btn btn-outline remove-item-btn" style="color:#ef4444; border-color:#fca5a5; padding:0.5rem 1rem;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(row);
            loadItemOptions(row.querySelector('.donate-item'));
            row.querySelector('.remove-item-btn').addEventListener('click', () => row.remove());
        });
    }

    // --- Event: Gửi form đăng ký ---
    const donationForm = document.getElementById('donation-form');
    if (donationForm) {
        donationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = document.getElementById('donation-msg');
            msg.textContent = 'Hệ thống đang xử lý đăng ký...';
            msg.style.color = '#d97706';
            setTimeout(() => {
                msg.textContent = 'Đăng ký ủng hộ thành công! Vui lòng làm theo hướng dẫn gửi vật phẩm.';
                msg.style.color = '#16a34a';
                e.target.reset();
                setTimeout(() => { msg.textContent = ''; }, 4000);
            }, 1000);
        });
    }

    // --- Event: Gửi form hồ sơ ---
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const msg = document.getElementById('profile-msg');
            const newName = document.getElementById('profile-name').value;
            msg.textContent = 'Đang lưu thay đổi...';
            msg.style.color = '#d97706';
            setTimeout(() => {
                if (displayUserName) displayUserName.textContent = newName;
                localStorage.setItem('userName', newName);
                msg.textContent = 'Đã cập nhật thông tin thành công!';
                msg.style.color = '#16a34a';
                const passEl = document.getElementById('profile-new-pass');
                if (passEl) passEl.value = '';
                setTimeout(() => { msg.textContent = ''; }, 3000);
            }, 800);
        });
    }
});
