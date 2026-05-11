document.addEventListener('DOMContentLoaded', () => {

    // Mock Data for Export Shipments
    let exportData = [
        {
            id: 'PX-2024-101',
            time: '15:00 - Hôm nay',
            destination: 'UBND Xã Nậm Lúc, Bắc Hà, Lào Cai',
            driver: { name: 'Tài xế Hoàng', phone: '0905.777.888', plate: '43C-987.65' },
            items: [
                { name: 'Gạo tẻ', qty: '200 Bao (1 Tấn)' },
                { name: 'Nước lọc Aquafina', qty: '100 Lốc' },
                { name: 'Thuốc men y tế', qty: '5 Thùng' }
            ],
            status: 'Chờ Tài Xế Đến'
        },
        {
            id: 'PX-2024-102',
            time: '16:30 - Hôm nay',
            destination: 'Nhà thi đấu tỉnh Thái Nguyên',
            driver: { name: 'Tài xế Minh', phone: '0935.123.456', plate: '43C-111.22' },
            items: [
                { name: 'Áo phao', qty: '300 Cái' },
                { name: 'Đèn pin siêu sáng', qty: '100 Cái' },
                { name: 'Mì tôm', qty: '50 Thùng' }
            ],
            status: 'Chờ Tài Xế Đến'
        },
        {
            id: 'PX-2024-099',
            time: '08:00 - Sáng nay',
            destination: 'UBND Xã Phúc Khánh, Bảo Yên',
            driver: { name: 'Nguyễn Văn Tâm', phone: '0988.666.555', plate: '29C-333.44' },
            items: [
                { name: 'Lương khô', qty: '50 Thùng' },
                { name: 'Nước sạch', qty: '100 Bình 20L' }
            ],
            status: 'Đã Xuất Kho'
        }
    ];

    const tbody = document.querySelector('#exports-table tbody');
    const searchInput = document.getElementById('export-search');
    let currentProcessingId = null;

    function renderTable(data) {
        tbody.innerHTML = '';
        if(data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;">Không tìm thấy phiếu xuất nào.</td></tr>`;
            return;
        }

        data.forEach(item => {
            const isPending = item.status === 'Chờ Tài Xế Đến';
            const statusClass = isPending ? 'badge-pending' : 'badge-completed';
            const icon = isPending ? 'fa-clock' : 'fa-truck-fast';
            
            // Format items string for table view
            const itemsStr = item.items.map(i => i.name).join(', ');
            const displayItems = itemsStr.length > 30 ? itemsStr.substring(0, 30) + '...' : itemsStr;

            const actionBtn = isPending 
                ? `<button class="btn btn-sm btn-action" onclick="openConfirmModal('${item.id}')">Xuất Hàng</button>`
                : `<button class="btn btn-sm" style="background: #e2e8f0; color: #64748b; border: none; cursor: default;">Hoàn Tất</button>`;

            tbody.innerHTML += `
                <tr>
                    <td style="font-weight: 700; color: var(--accent-orange);">${item.id}</td>
                    <td>${item.time}</td>
                    <td style="font-weight: 600;">${item.destination}</td>
                    <td>
                        <div style="font-weight: 600;">${item.driver.name}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-solid fa-truck"></i> ${item.driver.plate}</div>
                    </td>
                    <td title="${itemsStr}">${displayItems}</td>
                    <td>
                        <span class="status-badge ${statusClass}"><i class="fa-solid ${icon}"></i> ${item.status}</span>
                    </td>
                    <td>${actionBtn}</td>
                </tr>
            `;
        });
    }

    // Initial render
    setTimeout(() => {
        renderTable(exportData);
    }, 500);

    // Search
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = exportData.filter(i => 
            i.id.toLowerCase().includes(term) || 
            i.driver.name.toLowerCase().includes(term) ||
            i.destination.toLowerCase().includes(term)
        );
        renderTable(filtered);
    });

    // -------------------------
    // Confirm Export Modal Logic
    // -------------------------
    window.openConfirmModal = function(id) {
        currentProcessingId = id;
        const record = exportData.find(r => r.id === id);
        
        // Populate driver info
        document.getElementById('modal-driver-name').innerText = record.driver.name;
        document.getElementById('modal-driver-phone').innerText = record.driver.phone;
        document.getElementById('modal-driver-plate').innerText = record.driver.plate;
        
        // Reset checkbox
        const verifyCheck = document.getElementById('verify-driver-export');
        verifyCheck.checked = false;
        
        // Populate items checklist
        const ul = document.getElementById('modal-goods-list');
        ul.innerHTML = '';
        record.items.forEach((item, index) => {
            ul.innerHTML += `
                <li class="check-item">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <input type="checkbox" class="custom-checkbox item-checker" id="export-item-${index}">
                        <label for="export-item-${index}" class="item-name">${item.name}</label>
                    </div>
                    <span class="item-qty">${item.qty}</span>
                </li>
            `;
        });

        // Add listeners to new checkboxes to enable/disable submit button
        const allCheckboxes = document.querySelectorAll('.item-checker, #verify-driver-export');
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

        const modal = document.getElementById('confirm-export-modal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
        }, 10);
    };

    function checkFormValidity() {
        const verifyDriver = document.getElementById('verify-driver-export').checked;
        const itemCheckers = document.querySelectorAll('.item-checker');
        let allItemsChecked = true;
        
        itemCheckers.forEach(cb => {
            if(!cb.checked) allItemsChecked = false;
        });

        const btnSubmit = document.getElementById('btn-confirm-export');
        if(verifyDriver && allItemsChecked && itemCheckers.length > 0) {
            btnSubmit.disabled = false;
        } else {
            btnSubmit.disabled = true;
        }
    }

    window.closeConfirmModal = function() {
        const modal = document.getElementById('confirm-export-modal');
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.95)';
        setTimeout(() => {
            modal.style.display = 'none';
            currentProcessingId = null;
        }, 300);
    };

    document.getElementById('btn-confirm-export').addEventListener('click', () => {
        if(currentProcessingId) {
            // Update mock data
            const index = exportData.findIndex(i => i.id === currentProcessingId);
            if(index > -1) {
                exportData[index].status = 'Đã Xuất Kho';
            }
            
            alert('Xác nhận xuất hàng và bàn giao cho tài xế thành công!');
            closeConfirmModal();
            renderTable(exportData);
        }
    });

    // -------------------------
    // Create Manual Export Modal
    // -------------------------
    window.openCreateExportModal = function() {
        const modal = document.getElementById('create-export-modal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
        }, 10);
    };

    window.closeCreateExportModal = function() {
        const modal = document.getElementById('create-export-modal');
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.95)';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    };

    window.submitCreateExport = function() {
        const form = document.getElementById('create-export-form');
        if(form.checkValidity()) {
            alert('Tạo lệnh xuất kho thành công!');
            form.reset();
            closeCreateExportModal();
        } else {
            form.reportValidity();
        }
    };
});
