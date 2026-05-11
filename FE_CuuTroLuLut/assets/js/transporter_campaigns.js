document.addEventListener('DOMContentLoaded', () => {
    
    // Mock Data for Campaigns
    const campaigns = [
        {
            id: 'CD001',
            title: 'Hỗ trợ khẩn cấp Làng Nủ - Lào Cai',
            desc: 'Đợt lũ quét gây thiệt hại nghiêm trọng. Cần hỗ trợ vận chuyển lương thực, nước sạch và thuốc men từ Hà Nội lên.',
            image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            status: 'active',
            startDate: '10/09/2024',
            endDate: '20/09/2024',
            location: 'Lào Cai',
            totalShipments: 12
        },
        {
            id: 'CD002',
            title: 'Cứu trợ ngập lụt Thái Nguyên',
            desc: 'Nước sông Cầu dâng cao. Cần ghe, thuyền nhỏ và xe tải gầm cao để tiếp cận và cung cấp áo phao, mì tôm.',
            image: 'https://images.unsplash.com/photo-1469532946326-11f84dddf87a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            status: 'active',
            startDate: '11/09/2024',
            endDate: '25/09/2024',
            location: 'Thái Nguyên',
            totalShipments: 8
        },
        {
            id: 'CD003',
            title: 'Tái thiết nhà cửa sau bão số 3',
            desc: 'Hỗ trợ vận chuyển vật liệu xây dựng (tôn, xi măng, sắt thép) đến các vùng bị sạt lở và tốc mái.',
            image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            status: 'upcoming',
            startDate: '25/09/2024',
            endDate: '15/10/2024',
            location: 'Nhiều tỉnh',
            totalShipments: 25
        }
    ];

    const grid = document.getElementById('campaigns-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('campaign-search');

    function renderCampaigns(data) {
        grid.innerHTML = '';
        if (data.length === 0) {
            grid.innerHTML = `
                <div class="loading-state" style="grid-column: 1/-1;">
                    <i class="fa-solid fa-folder-open" style="color: #cbd5e1; font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>Không tìm thấy đợt cứu trợ nào.</p>
                </div>
            `;
            return;
        }

        data.forEach(camp => {
            const statusLabel = camp.status === 'active' ? 'Đang diễn ra' : 'Sắp diễn ra';
            const statusClass = camp.status === 'active' ? 'status-active' : 'status-upcoming';
            
            grid.innerHTML += `
                <div class="camp-card">
                    <div class="camp-header">
                        <img src="${camp.image}" alt="Campaign" class="camp-image">
                        <span class="camp-status ${statusClass}">${statusLabel}</span>
                    </div>
                    <div class="camp-body">
                        <h3 class="camp-title">${camp.title}</h3>
                        <p class="camp-desc">${camp.desc}</p>
                        <div class="camp-meta">
                            <div class="meta-item">
                                <i class="fa-solid fa-location-dot"></i>
                                <span>${camp.location}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fa-solid fa-box-open"></i>
                                <span>${camp.totalShipments} chuyến cần chở</span>
                            </div>
                        </div>
                        <a href="transporter_shipments.html?camp=${camp.id}" class="camp-action">
                            Xem Chuyến Hàng <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
        });
    }

    // Initial render
    setTimeout(() => {
        renderCampaigns(campaigns);
    }, 800);

    // Filter Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const filter = e.target.getAttribute('data-filter');
            const searchTerm = searchInput.value.toLowerCase();
            
            let filtered = campaigns;
            if (filter !== 'all') {
                filtered = filtered.filter(c => c.status === filter);
            }
            if (searchTerm) {
                filtered = filtered.filter(c => c.title.toLowerCase().includes(searchTerm));
            }
            
            renderCampaigns(filtered);
        });
    });

    // Search Logic
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
        
        let filtered = campaigns;
        if (activeFilter !== 'all') {
            filtered = filtered.filter(c => c.status === activeFilter);
        }
        if (searchTerm) {
            filtered = filtered.filter(c => c.title.toLowerCase().includes(searchTerm));
        }
        
        renderCampaigns(filtered);
    });
});
