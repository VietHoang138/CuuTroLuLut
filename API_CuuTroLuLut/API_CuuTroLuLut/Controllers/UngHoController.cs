using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Data.SqlClient;
using CuuTroAPI.Models;

namespace CuuTroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UngHoController : ControllerBase
    {
        private readonly IConfiguration _config;

        // BẮT BUỘC phải có
        public UngHoController(IConfiguration config)
        {
            _config = config;
        }

        // GET LỊCH SỬ ỦNG HỘ THEO NGƯỜI DÙNG (public, lọc theo query param)
        [HttpGet("by-user/{userId}")]
        public IActionResult GetByUser(string userId)
        {
            var list = new List<object>();
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = @"
                    SELECT u.MaUngHo,
                           CONVERT(VARCHAR(10), u.NgayUngHo, 120) AS NgayUngHo,
                           u.TrangThai,
                           d.TenDot,
                           ISNULL(
                               (SELECT STRING_AGG(h.TenHang + ' x' + CAST(CAST(ct.SoLuong AS INT) AS VARCHAR), ', ')
                                FROM ChiTietUngHoHang ct
                                JOIN HangCuuTro h ON h.MaHang = ct.MaHang
                                WHERE ct.MaUngHo = u.MaUngHo), '—'
                           ) AS NoiDung
                    FROM UngHo u
                    JOIN DotCuuTro d ON u.MaDot = d.MaDot
                    WHERE u.MaNguoiDung = @userId
                    ORDER BY u.NgayUngHo DESC
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@userId", userId);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            list.Add(new
                            {
                                MaUngHo = reader["MaUngHo"].ToString(),
                                NgayUngHo = reader["NgayUngHo"].ToString(),
                                TrangThai = reader["TrangThai"].ToString(),
                                TenDot = reader["TenDot"].ToString(),
                                NoiDung = reader["NoiDung"].ToString()
                            });
                        }
                    }
                }
            }

            return Ok(list);
        }

        // GET TẤT CẢ (dành cho admin, không cần auth để dễ test)
        [HttpGet("admin/all")]
        public IActionResult GetAllAdmin()
        {
            var list = new List<object>();
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = @"
                    SELECT u.MaUngHo,
                           CONVERT(VARCHAR(10), u.NgayUngHo, 120) AS NgayUngHo,
                           u.TrangThai,
                           nd.HoTen,
                           nd.MaNguoiDung,
                           d.TenDot,
                           d.MaDot,
                           ISNULL(
                               (SELECT STRING_AGG(h.TenHang + ' x' + CAST(CAST(ct.SoLuong AS INT) AS VARCHAR), ', ')
                                FROM ChiTietUngHoHang ct
                                JOIN HangCuuTro h ON h.MaHang = ct.MaHang
                                WHERE ct.MaUngHo = u.MaUngHo), N'—'
                           ) AS NoiDung
                    FROM UngHo u
                    JOIN NguoiDung nd ON u.MaNguoiDung = nd.MaNguoiDung
                    JOIN DotCuuTro d ON u.MaDot = d.MaDot
                    ORDER BY u.NgayUngHo DESC
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        list.Add(new
                        {
                            MaUngHo = reader["MaUngHo"].ToString(),
                            NgayUngHo = reader["NgayUngHo"].ToString(),
                            TrangThai = reader["TrangThai"].ToString(),
                            HoTen = reader["HoTen"].ToString(),
                            MaNguoiDung = reader["MaNguoiDung"].ToString(),
                            TenDot = reader["TenDot"].ToString(),
                            MaDot = reader["MaDot"].ToString(),
                            NoiDung = reader["NoiDung"].ToString()
                        });
                    }
                }
            }

            return Ok(list);
        }

        // PATCH cập nhật trạng thái (admin duyệt)
        [HttpPatch("{id}/trang-thai")]
        public IActionResult UpdateTrangThai(string id, [FromBody] TrangThaiRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.TrangThai))
                return BadRequest(new { message = "Trạng thái không được để trống." });

            string connStr = _config.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = "UPDATE UngHo SET TrangThai = @TrangThai WHERE MaUngHo = @Ma";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Ma", id);
                    cmd.Parameters.AddWithValue("@TrangThai", req.TrangThai);
                    int affected = cmd.ExecuteNonQuery();
                    if (affected == 0) return NotFound("Không tìm thấy phiếu ủng hộ.");
                }
            }
            return Ok(new { message = "Cập nhật trạng thái thành công." });
        }


        [Authorize]
        [HttpGet]
        public IActionResult GetAll()
        {
            var list = new List<object>();
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string sql = @"
                                SELECT u.MaUngHo, u.NgayUngHo, u.TrangThai,
                                       nd.HoTen, d.TenDot
                                FROM UngHo u
                                JOIN NguoiDung nd ON u.MaNguoiDung = nd.MaNguoiDung
                                JOIN DotCuuTro d ON u.MaDot = d.MaDot
                                ORDER BY u.NgayUngHo DESC
                                ";

                SqlCommand cmd = new SqlCommand(sql, conn);
                SqlDataReader reader = cmd.ExecuteReader();

                while (reader.Read())
                {
                    list.Add(new
                    {
                        MaUngHo = reader["MaUngHo"].ToString(),
                        NgayUngHo = reader["NgayUngHo"],
                        TrangThai = reader["TrangThai"].ToString(),
                        HoTen = reader["HoTen"].ToString(),
                        TenDot = reader["TenDot"].ToString()
                    });
                }
            }

            // trả danh sách cho frontend hiển thị bảng
            return Ok(list);
        }

        // GET CHI TIẾT PHIẾU ỦNG HỘ
        [HttpGet("{id}")]
        public IActionResult GetDetail(string id)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string sql1 = @"
                    SELECT u.MaUngHo,
                           CONVERT(VARCHAR(10), u.NgayUngHo, 120) AS NgayUngHo,
                           u.TrangThai,
                           nd.HoTen, nd.SoDienThoai, nd.Email, nd.MaNguoiDung,
                           d.TenDot, d.MaDot,
                           ISNULL(d.MoTa, '') AS MoTaDot
                    FROM UngHo u
                    JOIN NguoiDung nd ON u.MaNguoiDung = nd.MaNguoiDung
                    JOIN DotCuuTro d ON u.MaDot = d.MaDot
                    WHERE u.MaUngHo = @id
                ";
                using (SqlCommand cmd1 = new SqlCommand(sql1, conn))
                {
                    cmd1.Parameters.AddWithValue("@id", id);
                    using (SqlDataReader r1 = cmd1.ExecuteReader())
                    {
                        if (!r1.Read()) return NotFound("Không tìm thấy phiếu ủng hộ.");
                        var thongTin = new
                        {
                            MaUngHo = r1["MaUngHo"].ToString(),
                            NgayUngHo = r1["NgayUngHo"].ToString(),
                            TrangThai = r1["TrangThai"].ToString(),
                            HoTen = r1["HoTen"].ToString(),
                            SoDienThoai = r1["SoDienThoai"].ToString(),
                            Email = r1["Email"].ToString(),
                            MaNguoiDung = r1["MaNguoiDung"].ToString(),
                            TenDot = r1["TenDot"].ToString(),
                            MaDot = r1["MaDot"].ToString(),
                            MoTaDot = r1["MoTaDot"].ToString()
                        };
                        r1.Close();

                        string sql2 = @"
                            SELECT h.MaHang, h.TenHang, ct.SoLuong,
                                   l.TenLoaiHang, l.DonViTinh
                            FROM ChiTietUngHoHang ct
                            JOIN HangCuuTro h ON ct.MaHang = h.MaHang
                            JOIN LoaiHang l ON h.MaLoaiHang = l.MaLoaiHang
                            WHERE ct.MaUngHo = @id
                        ";
                        var danhSachHang = new List<object>();
                        using (SqlCommand cmd2 = new SqlCommand(sql2, conn))
                        {
                            cmd2.Parameters.AddWithValue("@id", id);
                            using (SqlDataReader r2 = cmd2.ExecuteReader())
                                while (r2.Read())
                                    danhSachHang.Add(new
                                    {
                                        MaHang = r2["MaHang"].ToString(),
                                        TenHang = r2["TenHang"].ToString(),
                                        SoLuong = r2["SoLuong"],
                                        TenLoaiHang = r2["TenLoaiHang"].ToString(),
                                        DonViTinh = r2["DonViTinh"].ToString()
                                    });
                        }

                        return Ok(new { ThongTin = thongTin, DanhSachHang = danhSachHang });
                    }
                }
            }
        }

        // TẠO PHIẾU ỦNG HỘ
        [Authorize]
        [HttpPost("create")]
        public IActionResult CreateUngHo(string maDot)
        {
            var userId = User.FindFirst("MaNguoiDung")?.Value;

            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string maUngHo = "UH" + DateTime.Now.Ticks;

                string sql = @"INSERT INTO UngHo
                (MaUngHo, MaNguoiDung, MaDot)
                VALUES (@Ma, @ND, @Dot)";

                SqlCommand cmd = new SqlCommand(sql, conn);

                cmd.Parameters.AddWithValue("@Ma", maUngHo);
                cmd.Parameters.AddWithValue("@ND", userId);
                cmd.Parameters.AddWithValue("@Dot", maDot);

                cmd.ExecuteNonQuery();

                return Ok(new { MaUngHo = maUngHo });
            }
        }




        //Dành cho admin: cập nhật trạng thái phiếu ủng hộ
        [Authorize]
        [HttpPut("duyet")]
        public IActionResult DuyetUngHo(string maUngHo, string trangThai)
        {
            var role = User.FindFirst("VaiTro")?.Value;

            // chỉ admin hoặc thủ kho được duyệt
            if (role != "VT01" && role != "VT02")
                return Forbid("Không có quyền");

            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string sql = @"
                                UPDATE UngHo
                                SET TrangThai = @TrangThai
                                WHERE MaUngHo = @Ma
                                ";

                SqlCommand cmd = new SqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@TrangThai", trangThai);
                cmd.Parameters.AddWithValue("@Ma", maUngHo);

                cmd.ExecuteNonQuery();
            }

            return Ok("Cập nhật trạng thái thành công");
        }

        //THÊM HÀNG ỦNG HỘ
        [Authorize]
        [HttpPost("them-hang")]
        public IActionResult ThemHang(string maUngHo, string maHang, double soLuong)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string sql = @"INSERT INTO ChiTietUngHoHang
                (MaUngHo, MaHang, SoLuong)
                VALUES (@UH, @Hang, @SL)";

                SqlCommand cmd = new SqlCommand(sql, conn);

                cmd.Parameters.AddWithValue("@UH", maUngHo);
                cmd.Parameters.AddWithValue("@Hang", maHang);
                cmd.Parameters.AddWithValue("@SL", soLuong);

                cmd.ExecuteNonQuery();
            }

            return Ok("Thêm hàng thành công");
        }
    }
}

public class TrangThaiRequest
{
    public string? TrangThai { get; set; }
}