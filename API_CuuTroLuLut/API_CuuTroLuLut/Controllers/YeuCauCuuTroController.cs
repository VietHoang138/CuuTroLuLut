using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Collections.Generic;

namespace CuuTroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class YeuCauCuuTroController : ControllerBase
    {
        private readonly IConfiguration _config;
        public YeuCauCuuTroController(IConfiguration config) { _config = config; }

        // GET ALL - kèm thông tin người dân, thôn, đợt
        [HttpGet]
        public IActionResult GetAll()
        {
            var list = new List<object>();
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = @"
                    SELECT yc.MaYeuCau,
                           yc.NoiDung,
                           yc.TrangThai,
                           yc.MucDoUuTien,
                           nd.HoTen,
                           nd.SoDienThoai,
                           nd.MaNguoiDung,
                           t.TenThonToDanPho,
                           d.TenDot,
                           d.MaDot
                    FROM YeuCauCuuTro yc
                    JOIN NguoiDung nd ON yc.MaNguoiDung = nd.MaNguoiDung
                    LEFT JOIN ThonToDanPho t ON nd.MaThonToDanPho = t.MaThonToDanPho
                    LEFT JOIN DotCuuTro d ON yc.MaDot = d.MaDot
                    ORDER BY
                        CASE yc.MucDoUuTien
                            WHEN N'Cao' THEN 1
                            WHEN N'Trung bình' THEN 2
                            WHEN N'Thấp' THEN 3
                            ELSE 4
                        END,
                        yc.MaYeuCau
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                using (SqlDataReader r = cmd.ExecuteReader())
                {
                    while (r.Read())
                    {
                        list.Add(new
                        {
                            MaYeuCau = r["MaYeuCau"].ToString(),
                            NoiDung = r["NoiDung"].ToString(),
                            TrangThai = r["TrangThai"].ToString(),
                            MucDoUuTien = r["MucDoUuTien"].ToString(),
                            HoTen = r["HoTen"].ToString(),
                            SoDienThoai = r["SoDienThoai"].ToString(),
                            MaNguoiDung = r["MaNguoiDung"].ToString(),
                            TenThon = r["TenThonToDanPho"].ToString(),
                            TenDot = r["TenDot"].ToString(),
                            MaDot = r["MaDot"].ToString()
                        });
                    }
                }
            }

            return Ok(list);
        }

        // POST - Tạo yêu cầu cứu trợ mới
        [HttpPost]
        public IActionResult Create([FromBody] YeuCauRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.MaNguoiDung) || string.IsNullOrWhiteSpace(req.MaDot))
                return BadRequest(new { message = "Thiếu thông tin bắt buộc." });

            string connStr = _config.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                // Tự sinh mã
                string maMoi = GenerateNextMa(conn);
                string sql = @"
                    INSERT INTO YeuCauCuuTro (MaYeuCau, MaNguoiDung, MaDot, NoiDung, TrangThai, MucDoUuTien)
                    VALUES (@Ma, @ND, @Dot, @ND2, @TT, @MD)
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Ma", maMoi);
                    cmd.Parameters.AddWithValue("@ND", req.MaNguoiDung);
                    cmd.Parameters.AddWithValue("@Dot", req.MaDot);
                    cmd.Parameters.AddWithValue("@ND2", req.NoiDung ?? "");
                    cmd.Parameters.AddWithValue("@TT", req.TrangThai ?? "Chờ duyệt");
                    cmd.Parameters.AddWithValue("@MD", req.MucDoUuTien ?? "Trung bình");
                    cmd.ExecuteNonQuery();
                }
            }
            return Ok(new { message = "Tạo yêu cầu thành công." });
        }

        private static string GenerateNextMa(SqlConnection conn)
        {
            string sql = "SELECT MAX(TRY_CAST(SUBSTRING(MaYeuCau, 3, 10) AS INT)) FROM YeuCauCuuTro WHERE MaYeuCau LIKE 'YC%'";
            using (SqlCommand cmd = new SqlCommand(sql, conn))
            {
                object? result = cmd.ExecuteScalar();
                int max = (result != null && result != DBNull.Value && int.TryParse(result.ToString(), out int n)) ? n : 0;
                return $"YC{max + 1}";
            }
        }

        // PATCH - Cập nhật trạng thái yêu cầu
        [HttpPatch("{id}/trang-thai")]
        public IActionResult UpdateTrangThai(string id, [FromBody] YeuCauTrangThaiRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.TrangThai))
                return BadRequest(new { message = "Trạng thái không được để trống." });

            string connStr = _config.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = "UPDATE YeuCauCuuTro SET TrangThai = @TrangThai WHERE MaYeuCau = @Ma";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Ma", id);
                    cmd.Parameters.AddWithValue("@TrangThai", req.TrangThai);
                    int affected = cmd.ExecuteNonQuery();
                    if (affected == 0) return NotFound("Không tìm thấy yêu cầu.");
                }
            }
            return Ok(new { message = "Cập nhật thành công." });
        }

        // DELETE
        [HttpDelete("{id}")]
        public IActionResult Delete(string id)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = "DELETE FROM YeuCauCuuTro WHERE MaYeuCau = @Ma";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Ma", id);
                    cmd.ExecuteNonQuery();
                }
            }
            return Ok("Xóa thành công.");
        }
    }

    public class YeuCauTrangThaiRequest
    {
        public string? TrangThai { get; set; }
    }

    public class YeuCauRequest
    {
        public string? MaNguoiDung { get; set; }
        public string? MaDot { get; set; }
        public string? NoiDung { get; set; }
        public string? TrangThai { get; set; }
        public string? MucDoUuTien { get; set; }
    }
}
