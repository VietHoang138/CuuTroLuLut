document.addEventListener('DOMContentLoaded', () => {

    // Mock Data for Shipments Arriving at Village
    let shipmentsData = [
        {
            id: 'CH-8821',
            source: 'Kho Trung Tâm Đà Nẵng',
            time: '14:30 - Hôm nay',
            driver: { name: 'Nguyễn Văn Tâm', phone: '0988.666.555', plate: '29C-333.44' },
            items: [
                { name: 'Lương khô', qty: '50 Thùng' },
                { name: 'Nước sạch Aquafina', qty: '100 Bình 20L' }
            ],
            status: 'incoming',
            otp: '686822'
        },
        {
            id: 'CH-8825',
            source: 'Hội Chữ Thập Đỏ Tỉnh',
            time: '16:00 - Hôm nay',
            driver: { name: 'Trần Văn Mạnh', phone: '0912.345.678', plate: '43C-999.88' },
            items: [
                { name: 'Áo phao', qty: '200 Cái' },
                { name: 'Đèn pin', qty: '100 Cái' },
                { name: 'Bột lọc nước', qty: '50 Gói' }
            ],
            status: 'incoming',
            otp: '123456'
        },
        {
            id: 'CH-8810',
            source: 'Kho Trung Tâm Hà Nội',
            time: '09:00 - Sáng nay',
            driver: { name: 'Lê Hoàng', phone: '0905.111.222', plate: '29C-111.11' },
            items: [
                { name: 'Gạo tẻ', qty: '2 Tấn' }
            ],
            status: 'received',
            otp: '000000'
        }
    ];

    const tbody = document.querySelector('#shipments-table tbody');
    const searchInput = document.getElementById('shipment-search');
    let currentProcessingId = null;

    function renderTable(data) {
        tbody.innerHTML = '';
        if(data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;">Không tìm thấy chuyến xe nào.</td></tr>`;
            return;
        }

        data.forEach(item => {
            const isIncoming = item.status === 'incoming';
            const statusClass = isIncoming ? 'badge-incoming' : 'badge-received';
            const statusText = isIncoming ? 'Đang Đến' : 'Đã Nhận';
            const icon = isIncoming ? 'fa-truck-fast' : 'fa-check';
            
            // Format items string for table view
            const itemsStr = item.items.map(i => i.name).join(', ');
            const displayItems = itemsStr.length > 30 ? itemsStr.substring(0, 30) + '...' : itemsStr;

            const actionBtn = isIncoming 
                ? `<button class="btn btn-sm btn-action" onclick="openConfirmModal('${item.id}')">Xác Nhận Nhận Hàng</button>`
                : `<button class="btn btn-sm" style="background: #e2e8f0; color: #64748b; border: none; cursor: default;">Đã Hoàn Tất</button>`;

            tbody.innerHTML += `
                <tr>
                    <td style="font-weight: 700; color: var(--primary-color);">${item.id}</td>
                    <td>${item.source}</td>
                    <td>
                        <div style="font-weight: 600;">${item.driver.name}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-solid fa-truck"></i> ${item.driver.plate}</div>
                    </td>
                    <td style="color: var(--accent-orange); font-weight: 600;">${item.time}</td>
                    <td title="${itemsStr}">${displayItems}</td>
                    <td>
                        <span class="status-badge ${statusClass}"><i class="fa-solid ${icon}"></i> ${statusText}</span>
                    </td>
                    <td>${actionBtn}</td>
                </tr>
            `;
        });
    }

    // Initial render
    setTimeout(() => {
        renderTable(shipmentsData);
    }, 500);

    // Search
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = shipmentsData.filter(i => 
            i.id.toLowerCase().includes(term) || 
            i.driver.name.toLowerCase().includes(term) ||
            i.driver.plate.toLowerCase().includes(term)
        );
        renderTable(filtered);
    });

    // -------------------------
    // Confirm Receipt Modal Logic
    // -------------------------
    window.openConfirmModal = function(id) {
        currentProcessingId = id;
        const record = shipmentsData.find(r => r.id === id);
        
        // Populate driver info
        document.getElementById('modal-driver-name').innerText = record.driver.name;
        document.getElementById('modal-driver-phone').innerText = record.driver.phone;
        document.getElementById('modal-driver-plate').innerText = record.driver.plate;
        document.getElementById('modal-otp-code').innerText = record.otp;
        
        // Reset checkbox
        const verifyCheck = document.getElementById('verify-driver-receipt');
        verifyCheck.checked = false;
        
        // Populate items checklist
        const ul = document.getElementById('modal-goods-list');
        ul.innerHTML = '';
        record.items.forEach((item, index) => {
            ul.innerHTML += `
                <li class="check-item">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <input type="checkbox" class="custom-checkbox item-checker" id="receipt-item-${index}">
                        <label for="receipt-item-${index}" class="item-name">${item.name}</label>
                    </div>
                    <span class="item-qty">${item.qty}</span>
                </li>
            `;
        });

        // Add listeners to new checkboxes to enable/disable submit button
        const allCheckboxes = document.querySelectorAll('.item-checker, #verify-driver-receipt');
        allCheckboxes.forEach(cb => {
            cb.addEventListener('change', checkFormValidity);
        });
        
        // Add style toggle for check-items
        document.querySelectorAll('.item-checker').forEach(cb => {
            cb.addEventListener('change', (e) => {
                if(e.target.checked) {
                    e.target.closest('.check-item').classList.add('checked');
                } else {
                    e.target.closest('.check-item').classList.remove('checked');
                }
            });
        });

        checkFormValidity(); // Initial check

        const modal = document.getElementById('confirm-receipt-modal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
        }, 10);
    };

    function checkFormValidity() {
        const verifyDriver = document.getElementById('verify-driver-receipt').checked;
        const itemCheckers = document.querySelectorAll('.item-checker');
        let allItemsChecked = true;
        
        itemCheckers.forEach(cb => {
            if(!cb.checked) allItemsChecked = false;
        });

        const btnSubmit = document.getElementById('btn-confirm-receipt');
        // Require driver verification and all items checked to confirm full receipt
        if(verifyDriver && allItemsChecked && itemCheckers.length > 0) {
            btnSubmit.disabled = false;
        } else {
            btnSubmit.disabled = true;
        }
    }

    window.closeConfirmModal = function() {
        const modal = document.getElementById('confirm-receipt-modal');
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.95)';
        setTimeout(() => {
            modal.style.display = 'none';
            currentProcessingId = null;
        }, 300);
    };

    document.getElementById('btn-confirm-receipt').addEventListener('click', () => {
        if(currentProcessingId) {
            // Update mock data
            const index = shipmentsData.findIndex(i => i.id === currentProcessingId);
            if(index > -1) {
                shipmentsData[index].status = 'received';
            }
            
            alert('Bàn giao thành công! Hàng hóa đã được tiếp nhận vào kho của thôn.\nTài xế sẽ dùng mã xác nhận để hoàn tất chuyến đi trên hệ thống của họ.');
            closeConfirmModal();
            renderTable(shipmentsData);
        }
    });
});
