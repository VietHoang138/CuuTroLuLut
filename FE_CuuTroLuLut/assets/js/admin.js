document.addEventListener('DOMContentLoaded', () => {
    const renderCampaignOverview = (campaigns = []) => {
        const campaignOverview = document.getElementById('api-admin-campaign-overview');
        if (!campaignOverview) return;

        if (!campaigns.length) {
            campaignOverview.innerHTML = `
                <p style="text-align:center; color:var(--text-muted); padding:1.25rem 0;">
                    Không có dữ liệu chiến dịch từ API.
                </p>
            `;
            return;
        }

        const rows = campaigns.slice(0, 2).map(campaign => `
            <div class="campaign-item" style="margin-bottom: 1rem;">
                <h4 class="campaign-title">${campaign.name || 'Chưa cập nhật'}</h4>
                <div class="campaign-details mt-2">
                    <div>
                        <p style="margin-bottom: 0.25rem;">Thời gian cập nhật:</p>
                        <p style="color: var(--text-dark); font-weight: 500;">${campaign.dates || 'Chưa cập nhật'}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="margin-bottom: 0.25rem;">Trạng thái:</p>
                        <span class="status-badge status-active">${campaign.status || 'Chưa cập nhật'}</span>
                    </div>
                </div>
            </div>
        `).join('');

        campaignOverview.innerHTML = rows;
    };

    const fetchAdminStats = async () => {
        let donations = null;
        try {
            // Endpoint có Authorize: dùng khi đã đăng nhập admin.
            donations = await window.CuuTroApi.requestJson('/api/UngHo');
        } catch (_) {
            donations = null;
        }

        if (Array.isArray(donations)) {
            const donors = new Set();
            const campaigns = new Set();
            let recipients = 0;

            donations.forEach(item => {
                if (item.HoTen) {
                    donors.add(item.HoTen);
                }
                if (item.TenDot) {
                    campaigns.add(item.TenDot);
                }
                if ((item.TrangThai || '').toLowerCase().includes('tiếp nhận')) {
                    recipients += 1;
                }
            });

            return {
                users: donors.size,
                donors: donors.size,
                recipients,
                villages: 0,
                activeCampaigns: campaigns.size,
                volunteers: 0,
                campaigns: []
            };
        }

        // Fallback endpoint public cho phần thống kê trang admin.
        const homeData = await window.CuuTroApi.requestJson('/api/ThongKe/home');
        return {
            users: homeData.totalDonors || 0,
            donors: homeData.totalDonors || 0,
            recipients: homeData.totalRecipients || 0,
            villages: 0,
            activeCampaigns: homeData.totalCampaigns || 0,
            volunteers: homeData.totalVolunteers || 0,
            campaigns: homeData.campaigns || []
        };
    };

    fetchAdminStats()
        .then(data => {
            if (data) {
                document.getElementById('api-admin-users').innerText = data.users.toLocaleString();
                document.getElementById('api-admin-donors').innerText = data.donors.toLocaleString();
                document.getElementById('api-admin-recipients').innerText = data.recipients.toLocaleString();
                document.getElementById('api-admin-villages').innerText = data.villages.toLocaleString();
                document.getElementById('api-admin-campaigns').innerText = data.activeCampaigns.toLocaleString();
                document.getElementById('api-admin-volunteers').innerText = data.volunteers.toLocaleString();

                const donorRole = document.getElementById('api-role-donor');
                const transporterRole = document.getElementById('api-role-transporter');
                const managerRole = document.getElementById('api-role-manager');
                if (donorRole) donorRole.innerText = data.donors.toLocaleString();
                if (transporterRole) transporterRole.innerText = '0';
                if (managerRole) managerRole.innerText = '0';

                const donorBar = document.getElementById('api-role-donor-bar');
                const transporterBar = document.getElementById('api-role-transporter-bar');
                const managerBar = document.getElementById('api-role-manager-bar');
                if (donorBar) donorBar.style.width = '100%';
                if (transporterBar) transporterBar.style.width = '0%';
                if (managerBar) managerBar.style.width = '0%';
                renderCampaignOverview(data.campaigns);
            }
        })
        .catch(error => {
            const ids = [
                'api-admin-users',
                'api-admin-donors',
                'api-admin-recipients',
                'api-admin-villages',
                'api-admin-campaigns',
                'api-admin-volunteers'
            ];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.innerText = '-';
                    el.title = `Lỗi API: ${error.message || ''}`;
                }
            });

            ['api-role-donor', 'api-role-transporter', 'api-role-manager'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.innerText = '-';
                    el.title = `Lỗi API: ${error.message || ''}`;
                }
            });

            ['api-role-donor-bar', 'api-role-transporter-bar', 'api-role-manager-bar'].forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.width = '0%';
                }
            });

            const campaignOverview = document.getElementById('api-admin-campaign-overview');
            if (campaignOverview) {
                campaignOverview.innerHTML = `
                    <p style="text-align:center; color:#dc2626; padding:1.25rem 0;">
                        Không tải được dữ liệu chiến dịch từ API. ${error.message || ''}
                    </p>
                `;
            }
        });
});
