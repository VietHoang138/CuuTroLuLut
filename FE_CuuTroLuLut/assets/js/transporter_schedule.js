document.addEventListener('DOMContentLoaded', () => {
    
    // Mock Data for Schedule
    let scheduleData = [
        {
            id: 'SHP-1042',
            campaign: 'Cứu trợ ngập lụt Thái Nguyên',
            pickup: 'Ủy Ban Quận Hải Châu, Đà Nẵng',
            delivery: 'Nhà thi đấu tỉnh Thái Nguyên',
            status: 'Đang di chuyển',
            date: '15/09/2024'
        },
        {
            id: 'SHP-1044',
            campaign: 'Hỗ trợ khẩn cấp Làng Nủ - Lào Cai',
            pickup: 'Kho Trung Tâm, KCN Hòa Khánh, Đà Nẵng',
            delivery: 'UBND Xã Phúc Khánh, Bảo Yên, Lào Cai',
            status: 'Đang lấy hàng',
            date: '15/09/2024'
        },
        {
            id: 'SHP-1030',
            campaign: 'Tái thiết nhà cửa sau bão số 3',
            pickup: 'Kho VLXD Hòa Xuân, Cẩm Lệ, Đà Nẵng',
            delivery: 'Xã Đại Lãnh, Đại Lộc, Quảng Nam',
            status: 'Đã giao thành công',
            date: '10/09/2024'
        }
    ];

    const listContainer = document.getElementById('schedule-list');
    const tabBtns = document.querySelectorAll('.tab-btn');
    let currentTab = 'active'; // 'active' or 'completed'
    let currentEditingId = null;

    function getStatusClassAndIcon(status) {
        switch(status) {
            case 'Đã nhận': return { class: 'status-received', icon: 'fa-check' };
            case 'Đang lấy hàng': return { class: 'status-picking', icon: 'fa-box-open' };
            case 'Đang di chuyển': return { class: 'status-moving', icon: 'fa-truck-fast' };
            case 'Đã giao thành công': return { class: 'status-delivered', icon: 'fa-check-double' };
            default: return { class: 'status-received', icon: 'fa-info-circle' };
        }
    }

    function renderSchedule() {
        listContainer.innerHTML = '';
        
        let filtered = scheduleData.filter(item => {
            if (currentTab === 'active') {
                return item.status !== 'Đã giao thành công';
            } else {
                return item.status === 'Đã giao thành công';
            }
        });

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-calendar-xmark" style="color: #cbd5e1; font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>Không có chuyến hàng nào trong mục này.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(item => {
            const statusInfo = getStatusClassAndIcon(item.status);
            
            const actionButton = item.status !== 'Đã giao thành công' 
                ? `<div class="sc-actions">
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem; text-align: center;">Cập nhật lộ trình</p>
                    <button class="btn-update" onclick="openStatusModal('${item.id}', '${item.status}')">
                        <i class="fa-solid fa-pen-to-square"></i> Cập Nhật
                    </button>
                   </div>` 
                : `<div class="sc-actions">
                    <p style="font-size: 0.85rem; color: #16a34a; font-weight: 600; text-align: center; margin-bottom: 0;">
                        <i class="fa-solid fa-circle-check" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
                        Hoàn thành
                    </p>
                   </div>`;

            listContainer.innerHTML += `
                <div class="schedule-card">
                    <div class="sc-header">
                        <span class="sc-id"><i class="fa-solid fa-hashtag" style="color: var(--accent-cyan); margin-right: 4px;"></i> ${item.id}</span>
                        <span class="sc-status-badge ${statusInfo.class}">
                            <i class="fa-solid ${statusInfo.icon}"></i> ${item.status}
                        </span>
                    </div>
                    <div class="sc-body">
                        <div class="sc-timeline">
                            <div class="tl-line"></div>
                            <div class="tl-point tl-pickup">
                                <div class="tl-label">Lấy hàng tại</div>
                                <div class="tl-address">${item.pickup}</div>
                            </div>
                            <div class="tl-point tl-delivery">
                                <div class="tl-label">Giao hàng đến</div>
                                <div class="tl-address">${item.delivery}</div>
                            </div>
                        </div>
                        ${actionButton}
                    </div>
                </div>
            `;
        });
    }

    // Tabs Logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = e.target.getAttribute('data-tab');
            renderSchedule();
        });
    });

    // Initial Render
    setTimeout(() => {
        renderSchedule();
    }, 500);


    // Modal Logic
    window.openStatusModal = function(id, currentStatus) {
        currentEditingId = id;
        document.getElementById('modal-shipment-id').innerText = id;
        
        const select = document.getElementById('new-status-select');
        select.value = currentStatus; // Set to current status if available
        
        const modal = document.getElementById('status-modal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
        }, 10);
    };

    window.closeStatusModal = function() {
        const modal = document.getElementById('status-modal');
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            modal.style.display = 'none';
            currentEditingId = null;
        }, 300);
    };

    document.getElementById('save-status-btn').addEventListener('click', () => {
        if(currentEditingId) {
            const newStatus = document.getElementById('new-status-select').value;
            
            // Update mock data
            const index = scheduleData.findIndex(item => item.id === currentEditingId);
            if(index !== -1) {
                scheduleData[index].status = newStatus;
            }
            
            // In a real app, this would be an API call
            alert('Cập nhật trạng thái thành công!');
            closeStatusModal();
            renderSchedule(); // Re-render the list
        }
    });

});
