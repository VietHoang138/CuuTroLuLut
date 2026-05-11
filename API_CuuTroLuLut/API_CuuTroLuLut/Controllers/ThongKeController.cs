using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace CuuTroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ThongKeController : ControllerBase
    {
        private readonly IConfiguration _config;

        public ThongKeController(IConfiguration config)
        {
            _config = config;
        }

        [HttpGet("home")]
        public IActionResult GetHomeData()
        {
            string connStr = _config.GetConnectionString("DefaultConnection");

            int totalCampaigns = 0;
            int totalDonors = 0;
            int totalRecipients = 0;
            int totalVolunteers = 0;
            var campaigns = new List<object>();

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string statsSql = @"
                    SELECT 
                        (SELECT COUNT(*) FROM DotCuuTro) AS TotalCampaigns,
                        (SELECT COUNT(DISTINCT MaNguoiDung) FROM UngHo) AS TotalDonors,
                        (SELECT COUNT(*) FROM UngHo WHERE TrangThai LIKE N'%tiếp nhận%') AS TotalRecipients,
                        (SELECT COUNT(*) FROM NguoiDung WHERE MaVaiTro = 'VT04') AS TotalVolunteers
                ";

                using (SqlCommand statsCmd = new SqlCommand(statsSql, conn))
                using (SqlDataReader statsReader = statsCmd.ExecuteReader())
                {
                    if (statsReader.Read())
                    {
                        totalCampaigns = Convert.ToInt32(statsReader["TotalCampaigns"]);
                        totalDonors = Convert.ToInt32(statsReader["TotalDonors"]);
                        totalRecipients = Convert.ToInt32(statsReader["TotalRecipients"]);
                        totalVolunteers = Convert.ToInt32(statsReader["TotalVolunteers"]);
                    }
                }

                string campaignSql = @"
                    SELECT TOP 8
                        d.TenDot,
                        latest.NgayUngHo AS LastDonationDate,
                        latest.TrangThai AS LastStatus,
                        COUNT(u.MaUngHo) AS DonationCount
                    FROM DotCuuTro d
                    LEFT JOIN UngHo u ON u.MaDot = d.MaDot
                    OUTER APPLY (
                        SELECT TOP 1 u2.NgayUngHo, u2.TrangThai
                        FROM UngHo u2
                        WHERE u2.MaDot = d.MaDot
                        ORDER BY u2.NgayUngHo DESC
                    ) latest
                    GROUP BY d.MaDot, d.TenDot, latest.NgayUngHo, latest.TrangThai
                    ORDER BY latest.NgayUngHo DESC
                ";

                using (SqlCommand campaignCmd = new SqlCommand(campaignSql, conn))
                using (SqlDataReader campaignReader = campaignCmd.ExecuteReader())
                {
                    while (campaignReader.Read())
                    {
                        campaigns.Add(new
                        {
                            name = campaignReader["TenDot"].ToString(),
                            type = (string?)null,
                            dates = campaignReader["LastDonationDate"] == DBNull.Value
                                ? null
                                : Convert.ToDateTime(campaignReader["LastDonationDate"]).ToString("dd/MM/yyyy"),
                            status = campaignReader["LastStatus"] == DBNull.Value
                                ? null
                                : campaignReader["LastStatus"].ToString(),
                            donationCount = Convert.ToInt32(campaignReader["DonationCount"])
                        });
                    }
                }
            }

            return Ok(new
            {
                totalCampaigns,
                totalDonors,
                totalRecipients,
                totalVolunteers,
                campaigns
            });
        }

        [HttpGet("latest-campaigns")]
        public IActionResult GetLatestCampaigns()
        {
            string connStr = _config.GetConnectionString("DefaultConnection");
            var campaigns = new List<object>();

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string campaignSql = @"
                    SELECT TOP 8
                        d.TenDot,
                        d.MoTa,
                        d.NgayBatDau,
                        d.NgayKetThuc,
                        d.TrangThai
                    FROM DotCuuTro d
                    ORDER BY d.NgayBatDau DESC, d.MaDot DESC
                ";

                using (SqlCommand campaignCmd = new SqlCommand(campaignSql, conn))
                using (SqlDataReader campaignReader = campaignCmd.ExecuteReader())
                {
                    while (campaignReader.Read())
                    {
                        var ngayBatDau = campaignReader["NgayBatDau"] == DBNull.Value
                            ? (DateTime?)null
                            : Convert.ToDateTime(campaignReader["NgayBatDau"]);
                        var ngayKetThuc = campaignReader["NgayKetThuc"] == DBNull.Value
                            ? (DateTime?)null
                            : Convert.ToDateTime(campaignReader["NgayKetThuc"]);

                        campaigns.Add(new
                        {
                            name = campaignReader["TenDot"]?.ToString(),
                            type = campaignReader["MoTa"]?.ToString(),
                            dates = FormatDateRange(ngayBatDau, ngayKetThuc),
                            status = campaignReader["TrangThai"]?.ToString()
                        });
                    }
                }
            }

            return Ok(campaigns);
        }

        private static string? FormatDateRange(DateTime? startDate, DateTime? endDate)
        {
            if (startDate == null && endDate == null)
            {
                return null;
            }

            if (startDate != null && endDate != null)
            {
                return $"{startDate.Value:dd/MM/yyyy} - {endDate.Value:dd/MM/yyyy}";
            }

            if (startDate != null)
            {
                return $"Từ {startDate.Value:dd/MM/yyyy}";
            }

            return $"Đến {endDate!.Value:dd/MM/yyyy}";
        }
    }
}
