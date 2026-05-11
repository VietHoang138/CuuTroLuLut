document.addEventListener('DOMContentLoaded', () => {

    // Mock Data for Requests
    let requestsData = [
        {
            id: 'REQ-001',
            user: 'Trần Thị Thu',
            date: '15/09/2024 14:30',
            title: 'Xin hỗ trợ sửa chữa mái nhà bị tốc',
            desc: 'Nhà tôi bị tốc mái hoàn toàn do bão, hiện gia đình 4 người đang phải ở tạm nhà người quen. Rất mong được hỗ trợ tôn lợp.',
            members: 4,
            damage: 'Nặng',
            campaign: 'Tái thiết nhà cửa sau bão số 3',
            status: 'pending',
            images: [
                'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
            ]
        },
        {
            id: 'REQ-002',
            user: 'Lê Văn An',
            date: '14/09/2024 09:15',
            title: 'Cần nhu yếu phẩm khẩn cấp',
            desc: 'Nhà ngập sâu hơn 1m, lương thực dự trữ đã hết. Nhà có người già và trẻ nhỏ 2 tuổi.',
            members: 5,
            damage: 'Nặng',
            campaign: 'Hỗ trợ khẩn cấp Làng Nủ - Lào Cai',
            status: 'pending',
            images: [
                'https://images.unsplash.com/photo-1469532946326-11f84dddf87a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
            ]
        },
        {
            id: 'REQ-003',
            user: 'Phạm Hữu Trí',
            date: '12/09/2024 16:45',
            title: 'Đăng ký nhận thùng chứa nước sạch',
            desc: 'Nguồn nước giếng bị ô nhiễm do lũ. Cần dụng cụ chứa nước và phèn chua để xử lý.',
            members: 3,
            damage: 'Trung bình',
            campaign: 'Cứu trợ ngập lụt Thái Nguyên',
            status: 'approved',
            images: []
        },
        {
            id: 'REQ-004',
            user: 'Nguyễn Đăng Đạo',
            date: '10/09/2024 10:00',
            title: 'Xin hỗ trợ giống cây trồng',
            desc: 'Diện tích hoa màu bị ngập úng. Không có ảnh hưởng về nhà cửa.',
            members: 2,
            damage: 'Nhẹ',
            campaign: 'Khác',
            status: 'rejected',
            rejectReason: 'Chưa có chiến dịch hỗ trợ nông nghiệp trong thời điểm này.',
            images: []
        }
    ];

    const grid = document.getElementById('requests-list');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const searchInput = document.getElementById('request-search');
    let currentTab = 'pending';
    let currentProcessingId = null;

    function renderRequests() {
        grid.innerHTML = '';
        
        let filtered = requestsData.filter(item => item.status === currentTab);
        
        const term = searchInput.value.toLowerCase();
        if(term) {
            filtered = filtered.filter(item => item.user.toLowerCase().includes(term));
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-folder-open" style="color: #cbd5e1; font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>Không có yêu cầu nào trong mục này.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(item => {
            let badgeClass = 'badge-pending';
            let statusText = 'Chờ Duyệt';
            if(item.status === 'approved') { badgeClass = 'badge-approved'; statusText = 'Đã Duyệt'; }
            if(item.status === 'rejected') { badgeClass = 'badge-rejected'; statusText = 'Từ Chối'; }

            grid.innerHTML += `
                <div class="request-card">
                    <div class="req-header">
                        <div class="req-user">
                            <div class="req-avatar"><i class="fa-solid fa-user"></i></div>
                            <div>
                                <div class="req-name">${item.user}</div>
                                <div class="req-date">${item.date}</div>
                            </div>
                        </div>
                        <span class="status-badge ${badgeClass}">${statusText}</span>
                    </div>
                    <div class="req-body">
                        <div class="req-title">${item.title}</div>
                        <div class="req-desc">${item.desc}</div>
                        <div class="req-meta">
                            <span class="meta-pill"><i class="fa-solid fa-users"></i> ${item.members} Khẩu</span>
                            <span class="meta-pill"><i class="fa-solid fa-house-crack"></i> ${item.damage}</span>
                        </div>
                    </div>
                    <div class="req-actions">
                        <button class="btn-view" onclick="openReviewModal('${item.id}')">Xem Chi Tiết & Duyệt</button>
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
            renderRequests();
        });
    });

    // Search Logic
    searchInput.addEventListener('input', renderRequests);

    // Initial Render
    setTimeout(() => {
        // Handle pre-filter if coming from campaign page
        const urlParams = new URLSearchParams(window.location.search);
        // We won't strictly filter mock data by campaign ID here for simplicity, just show all
        renderRequests();
    }, 400);

    // Modal Logic
    window.openReviewModal = function(id) {
        currentProcessingId = id;
        const data = requestsData.find(r => r.id === id);
        if(!data) return;

        let imagesHTML = '';
        if(data.images.length > 0) {
            imagesHTML = `
                <div class="detail-section">
                    <h4><i class="fa-solid fa-image"></i> Hình ảnh xác thực</h4>
                    <div class="proof-images">
                        ${data.images.map(src => `<img src="${src}" class="proof-img" alt="Proof">`).join('')}
                    </div>
                </div>
            `;
        }

        const content = document.getElementById('modal-review-content');
        content.innerHTML = `
            <div class="detail-section">
                <h4><i class="fa-solid fa-address-card"></i> Thông tin hộ gia đình</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Chủ hộ:</label>
                        <span>${data.user}</span>
                    </div>
                    <div class="info-item">
                        <label>Nhân khẩu:</label>
                        <span>${data.members} người</span>
                    </div>
                    <div class="info-item">
                        <label>Mức độ thiệt hại:</label>
                        <span style="color: #ea580c;">${data.damage}</span>
                    </div>
                    <div class="info-item">
                        <label>Ngày gửi yêu cầu:</label>
                        <span>${data.date}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4><i class="fa-solid fa-align-left"></i> Nội dung yêu cầu</h4>
                <p style="font-weight: 600; color: var(--text-dark); margin-bottom: 0.5rem;">${data.title}</p>
                <p style="color: var(--text-base); line-height: 1.5;">${data.desc}</p>
            </div>
            
            ${imagesHTML}
            
            ${data.status === 'rejected' ? `
                <div class="detail-section" style="background: #fee2e2; padding: 1rem; border-radius: 8px; border: 1px solid #fca5a5;">
                    <h4 style="color: #ef4444; margin-bottom: 0.25rem;"><i class="fa-solid fa-circle-xmark"></i> Lý do từ chối:</h4>
                    <span style="color: #b91c1c;">${data.rejectReason}</span>
                </div>
            ` : ''}
        `;

        const actionsContainer = document.getElementById('modal-review-actions');
        if(data.status === 'pending') {
            actionsContainer.innerHTML = `
                <button type="button" class="btn-reject" onclick="handleAction('reject')"><i class="fa-solid fa-xmark"></i> Từ Chối</button>
                <button type="button" class="btn-approve-action" onclick="handleAction('approve')"><i class="fa-solid fa-check"></i> Phê Duyệt</button>
            `;
        } else {
            actionsContainer.innerHTML = `
                <button type="button" class="btn-view" onclick="closeReviewModal()">Đóng</button>
            `;
        }

        const modal = document.getElementById('review-modal');
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
        }, 10);
    };

    window.closeReviewModal = function() {
        const modal = document.getElementById('review-modal');
        modal.style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            modal.style.display = 'none';
            currentProcessingId = null;
        }, 300);
    };

    window.handleAction = function(action) {
        if(!currentProcessingId) return;
        
        const index = requestsData.findIndex(r => r.id === currentProcessingId);
        if(index === -1) return;

        if(action === 'approve') {
            if(confirm('Bạn xác nhận phê duyệt yêu cầu này và đưa vào danh sách nhận cứu trợ?')) {
                requestsData[index].status = 'approved';
                alert('Đã phê duyệt yêu cầu!');
                closeReviewModal();
                renderRequests();
            }
        } else if (action === 'reject') {
            const reason = prompt('Vui lòng nhập lý do từ chối:');
            if(reason !== null) {
                requestsData[index].status = 'rejected';
                requestsData[index].rejectReason = reason || 'Không đáp ứng điều kiện nhận hỗ trợ hiện tại.';
                alert('Đã từ chối yêu cầu.');
                closeReviewModal();
                renderRequests();
            }
        }
    };
});
