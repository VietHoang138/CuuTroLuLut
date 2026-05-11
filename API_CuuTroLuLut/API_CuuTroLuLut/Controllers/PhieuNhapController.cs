using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Collections.Generic;

namespace CuuTroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhieuNhapController : ControllerBase
    {
        private readonly IConfiguration _config;
        public PhieuNhapController(IConfiguration config) { _config = config; }

        // GET ALL - kèm thông tin người lập, tài xế, ủng hộ, đợt
        [HttpGet]
        public IActionResult GetAll()
        {
            var list = new List<object>();
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = @"
                    SELECT pn.MaPhieuNhap,
                           CONVERT(VARCHAR(16), pn.NgayNhap, 120) AS NgayNhap,
                           nd.HoTen AS NguoiLap,
                           nd.MaNguoiDung,
                           vc.HoTen AS TaiXe,
                           vc.SoDienThoai AS SdtTaiXe,
                           vc.MaNguoiDung AS MaTaiXe,
                           ISNULL(tx.BienSoXe, N'—') AS BienSoXe,
                           ISNULL(tx.LoaiXe, N'—') AS LoaiXe,
                           uh.MaUngHo,
                           d.TenDot,
                           d.MaDot,
                           ISNULL(pn.NguonHang, ISNULL(nd_uh.HoTen, '—')) AS NguonHang,
                           ISNULL(pn.TrangThai, N'Chờ xác nhận') AS TrangThai,
                           ISNULL(
                               (SELECT STRING_AGG(h.TenHang + ' x' + CAST(CAST(ct.SoLuongThucNhap AS INT) AS VARCHAR), ', ')
                                FROM ChiTietPhieuNhap ct
                                JOIN HangCuuTro h ON h.MaHang = ct.MaHang
                                WHERE ct.MaPhieuNhap = pn.MaPhieuNhap), N'—'
                           ) AS HangHoa
                    FROM PhieuNhap pn
                    JOIN NguoiDung nd ON pn.MaNguoiDung = nd.MaNguoiDung
                    LEFT JOIN NguoiDung vc ON pn.NguoiVanChuyen = vc.MaNguoiDung
                    LEFT JOIN UngHo uh ON pn.MaUngHo = uh.MaUngHo
                    LEFT JOIN NguoiDung nd_uh ON uh.MaNguoiDung = nd_uh.MaNguoiDung
                    LEFT JOIN DotCuuTro d ON uh.MaDot = d.MaDot
                    LEFT JOIN TaiXe tx ON vc.MaNguoiDung = tx.MaNguoiDung
                    ORDER BY pn.NgayNhap DESC
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                using (SqlDataReader r = cmd.ExecuteReader())
                {
                    while (r.Read())
                    {
                        list.Add(new
                        {
                            MaPhieuNhap = r["MaPhieuNhap"].ToString(),
                            NgayNhap = r["NgayNhap"].ToString(),
                            NguoiLap = r["NguoiLap"].ToString(),
                            MaNguoiDung = r["MaNguoiDung"].ToString(),
                            TaiXe = r["TaiXe"].ToString(),
                            SdtTaiXe = r["SdtTaiXe"].ToString(),
                            MaTaiXe = r["MaTaiXe"].ToString(),
                            BienSoXe = r["BienSoXe"].ToString(),
                            LoaiXe = r["LoaiXe"].ToString(),
                            MaUngHo = r["MaUngHo"].ToString(),
                            TenDot = r["TenDot"].ToString(),
                            MaDot = r["MaDot"].ToString(),
                            NguonHang = r["NguonHang"].ToString(),
                            TrangThai = r["TrangThai"].ToString(),
                            HangHoa = r["HangHoa"].ToString()
                        });
                    }
                }
            }
            return Ok(list);
        }

        // GET chi tiết 1 phiếu
        [HttpGet("{id}")]
        public IActionResult GetById(string id)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = @"
                    SELECT ct.MaChiTietPhieuNhap, ct.SoLuongChungTu, ct.SoLuongThucNhap, ct.ChenhLech,
                           h.TenHang, h.MaHang, l.DonViTinh
                    FROM ChiTietPhieuNhap ct
                    JOIN HangCuuTro h ON ct.MaHang = h.MaHang
                    JOIN LoaiHang l ON h.MaLoaiHang = l.MaLoaiHang
                    WHERE ct.MaPhieuNhap = @id
                ";
                var items = new List<object>();
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    using (SqlDataReader r = cmd.ExecuteReader())
                        while (r.Read())
                            items.Add(new
                            {
                                MaChiTiet = r["MaChiTietPhieuNhap"].ToString(),
                                TenHang = r["TenHang"].ToString(),
                                MaHang = r["MaHang"].ToString(),
                                DonViTinh = r["DonViTinh"].ToString(),
                                SoLuongChungTu = r["SoLuongChungTu"],
                                SoLuongThucNhap = r["SoLuongThucNhap"],
                                ChenhLech = r["ChenhLech"]
                            });
                }
                return Ok(items);
            }
        }

        // POST - Tạo phiếu nhập mới
        [HttpPost]
        public IActionResult Create([FromBody] PhieuNhapRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.MaNguoiDung))
                return BadRequest(new { message = "Thiếu người lập phiếu." });

            string connStr = _config.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string maMoi = GenerateNextMa(conn);

                string sql = @"
                    INSERT INTO PhieuNhap (MaPhieuNhap, MaNguoiDung, MaUngHo, NguoiVanChuyen, NguonHang, TrangThai, NgayNhap)
                    VALUES (@Ma, @ND, @UH, @VC, @NH, @TT, GETDATE())
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Ma", maMoi);
                    cmd.Parameters.AddWithValue("@ND", req.MaNguoiDung);
                    cmd.Parameters.AddWithValue("@UH", NullIfEmpty(req.MaUngHo));
                    cmd.Parameters.AddWithValue("@VC", NullIfEmpty(req.NguoiVanChuyen));
                    cmd.Parameters.AddWithValue("@NH", NullIfEmpty(req.NguonHang));
                    cmd.Parameters.AddWithValue("@TT", string.IsNullOrWhiteSpace(req.TrangThai) ? "Chờ xác nhận" : req.TrangThai);
                    cmd.ExecuteNonQuery();
                }

                // Thêm chi tiết hàng hóa nếu có
                if (req.ChiTiet != null)
                {
                    foreach (var ct in req.ChiTiet)
                    {
                        string maCT = "CTPN" + DateTime.Now.Ticks + new Random().Next(100);
                        string sqlCT = @"
                            INSERT INTO ChiTietPhieuNhap
                            (MaChiTietPhieuNhap, MaPhieuNhap, MaHang, SoLuongChungTu, SoLuongThucNhap, ChenhLech)
                            VALUES (@Ma, @PN, @Hang, @SLCT, @SLThuc, @CL)
                        ";
                        using (SqlCommand cmd2 = new SqlCommand(sqlCT, conn))
                        {
                            cmd2.Parameters.AddWithValue("@Ma", maCT);
                            cmd2.Parameters.AddWithValue("@PN", maMoi);
                            cmd2.Parameters.AddWithValue("@Hang", ct.MaHang ?? "");
                            cmd2.Parameters.AddWithValue("@SLCT", ct.SoLuongChungTu);
                            cmd2.Parameters.AddWithValue("@SLThuc", ct.SoLuongThucNhap);
                            cmd2.Parameters.AddWithValue("@CL", ct.SoLuongThucNhap - ct.SoLuongChungTu);
                            cmd2.ExecuteNonQuery();
                        }

                        // Cập nhật tồn kho
                        string sqlTon = "UPDATE HangCuuTro SET SoLuongTon = SoLuongTon + @SL WHERE MaHang = @Hang";
                        using (SqlCommand cmd3 = new SqlCommand(sqlTon, conn))
                        {
                            cmd3.Parameters.AddWithValue("@SL", ct.SoLuongThucNhap);
                            cmd3.Parameters.AddWithValue("@Hang", ct.MaHang ?? "");
                            cmd3.ExecuteNonQuery();
                        }
                    }
                }
            }
            return Ok(new { message = "Tạo phiếu nhập thành công." });
        }

        // PATCH - Cập nhật trạng thái phiếu nhập
        [HttpPatch("{id}/trang-thai")]
        public IActionResult UpdateTrangThai(string id, [FromBody] PhieuNhapTrangThaiRequest req)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = "UPDATE PhieuNhap SET TrangThai = @TrangThai WHERE MaPhieuNhap = @Ma";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Ma", id);
                    cmd.Parameters.AddWithValue("@TrangThai", req.TrangThai ?? "Đã xác nhận");
                    int affected = cmd.ExecuteNonQuery();
                    if (affected == 0) return NotFound("Không tìm thấy phiếu.");
                }
            }
            return Ok(new { message = "Cập nhật thành công." });
        }

        private static string GenerateNextMa(SqlConnection conn)
        {
            string sql = "SELECT MAX(TRY_CAST(SUBSTRING(MaPhieuNhap, 3, 10) AS INT)) FROM PhieuNhap WHERE MaPhieuNhap LIKE 'PN%'";
            using (SqlCommand cmd = new SqlCommand(sql, conn))
            {
                object? r = cmd.ExecuteScalar();
                int max = (r != null && r != DBNull.Value && int.TryParse(r.ToString(), out int n)) ? n : 0;
                return $"PN{max + 1}";
            }
        }

        private static object NullIfEmpty(string? v) =>
            string.IsNullOrWhiteSpace(v) ? DBNull.Value : (object)v;
    }

    public class PhieuNhapRequest
    {
        public string? MaNguoiDung { get; set; }
        public string? MaUngHo { get; set; }
        public string? NguoiVanChuyen { get; set; }
        public string? NguonHang { get; set; }
        public string? TrangThai { get; set; }
        public List<ChiTietNhapRequest>? ChiTiet { get; set; }
    }

    public class PhieuNhapTrangThaiRequest
    {
        public string? TrangThai { get; set; }
    }

    public class ChiTietNhapRequest
    {
        public string? MaHang { get; set; }
        public double SoLuongChungTu { get; set; }
        public double SoLuongThucNhap { get; set; }
    }
}
