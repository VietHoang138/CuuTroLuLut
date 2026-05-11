document.addEventListener('DOMContentLoaded', () => {
    const fetchHomeData = async () => window.CuuTroApi.requestJson('/api/ThongKe/home');
    const fetchLatestCampaigns = async () => window.CuuTroApi.requestJson('/api/ThongKe/latest-campaigns');

    // 3. Render dữ liệu ra giao diện
    const renderData = async () => {
        // Fetch dữ liệu song song nhưng không để 1 API lỗi làm hỏng toàn bộ trang
        const [homeResult, campaignsResult] = await Promise.allSettled([
            fetchHomeData(),
            fetchLatestCampaigns()
        ]);

        const homeData = homeResult.status === 'fulfilled' ? homeResult.value : null;
        let campaignsData = campaignsResult.status === 'fulfilled' ? campaignsResult.value : [];

        // Fallback: nếu API mới chưa có (404) thì dùng danh sách campaigns từ API /home
        if ((!campaignsData || campaignsData.length === 0) && homeData?.campaigns?.length > 0) {
            campaignsData = homeData.campaigns;
        }

        // Cập nhật thẻ số liệu (Stats)
        if (homeData) {
            // Hiệu ứng đếm số cơ bản
            document.getElementById('api-total-campaigns').innerHTML = `${homeData.totalCampaigns.toLocaleString()}<span style="color: var(--accent-orange);">+</span>`;
            document.getElementById('api-total-donors').innerText = homeData.totalDonors.toLocaleString();
            document.getElementById('api-total-recipients').innerText = homeData.totalRecipients.toLocaleString();
            document.getElementById('api-total-volunteers').innerHTML = `${homeData.totalVolunteers.toLocaleString()}`;
        } else {
            document.getElementById('api-total-campaigns').innerText = '--';
            document.getElementById('api-total-donors').innerText = '--';
            document.getElementById('api-total-recipients').innerText = '--';
            document.getElementById('api-total-volunteers').innerText = '--';
        }

        // Cập nhật bảng dữ liệu Campaign
        const tableBody = document.getElementById('api-campaigns-table');
        if (campaignsData && campaignsData.length > 0) {
            tableBody.innerHTML = ''; // Xóa trạng thái loading

            campaignsData.forEach(campaign => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--border-color)';
                tr.style.transition = 'background-color 0.2s';
                tr.onmouseover = () => tr.style.backgroundColor = '#f1f5f9';
                tr.onmouseout = () => tr.style.backgroundColor = 'transparent';

                // Xác định màu Status
                let statusBg = '#f1f5f9';
                let statusColor = '#475569';
                const statusText = campaign.status || 'Chưa cập nhật';
                const typeText = campaign.type || 'Chưa cập nhật';
                const dateText = campaign.dates || 'Chưa cập nhật';

                if (statusText === 'Đang vận động') {
                    statusBg = '#fef08a'; // light yellow
                    statusColor = '#ca8a04';
                } else if (statusText === 'Đang phân bổ') {
                    statusBg = '#dcfce7'; // light green
                    statusColor = '#16a34a';
                } else if (statusText === 'Đã kết thúc') {
                    statusBg = '#e2e8f0'; 
                    statusColor = '#475569';
                }

                tr.innerHTML = `
                    <td style="padding: 1.25rem 1.5rem; font-weight: 700; color: var(--primary-color);">${campaign.name || ''}</td>
                    <td style="padding: 1.25rem 1.5rem; color: var(--text-base); font-weight: 500;">${typeText}</td>
                    <td style="padding: 1.25rem 1.5rem; color: var(--text-muted); font-size: 0.875rem;"><i class="fa-regular fa-calendar" style="margin-right: 0.25rem;"></i> ${dateText}</td>
                    <td style="padding: 1.25rem 1.5rem; text-align: right;">
                        <span style="display:inline-block; padding: 0.375rem 0.875rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; background-color: ${statusBg}; color: ${statusColor}; border: 1px solid rgba(0,0,0,0.05);">
                            ${statusText}
                        </span>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        } else {
            const errMsg = campaignsResult.status === 'rejected' && !homeData
                ? `Không tải được dữ liệu API. ${campaignsResult.reason?.message || ''}`
                : 'Không có dữ liệu đợt cứu trợ.';
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1.25rem;">${errMsg}</td></tr>`;
        }
    };

    // Khởi động
    renderData();
});
