document.addEventListener('DOMContentLoaded', () => {
    
    // Mock Data for Pending Shipments
    const shipments = [
        {
            id: 'SHP-1045',
            campaign: 'Hỗ trợ khẩn cấp Làng Nủ - Lào Cai',
            pickup: {
                address: 'Kho Trung Tâm, KCN Hòa Khánh, Liên Chiểu, Đà Nẵng',
                contact: 'Anh Minh - 0905.123.456',
                time: 'Sẵn sàng'
            },
            delivery: {
                address: 'UBND Xã Phúc Khánh, Bảo Yên, Lào Cai',
                contact: 'Chị Mai - 0988.765.432'
            },
            goods: 'Nước lọc, Mì tôm, Thuốc men',
            weight: '2.5 Tấn',
            vehicleRequired: 'Xe tải 3.5 Tấn trở lên'
        },
        {
            id: 'SHP-1046',
            campaign: 'Cứu trợ ngập lụt Thái Nguyên',
            pickup: {
                address: 'Điểm tập kết Ủy Ban Quận Hải Châu, Đà Nẵng',
                contact: 'Chị Lan - 0935.111.222',
                time: 'Từ 14:00 hôm nay'
            },
            delivery: {
                address: 'Nhà thi đấu tỉnh Thái Nguyên',
                contact: 'Ban Chỉ Đạo - 0912.333.444'
            },
            goods: 'Áo phao, Đèn pin, Lương khô',
            weight: '1.2 Tấn',
            vehicleRequired: 'Xe tải nhẹ 1.5 Tấn'
        },
        {
            id: 'SHP-1048',
            campaign: 'Hỗ trợ khẩn cấp Làng Nủ - Lào Cai',
            pickup: {
                address: 'Kho hàng Liên Phường, Thanh Khê, Đà Nẵng',
                contact: 'Chú Bình - 0903.555.666',
                time: 'Sẵn sàng'
            },
            delivery: {
                address: 'Trung tâm y tế Bảo Yên, Lào Cai',
                contact: 'Bác sĩ Tú - 0977.888.999'
            },
            goods: 'Thiết bị y tế, Thuốc khử trùng',
            weight: '0.5 Tấn',
            vehicleRequired: 'Xe tải van / Xe bán tải'
        }
    ];

    const container = document.getElementById('shipments-list');
    const searchInput = document.getElementById('shipment-search');
    let selectedShipmentId = null;

    function renderShipments(data) {
        container.innerHTML = '';
        if (data.length === 0) {
            container.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-box-open" style="color: #cbd5e1; font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>Hiện không có chuyến hàng nào đang chờ.</p>
                </div>
            `;
            return;
        }

        data.forEach(shp => {
            container.innerHTML += `
                <div class="shipment-card">
                    <div class="shipment-timeline">
                        <div class="timeline-line"></div>
                        <div class="timeline-point point-pickup">
                            <div class="point-label">Điểm Nhận Hàng</div>
                            <div class="point-address">${shp.pickup.address}</div>
                            <div class="point-contact">
                                <i class="fa-solid fa-user"></i> ${shp.pickup.contact}
                            </div>
                            <div class="point-contact" style="color: var(--accent-orange); margin-top: 4px;">
                                <i class="fa-regular fa-clock"></i> ${shp.pickup.time}
                            </div>
                        </div>
                        <div class="timeline-point point-delivery">
                            <div class="point-label">Điểm Giao Hàng</div>
                            <div class="point-address">${shp.delivery.address}</div>
                            <div class="point-contact">
                                <i class="fa-solid fa-user"></i> ${shp.delivery.contact}
                            </div>
                        </div>
                    </div>
                    
                    <div class="shipment-details">
                        <div class="detail-row">
                            <span class="detail-label">Mã chuyến:</span>
                            <span class="detail-value" style="color: var(--accent-cyan);">${shp.id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Chiến dịch:</span>
                            <span class="detail-value" style="max-width: 150px; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${shp.campaign}">${shp.campaign}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Hàng hóa:</span>
                            <span class="detail-value">${shp.goods}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Trọng lượng:</span>
                            <span class="detail-value">${shp.weight}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Yêu cầu xe:</span>
                            <span class="detail-value">${shp.vehicleRequired}</span>
                        </div>
                    </div>
                    
                    <div class="shipment-actions">
                        <button class="btn-accept" onclick="openAcceptModal('${shp.id}')">
                            Nhận Chuyến <i class="fa-solid fa-check"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    // Initial render
    setTimeout(() => {
        // Check if URL has campaign filter
        const urlParams = new URLSearchParams(window.location.search);
        const campId = urlParams.get('camp');
        
        let displayData = shipments;
        // In a real app, we would filter by campaign ID. Here we just show all mock data for demo
        
        renderShipments(displayData);
    }, 600);

    // Search Logic
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = shipments.filter(s => 
            s.pickup.address.toLowerCase().includes(term) || 
            s.delivery.address.toLowerCase().includes(term) ||
            s.id.toLowerCase().includes(term)
        );
        renderShipments(filtered);
    });

    // Modal Logic
    window.openAcceptModal = function(id) {
        selectedShipmentId = id;
        const shp = shipments.find(s => s.id === id);
        
        const summary = document.getElementById('modal-shipment-summary');
        summary.innerHTML = `
            Chuyến hàng <strong>${shp.id}</strong><br>
            Từ: <strong>${shp.pickup.address}</strong><br>
            Đến: <strong>${shp.delivery.address}</strong>
        `;
        
        const modal = document.getElementById('accept-modal');
        modal.style.display = 'flex';
        // Small delay to allow display:flex to apply before changing opacity
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
        }, 10);
    };

    window.closeAcceptModal = function() {
        const modal = document.getElementById('accept-modal');
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            modal.style.display = 'none';
            selectedShipmentId = null;
        }, 300);
    };

    document.getElementById('confirm-accept-btn').addEventListener('click', () => {
        if(selectedShipmentId) {
            // In a real app, this would be an API call.
            alert(`Đã nhận chuyến hàng ${selectedShipmentId} thành công!`);
            closeAcceptModal();
            // Redirect to schedule page
            window.location.href = 'transporter_schedule.html';
        }
    });

});
