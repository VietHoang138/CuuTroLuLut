using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Data.SqlClient;

namespace CuuTroAPI.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class PhieuXuatController : ControllerBase
    {
        private readonly IConfiguration _config;

        public PhieuXuatController(IConfiguration config)
        {
            _config = config;
        }

        // TẠO PHIẾU XUẤT
        [Authorize]
        [HttpPost("create")]
        public IActionResult CreatePhieuXuat(string maDot, string diemDen, string lyDo)
        {
            var userId = User.FindFirst("MaNguoiDung")?.Value;

            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string maPX = "PX" + DateTime.Now.Ticks;

                string sql = @"INSERT INTO PhieuXuat
                (MaPhieuXuat, NgayXuat, MaNguoiLap, MaDot, DiemDen, LyDoXuat)
                VALUES (@Ma, GETDATE(), @ND, @Dot, @Den, @LyDo)";

                SqlCommand cmd = new SqlCommand(sql, conn);

                cmd.Parameters.AddWithValue("@Ma", maPX);
                cmd.Parameters.AddWithValue("@ND", userId);
                cmd.Parameters.AddWithValue("@Dot", maDot);
                cmd.Parameters.AddWithValue("@Den", diemDen);
                cmd.Parameters.AddWithValue("@LyDo", lyDo);

                cmd.ExecuteNonQuery();

                return Ok(new { MaPhieuXuat = maPX });
            }
        }

        // THÊM CHI TIẾT XUẤT (TRIGGER CHECK TỒN KHO)
        [Authorize]
        [HttpPost("them-chi-tiet")]
        public IActionResult ThemChiTiet(string maPX, string maHang, double soLuong)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string maCT = "CTX" + DateTime.Now.Ticks;

                string sql = @"INSERT INTO ChiTietPhieuXuat
                (MaChiTietPhieuXuat, MaPhieuXuat, MaHang, SoLuong)
                VALUES (@Ma, @PX, @Hang, @SL)";

                SqlCommand cmd = new SqlCommand(sql, conn);

                cmd.Parameters.AddWithValue("@Ma", maCT);
                cmd.Parameters.AddWithValue("@PX", maPX);
                cmd.Parameters.AddWithValue("@Hang", maHang);
                cmd.Parameters.AddWithValue("@SL", soLuong);

                cmd.ExecuteNonQuery();

                // Nếu không đủ tồn kho:
                // SQL Trigger sẽ THROW lỗi → API sẽ fail

                return Ok("Xuất hàng thành công");
            }
        }

        //Danh sách phiếu xuất của thủ kho
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
                        SELECT px.MaPhieuXuat, px.NgayXuat, px.TrangThai,
                               nd.HoTen, d.TenDot
                        FROM PhieuXuat px
                        JOIN NguoiDung nd ON px.MaNguoiLap = nd.MaNguoiDung
                        JOIN DotCuuTro d ON px.MaDot = d.MaDot
                        ORDER BY px.NgayXuat DESC
                        ";

                SqlCommand cmd = new SqlCommand(sql, conn);
                SqlDataReader reader = cmd.ExecuteReader();

                while (reader.Read())
                {
                    list.Add(new
                    {
                        MaPhieuXuat = reader["MaPhieuXuat"].ToString(),
                        NgayXuat = reader["NgayXuat"],
                        TrangThai = reader["TrangThai"].ToString(),
                        NguoiLap = reader["HoTen"].ToString(),
                        TenDot = reader["TenDot"].ToString()
                    });
                }
            }

            // trả danh sách cho frontend hiển thị
            return Ok(list);
        }

        // Chi tiết phiếu xuất
        [Authorize]
        [HttpGet("{id}")]
        public IActionResult GetDetail(string id)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                // lấy thông tin phiếu
                string sql1 = @"
                            SELECT px.MaPhieuXuat, px.NgayXuat, px.TrangThai,
                                   px.DiemDen, px.LyDoXuat,
                                   nd.HoTen
                            FROM PhieuXuat px
                            JOIN NguoiDung nd ON px.MaNguoiLap = nd.MaNguoiDung
                            WHERE px.MaPhieuXuat = @id
                            ";

                SqlCommand cmd1 = new SqlCommand(sql1, conn);
                cmd1.Parameters.AddWithValue("@id", id);

                SqlDataReader reader1 = cmd1.ExecuteReader();

                if (!reader1.Read())
                    return NotFound("Không tìm thấy");

                var phieu = new
                {
                    MaPhieuXuat = reader1["MaPhieuXuat"].ToString(),
                    NgayXuat = reader1["NgayXuat"],
                    TrangThai = reader1["TrangThai"].ToString(),
                    DiemDen = reader1["DiemDen"].ToString(),
                    LyDo = reader1["LyDoXuat"].ToString(),
                    NguoiLap = reader1["HoTen"].ToString()
                };

                reader1.Close();

                // lấy chi tiết hàng
                string sql2 = @"
                            SELECT h.TenHang, ct.SoLuong
                            FROM ChiTietPhieuXuat ct
                            JOIN HangCuuTro h ON ct.MaHang = h.MaHang
                            WHERE ct.MaPhieuXuat = @id
                            ";

                SqlCommand cmd2 = new SqlCommand(sql2, conn);
                cmd2.Parameters.AddWithValue("@id", id);

                SqlDataReader reader2 = cmd2.ExecuteReader();

                var listHang = new List<object>();

                while (reader2.Read())
                {
                    listHang.Add(new
                    {
                        TenHang = reader2["TenHang"].ToString(),
                        SoLuong = reader2["SoLuong"]
                    });
                }

                // trả cả thông tin + danh sách hàng
                return Ok(new
                {
                    ThongTin = phieu,
                    DanhSachHang = listHang
                });
            }
        }
    }
}