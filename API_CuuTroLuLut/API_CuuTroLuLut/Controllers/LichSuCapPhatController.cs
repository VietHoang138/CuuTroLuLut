using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Collections.Generic;

namespace CuuTroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LichSuCapPhatController : ControllerBase
    {
        private readonly IConfiguration _config;
        public LichSuCapPhatController(IConfiguration config) { _config = config; }

        // GET ALL - lịch cấp phát kèm thông tin thôn, đợt, hàng hóa
        [HttpGet]
        public IActionResult GetAll()
        {
            var list = new List<object>();
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = @"
                    SELECT cp.MaCapPhat,
                           cp.SoLuong,
                           cp.TrangThai,
                           t.TenThonToDanPho,
                           t.MaThonToDanPho,
                           d.TenDot,
                           d.MaDot,
                           CONVERT(VARCHAR(10), d.NgayBatDau, 120) AS NgayBatDau,
                           CONVERT(VARCHAR(10), d.NgayKetThuc, 120) AS NgayKetThuc,
                           h.TenHang,
                           l.DonViTinh
                    FROM LichSuCapPhat cp
                    JOIN ThonToDanPho t ON cp.MaThonToDanPho = t.MaThonToDanPho
                    JOIN DotCuuTro d ON cp.MaDot = d.MaDot
                    JOIN HangCuuTro h ON cp.MaHang = h.MaHang
                    JOIN LoaiHang l ON h.MaLoaiHang = l.MaLoaiHang
                    ORDER BY d.NgayBatDau DESC, cp.MaCapPhat
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                using (SqlDataReader r = cmd.ExecuteReader())
                {
                    while (r.Read())
                    {
                        list.Add(new
                        {
                            MaCapPhat = r["MaCapPhat"].ToString(),
                            SoLuong = r["SoLuong"],
                            TrangThai = r["TrangThai"].ToString(),
                            TenThon = r["TenThonToDanPho"].ToString(),
                            MaThon = r["MaThonToDanPho"].ToString(),
                            TenDot = r["TenDot"].ToString(),
                            MaDot = r["MaDot"].ToString(),
                            NgayBatDau = r["NgayBatDau"].ToString(),
                            NgayKetThuc = r["NgayKetThuc"].ToString(),
                            TenHang = r["TenHang"].ToString(),
                            DonViTinh = r["DonViTinh"].ToString()
                        });
                    }
                }
            }

            return Ok(list);
        }

        // GET theo thôn của người dùng
        [HttpGet("by-thon/{maThon}")]
        public IActionResult GetByThon(string maThon)
        {
            var list = new List<object>();
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = @"
                    SELECT cp.MaCapPhat,
                           cp.SoLuong,
                           cp.TrangThai,
                           t.TenThonToDanPho,
                           d.TenDot,
                           d.MaDot,
                           CONVERT(VARCHAR(10), d.NgayBatDau, 120) AS NgayBatDau,
                           CONVERT(VARCHAR(10), d.NgayKetThuc, 120) AS NgayKetThuc,
                           h.TenHang,
                           l.DonViTinh
                    FROM LichSuCapPhat cp
                    JOIN ThonToDanPho t ON cp.MaThonToDanPho = t.MaThonToDanPho
                    JOIN DotCuuTro d ON cp.MaDot = d.MaDot
                    JOIN HangCuuTro h ON cp.MaHang = h.MaHang
                    JOIN LoaiHang l ON h.MaLoaiHang = l.MaLoaiHang
                    WHERE cp.MaThonToDanPho = @maThon
                    ORDER BY d.NgayBatDau DESC
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@maThon", maThon);
                    using (SqlDataReader r = cmd.ExecuteReader())
                    {
                        while (r.Read())
                        {
                            list.Add(new
                            {
                                MaCapPhat = r["MaCapPhat"].ToString(),
                                SoLuong = r["SoLuong"],
                                TrangThai = r["TrangThai"].ToString(),
                                TenThon = r["TenThonToDanPho"].ToString(),
                                TenDot = r["TenDot"].ToString(),
                                MaDot = r["MaDot"].ToString(),
                                NgayBatDau = r["NgayBatDau"].ToString(),
                                NgayKetThuc = r["NgayKetThuc"].ToString(),
                                TenHang = r["TenHang"].ToString(),
                                DonViTinh = r["DonViTinh"].ToString()
                            });
                        }
                    }
                }
            }

            return Ok(list);
        }
        // PATCH - Cập nhật trạng thái cấp phát
        [HttpPatch("{id}/trang-thai")]
        public IActionResult UpdateTrangThai(string id, [FromBody] CapPhatTrangThaiRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.TrangThai))
                return BadRequest(new { message = "Trạng thái không được để trống." });

            string connStr = _config.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = "UPDATE LichSuCapPhat SET TrangThai = @TrangThai WHERE MaCapPhat = @Ma";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Ma", id);
                    cmd.Parameters.AddWithValue("@TrangThai", req.TrangThai);
                    int affected = cmd.ExecuteNonQuery();
                    if (affected == 0) return NotFound("Không tìm thấy bản ghi.");
                }
            }
            return Ok(new { message = "Cập nhật thành công." });
        }
    }
}

public class CapPhatTrangThaiRequest
{
    public string? TrangThai { get; set; }
}
