document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const submitBtn = document.getElementById('register-submit');
    const messageEl = document.getElementById('register-message');
    const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));

    if (!form) return;

    const getAny = (obj, keys, fallback = '') => {
        if (!obj) return fallback;
        for (const k of keys) {
            const v = obj?.[k];
            if (v !== undefined && v !== null && `${v}` !== '') return v;
        }
        return fallback;
    };

    // --- Elements ---
    const emailGroup = document.getElementById('email-group');
    const emailInput = document.getElementById('email');
    const locationSection = document.getElementById('location-section');
    const basicAddressGroup = document.getElementById('basic-address-group');
    const basicAddressInput = document.getElementById('basic-address');
    const provinceSelect = document.getElementById('province');
    const wardSelect = document.getElementById('ward');
    const villageSelect = document.getElementById('village');
    const addressDetailInput = document.getElementById('address-detail');

    // --- Role mapping ---
    const roleByTab = {
        'Người Ủng Hộ': 'VT05',
        'Người Nhận': 'VT03',
        'Tình Nguyện Viên': 'VT04'
    };

    const currentRole = () => {
        const active = tabBtns.find(b => b.classList.contains('active'));
        return roleByTab[active?.textContent?.trim()] || 'VT05';
    };

    // --- Load Tỉnh/Thành từ API ---
    const loadProvinces = async () => {
        try {
            const data = await window.CuuTroApi.requestJson('/api/TinhThanhPho');
            provinceSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành phố</option>';
            (Array.isArray(data) ? data : []).forEach(p => {
                const id = getAny(p, ['MaTinhThanhPho', 'maTinhThanhPho']);
                const name = getAny(p, ['TenTinhThanhPho', 'tenTinhThanhPho']);
                provinceSelect.innerHTML += `<option value="${id}">${name}</option>`;
            });
        } catch (_) {
            provinceSelect.innerHTML = '<option value="">Không tải được dữ liệu</option>';
        }
    };

    // --- Khi chọn Tỉnh → load Phường/Xã ---
    provinceSelect?.addEventListener('change', async (e) => {
        const maTinh = e.target.value;
        wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
        villageSelect.innerHTML = '<option value="">Chọn Thôn/Tổ Dân Phố</option>';
        villageSelect.disabled = true;

        if (!maTinh) { wardSelect.disabled = true; return; }

        try {
            const data = await window.CuuTroApi.requestJson(`/api/PhuongXa?maTinh=${encodeURIComponent(maTinh)}`);
            (Array.isArray(data) ? data : []).forEach(w => {
                const id = getAny(w, ['MaPhuongXa', 'maPhuongXa']);
                const name = getAny(w, ['TenPhuongXa', 'tenPhuongXa']);
                wardSelect.innerHTML += `<option value="${id}">${name}</option>`;
            });
            wardSelect.disabled = false;
        } catch (_) {
            wardSelect.disabled = true;
        }
    });

    // --- Khi chọn Phường/Xã → load Thôn ---
    wardSelect?.addEventListener('change', async (e) => {
        const maPX = e.target.value;
        villageSelect.innerHTML = '<option value="">Chọn Thôn/Tổ Dân Phố</option>';

        if (!maPX) { villageSelect.disabled = true; return; }

        try {
            const data = await window.CuuTroApi.requestJson(`/api/ThonToDanPho?maPhuongXa=${encodeURIComponent(maPX)}`);
            (Array.isArray(data) ? data : []).forEach(v => {
                const id = getAny(v, ['MaThonToDanPho', 'maThonToDanPho']);
                const name = getAny(v, ['TenThonToDanPho', 'tenThonToDanPho']);
                villageSelect.innerHTML += `<option value="${id}">${name}</option>`;
            });
            villageSelect.disabled = false;
        } catch (_) {
            villageSelect.disabled = true;
        }
    });

    loadProvinces();

    // --- Tab switch ---
    const updateFormUI = () => {
        const roleName = tabBtns.find(b => b.classList.contains('active'))?.textContent?.trim();

        if (roleName === 'Người Ủng Hộ') {
            emailGroup.style.display = 'block';
            emailInput.required = true;
            locationSection.style.display = 'none';
            [provinceSelect, wardSelect, villageSelect, addressDetailInput].forEach(el => { if (el) el.required = false; });
            basicAddressGroup.style.display = 'block';
        } else if (roleName === 'Người Nhận') {
            emailGroup.style.display = 'none';
            emailInput.required = false;
            emailInput.value = '';
            locationSection.style.display = 'block';
            [provinceSelect, wardSelect, villageSelect, addressDetailInput].forEach(el => { if (el) el.required = true; });
            basicAddressGroup.style.display = 'none';
        } else {
            // Tình Nguyện Viên
            emailGroup.style.display = 'block';
            emailInput.required = true;
            locationSection.style.display = 'block';
            [provinceSelect, wardSelect, villageSelect, addressDetailInput].forEach(el => { if (el) el.required = true; });
            basicAddressGroup.style.display = 'none';
        }
    };

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateFormUI();
        });
    });

    updateFormUI();

    // --- Submit ---
    const setMessage = (text, isError = false) => {
        messageEl.textContent = text;
        messageEl.style.color = isError ? '#dc2626' : '#16a34a';
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setMessage('');

        const hoTen = document.getElementById('full-name').value.trim();
        const soDienThoai = document.getElementById('phone').value.trim();
        const matKhau = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const roleName = tabBtns.find(b => b.classList.contains('active'))?.textContent?.trim();

        if (matKhau !== confirmPassword) {
            setMessage('Mật khẩu xác nhận không khớp.', true);
            return;
        }

        let email = null;
        let diaChiCuThe = '';
        let maThonToDanPho = null;

        if (roleName === 'Người Ủng Hộ') {
            email = emailInput.value.trim() || null;
            diaChiCuThe = basicAddressInput?.value.trim() || '';
        } else {
            if (roleName === 'Tình Nguyện Viên') email = emailInput.value.trim() || null;
            diaChiCuThe = addressDetailInput?.value.trim() || '';
            maThonToDanPho = villageSelect?.value || null;
        }

        const payload = {
            HoTen: hoTen,
            Email: email,
            SoDienThoai: soDienThoai,
            MatKhau: matKhau,
            DiaChiCuThe: diaChiCuThe,
            MaThonToDanPho: maThonToDanPho,
            MaVaiTro: currentRole()
        };

        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang xử lý...';

        try {
            await window.CuuTroApi.requestJson('/api/NguoiDung', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            setMessage('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
            form.reset();
            updateFormUI();
        } catch (error) {
            setMessage(`Đăng ký thất bại: ${error.message || 'Lỗi không xác định.'}`, true);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Đăng Ký';
        }
    });

    // --- Password toggle ---
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function () {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
});
