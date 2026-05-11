using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Collections.Generic;

namespace CuuTroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhieuXuatController : ControllerBase
    {
        private readonly IConfiguration _config;
        public PhieuXuatController(IConfiguration config) { _config = config; }

        // ─────────────────────────────────────────────
        // GET ALL – danh sách phiếu xuất kèm thông tin
        // ─────────────────────────────────────────────
        [HttpGet]
        public IActionResult GetAll()
        {
            var list = new List<object>();
            string connStr = _config.GetConnectionString("DefaultConnection")!;

            using var conn = new SqlConnection(connStr);
            conn.Open();

            string sql = @"
                SELECT px.MaPhieuXuat,
                       CONVERT(VARCHAR(16), px.NgayXuat, 120)  AS NgayXuat,
                       ISNULL(nl.HoTen, '—')                   AS NguoiLap,
                       px.MaNguoiLap,
                       ISNULL(vc.HoTen, '—')                   AS TaiXe,
                       ISNULL(vc.SoDienThoai, '—')             AS SdtTaiXe,
                       px.MaNguoiVanChuyen,
                       ISNULL(tx.BienSoXe, '—')                AS BienSoXe,
                       ISNULL(tx.LoaiXe, '—')                  AS LoaiXe,
                       ISNULL(d.TenDot, '—')                   AS TenDot,
                       ISNULL(px.MaDot, '')                    AS MaDot,
                       ISNULL(px.TrangThai, N'Chờ xuất kho')   AS TrangThai,
                       ISNULL(px.MaXacNhan, '')                AS MaXacNhan,
                       ISNULL(
                           (SELECT STRING_AGG(h.TenHang + ' x' + CAST(CAST(ct.SoLuong AS INT) AS VARCHAR), ', ')
                            FROM ChiTietPhieuXuat ct
                            JOIN HangCuuTro h ON h.MaHang = ct.MaHang
                            WHERE ct.MaPhieuXuat = px.MaPhieuXuat), N'—'
                       ) AS HangHoa
                FROM PhieuXuat px
                LEFT JOIN NguoiDung nl ON px.MaNguoiLap        = nl.MaNguoiDung
                LEFT JOIN NguoiDung vc ON px.MaNguoiVanChuyen  = vc.MaNguoiDung
                LEFT JOIN TaiXe     tx ON px.MaNguoiVanChuyen  = tx.MaNguoiDung
                LEFT JOIN DotCuuTro d  ON px.MaDot             = d.MaDot
                ORDER BY px.NgayXuat DESC
            ";

            using var cmd = new SqlCommand(sql, conn);
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new
                {
                    MaPhieuXuat      = r["MaPhieuXuat"].ToString(),
                    NgayXuat         = r["NgayXuat"].ToString(),
                    NguoiLap         = r["NguoiLap"].ToString(),
                    MaNguoiLap       = r["MaNguoiLap"].ToString(),
                    TaiXe            = r["TaiXe"].ToString(),
                    SdtTaiXe         = r["SdtTaiXe"].ToString(),
                    MaNguoiVanChuyen = r["MaNguoiVanChuyen"].ToString(),
                    BienSoXe         = r["BienSoXe"].ToString(),
                    LoaiXe           = r["LoaiXe"].ToString(),
                    TenDot           = r["TenDot"].ToString(),
                    MaDot            = r["MaDot"].ToString(),
                    TrangThai        = r["TrangThai"].ToString(),
                    MaXacNhan        = r["MaXacNhan"].ToString(),
                    HangHoa          = r["HangHoa"].ToString()
                });
            }

            return Ok(list);
        }

        // ─────────────────────────────────────────────
        // GET {id} – chi tiết hàng hóa của 1 phiếu
        // ─────────────────────────────────────────────
        [HttpGet("{id}")]
        public IActionResult GetById(string id)
        {
            string connStr = _config.GetConnectionString("DefaultConnection")!;
            using var conn = new SqlConnection(connStr);
            conn.Open();

            string sql = @"
                SELECT ct.MaChiTietPhieuXuat, ct.SoLuong,
                       h.TenHang, h.MaHang,
                       ISNULL(l.DonViTinh, '') AS DonViTinh
                FROM ChiTietPhieuXuat ct
                JOIN HangCuuTro h ON ct.MaHang = h.MaHang
                LEFT JOIN LoaiHang l ON h.MaLoaiHang = l.MaLoaiHang
                WHERE ct.MaPhieuXuat = @id
            ";

            var items = new List<object>();
            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                items.Add(new
                {
                    MaChiTiet = r["MaChiTietPhieuXuat"].ToString(),
                    TenHang   = r["TenHang"].ToString(),
                    MaHang    = r["MaHang"].ToString(),
                    DonViTinh = r["DonViTinh"].ToString(),
                    SoLuong   = r["SoLuong"]
                });
            }

            return Ok(items);
        }

        // ─────────────────────────────────────────────
        // POST – Tạo phiếu xuất mới, sinh MaXacNhan
        // ─────────────────────────────────────────────
        [HttpPost]
        public IActionResult Create([FromBody] PhieuXuatRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.MaNguoiLap))
                return BadRequest(new { message = "Thiếu người lập phiếu." });

            if (req.ChiTiet == null || req.ChiTiet.Count == 0)
                return BadRequest(new { message = "Phiếu xuất phải có ít nhất 1 mặt hàng." });

            string connStr = _config.GetConnectionString("DefaultConnection")!;
            using var conn = new SqlConnection(connStr);
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                string maMoi    = GenerateNextMa(conn, tx);
                string maXacNhan = GenerateMaXacNhan(); // mã 6 ký tự giao cho tài xế

                // Kiểm tra tồn kho trước khi insert
                foreach (var ct in req.ChiTiet)
                {
                    string sqlTon = "SELECT ISNULL(SoLuongTon, 0) FROM HangCuuTro WHERE MaHang = @Hang";
                    using var cmdTon = new SqlCommand(sqlTon, conn, tx);
                    cmdTon.Parameters.AddWithValue("@Hang", ct.MaHang ?? "");
                    var tonObj = cmdTon.ExecuteScalar();
                    double ton = tonObj != null && tonObj != DBNull.Value ? Convert.ToDouble(tonObj) : 0;
                    if (ct.SoLuong > ton)
                        return BadRequest(new { message = $"Hàng '{ct.MaHang}' không đủ tồn kho (tồn: {ton}, yêu cầu: {ct.SoLuong})." });
                }

                // Insert phiếu xuất kèm MaXacNhan
                string sqlPX = @"
                    INSERT INTO PhieuXuat
                        (MaPhieuXuat, NgayXuat, MaNguoiLap, MaNguoiVanChuyen, MaDot, TrangThai, MaXacNhan)
                    VALUES
                        (@Ma, GETDATE(), @NL, @VC, @Dot, @TT, @MaXN)
                ";
                using (var cmdPX = new SqlCommand(sqlPX, conn, tx))
                {
                    cmdPX.Parameters.AddWithValue("@Ma",   maMoi);
                    cmdPX.Parameters.AddWithValue("@NL",   req.MaNguoiLap);
                    cmdPX.Parameters.AddWithValue("@VC",   NullIfEmpty(req.MaNguoiVanChuyen));
                    cmdPX.Parameters.AddWithValue("@Dot",  NullIfEmpty(req.MaDot));
                    cmdPX.Parameters.AddWithValue("@TT",   string.IsNullOrWhiteSpace(req.TrangThai) ? "Chờ xuất kho" : req.TrangThai);
                    cmdPX.Parameters.AddWithValue("@MaXN", maXacNhan);
                    cmdPX.ExecuteNonQuery();
                }

                // Insert chi tiết + trừ tồn kho
                foreach (var ct in req.ChiTiet)
                {
                    string maCT = $"CTX{DateTime.Now.Ticks}{new Random().Next(100)}";

                    string sqlCT = @"
                        INSERT INTO ChiTietPhieuXuat
                            (MaChiTietPhieuXuat, MaPhieuXuat, MaHang, SoLuong)
                        VALUES (@Ma, @PX, @Hang, @SL)
                    ";
                    using (var cmdCT = new SqlCommand(sqlCT, conn, tx))
                    {
                        cmdCT.Parameters.AddWithValue("@Ma",   maCT);
                        cmdCT.Parameters.AddWithValue("@PX",   maMoi);
                        cmdCT.Parameters.AddWithValue("@Hang", ct.MaHang ?? "");
                        cmdCT.Parameters.AddWithValue("@SL",   ct.SoLuong);
                        cmdCT.ExecuteNonQuery();
                    }

                    string sqlTru = "UPDATE HangCuuTro SET SoLuongTon = SoLuongTon - @SL WHERE MaHang = @Hang";
                    using (var cmdTru = new SqlCommand(sqlTru, conn, tx))
                    {
                        cmdTru.Parameters.AddWithValue("@SL",   ct.SoLuong);
                        cmdTru.Parameters.AddWithValue("@Hang", ct.MaHang ?? "");
                        cmdTru.ExecuteNonQuery();
                    }
                }

                tx.Commit();
                return Ok(new
                {
                    message      = "Tạo phiếu xuất thành công.",
                    MaPhieuXuat  = maMoi,
                    MaXacNhan    = maXacNhan   // trả về để hiển thị cho thủ kho giao tài xế
                });
            }
            catch (Exception ex)
            {
                tx.Rollback();
                return StatusCode(500, new { message = $"Lỗi: {ex.Message}" });
            }
        }

        // ─────────────────────────────────────────────
        // PATCH {id}/trang-thai – Xác nhận xuất kho
        // Yêu cầu MaXacNhan khớp với DB mới cho phép
        // ─────────────────────────────────────────────
        [HttpPatch("{id}/trang-thai")]
        public IActionResult UpdateTrangThai(string id, [FromBody] PhieuXuatTrangThaiRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.MaXacNhan))
                return BadRequest(new { message = "Vui lòng nhập mã xác nhận từ tài xế." });

            string connStr = _config.GetConnectionString("DefaultConnection")!;
            using var conn = new SqlConnection(connStr);
            conn.Open();

            // Lấy mã xác nhận đang lưu trong DB
            string sqlGet = "SELECT ISNULL(MaXacNhan, '') FROM PhieuXuat WHERE MaPhieuXuat = @Ma";
            using var cmdGet = new SqlCommand(sqlGet, conn);
            cmdGet.Parameters.AddWithValue("@Ma", id);
            var dbMaXN = cmdGet.ExecuteScalar()?.ToString() ?? "";

            if (string.IsNullOrWhiteSpace(dbMaXN))
                return NotFound(new { message = "Không tìm thấy phiếu xuất." });

            if (!string.Equals(dbMaXN.Trim(), req.MaXacNhan.Trim(), StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Mã xác nhận không đúng. Vui lòng kiểm tra lại với tài xế." });

            // Mã khớp → cập nhật trạng thái
            string sqlUpd = "UPDATE PhieuXuat SET TrangThai = @TT WHERE MaPhieuXuat = @Ma";
            using var cmdUpd = new SqlCommand(sqlUpd, conn);
            cmdUpd.Parameters.AddWithValue("@Ma", id);
            cmdUpd.Parameters.AddWithValue("@TT", req.TrangThai ?? "Đã xuất kho");
            cmdUpd.ExecuteNonQuery();

            return Ok(new { message = "Xác nhận xuất kho thành công." });
        }

        // ─────────────────────────────────────────────
        // Helpers
        // ─────────────────────────────────────────────
        private static string GenerateNextMa(SqlConnection conn, SqlTransaction tx)
        {
            string sql = "SELECT MAX(TRY_CAST(SUBSTRING(MaPhieuXuat, 3, 10) AS INT)) FROM PhieuXuat WHERE MaPhieuXuat LIKE 'PX%'";
            using var cmd = new SqlCommand(sql, conn, tx);
            object? r = cmd.ExecuteScalar();
            int max = (r != null && r != DBNull.Value && int.TryParse(r.ToString(), out int n)) ? n : 0;
            return $"PX{max + 1}";
        }

        /// <summary>Sinh mã xác nhận 6 ký tự chữ hoa + số, dễ đọc, không nhầm lẫn.</summary>
        private static string GenerateMaXacNhan()
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // bỏ 0/O, 1/I dễ nhầm
            var rng = new Random();
            return new string(Enumerable.Range(0, 6).Select(_ => chars[rng.Next(chars.Length)]).ToArray());
        }

        private static object NullIfEmpty(string? v) =>
            string.IsNullOrWhiteSpace(v) ? DBNull.Value : (object)v;
    }

    // ─── Request models ───────────────────────────────
    public class PhieuXuatRequest
    {
        public string? MaNguoiLap        { get; set; }
        public string? MaNguoiVanChuyen  { get; set; }
        public string? MaDot             { get; set; }
        public string? TrangThai         { get; set; }
        public List<ChiTietXuatRequest>? ChiTiet { get; set; }
    }

    public class ChiTietXuatRequest
    {
        public string? MaHang  { get; set; }
        public double  SoLuong { get; set; }
    }

    public class PhieuXuatTrangThaiRequest
    {
        public string? TrangThai  { get; set; }
        public string? MaXacNhan  { get; set; }
    }
}
