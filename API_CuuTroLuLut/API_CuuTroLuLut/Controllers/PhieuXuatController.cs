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
        // GET cho-nhan – Phiếu chưa có tài xế (tài xế xem để nhận)
        // ─────────────────────────────────────────────
        [HttpGet("cho-nhan")]
        public IActionResult GetChoNhan()
        {
            var list = new List<object>();
            string connStr = _config.GetConnectionString("DefaultConnection")!;
            using var conn = new SqlConnection(connStr);
            conn.Open();

            string sql = @"
                SELECT px.MaPhieuXuat,
                       CONVERT(VARCHAR(16), px.NgayXuat, 120)  AS NgayXuat,
                       ISNULL(nl.HoTen, '—')                   AS NguoiLap,
                       ISNULL(nl.SoDienThoai, '—')             AS SdtNguoiLap,
                       ISNULL(d.TenDot, '—')                   AS TenDot,
                       ISNULL(px.MaDot, '')                    AS MaDot,
                       ISNULL(px.TrangThai, N'Chờ xuất kho')   AS TrangThai,
                       ISNULL(
                           (SELECT STRING_AGG(h.TenHang + ' x' + CAST(CAST(ct.SoLuong AS INT) AS VARCHAR), ', ')
                            FROM ChiTietPhieuXuat ct
                            JOIN HangCuuTro h ON h.MaHang = ct.MaHang
                            WHERE ct.MaPhieuXuat = px.MaPhieuXuat), N'—'
                       ) AS HangHoa,
                       ISNULL(
                           (SELECT SUM(ct.SoLuong)
                            FROM ChiTietPhieuXuat ct
                            WHERE ct.MaPhieuXuat = px.MaPhieuXuat), 0
                       ) AS TongSoLuong
                FROM PhieuXuat px
                LEFT JOIN NguoiDung nl ON px.MaNguoiLap = nl.MaNguoiDung
                LEFT JOIN DotCuuTro d  ON px.MaDot      = d.MaDot
                WHERE px.MaNguoiVanChuyen IS NULL
                  AND ISNULL(px.TrangThai, '') NOT IN (N'Đã xuất kho', N'Đã hoàn thành', N'Chờ xác nhận xuất', N'Đang vận chuyển')
                ORDER BY px.NgayXuat DESC
            ";

            using var cmd = new SqlCommand(sql, conn);
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new
                {
                    MaPhieuXuat  = r["MaPhieuXuat"].ToString(),
                    NgayXuat     = r["NgayXuat"].ToString(),
                    NguoiLap     = r["NguoiLap"].ToString(),
                    SdtNguoiLap  = r["SdtNguoiLap"].ToString(),
                    TenDot       = r["TenDot"].ToString(),
                    MaDot        = r["MaDot"].ToString(),
                    TrangThai    = r["TrangThai"].ToString(),
                    HangHoa      = r["HangHoa"].ToString(),
                    TongSoLuong  = r["TongSoLuong"]
                });
            }

            return Ok(list);
        }

        // ─────────────────────────────────────────────
        // GET tai-xe/{maNguoiDung} – Phiếu của tài xế cụ thể
        // ─────────────────────────────────────────────
        [HttpGet("tai-xe/{maNguoiDung}")]
        public IActionResult GetByTaiXe(string maNguoiDung)
        {
            var list = new List<object>();
            string connStr = _config.GetConnectionString("DefaultConnection")!;
            using var conn = new SqlConnection(connStr);
            conn.Open();

            string sql = @"
                SELECT px.MaPhieuXuat,
                       CONVERT(VARCHAR(16), px.NgayXuat, 120)  AS NgayXuat,
                       ISNULL(nl.HoTen, '—')                   AS NguoiLap,
                       ISNULL(nl.SoDienThoai, '—')             AS SdtNguoiLap,
                       ISNULL(d.TenDot, '—')                   AS TenDot,
                       ISNULL(px.MaDot, '')                    AS MaDot,
                       ISNULL(px.TrangThai, N'Chờ xuất kho')   AS TrangThai,
                       ISNULL(px.MaXacNhan, '')                AS MaXacNhan,
                       ISNULL(
                           (SELECT STRING_AGG(h.TenHang + ' x' + CAST(CAST(ct.SoLuong AS INT) AS VARCHAR), ', ')
                            FROM ChiTietPhieuXuat ct
                            JOIN HangCuuTro h ON h.MaHang = ct.MaHang
                            WHERE ct.MaPhieuXuat = px.MaPhieuXuat), N'—'
                       ) AS HangHoa,
                       ISNULL(
                           (SELECT SUM(ct.SoLuong)
                            FROM ChiTietPhieuXuat ct
                            WHERE ct.MaPhieuXuat = px.MaPhieuXuat), 0
                       ) AS TongSoLuong
                FROM PhieuXuat px
                LEFT JOIN NguoiDung nl ON px.MaNguoiLap = nl.MaNguoiDung
                LEFT JOIN DotCuuTro d  ON px.MaDot      = d.MaDot
                WHERE px.MaNguoiVanChuyen = @MaND
                ORDER BY px.NgayXuat DESC
            ";

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@MaND", maNguoiDung);
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new
                {
                    MaPhieuXuat  = r["MaPhieuXuat"].ToString(),
                    NgayXuat     = r["NgayXuat"].ToString(),
                    NguoiLap     = r["NguoiLap"].ToString(),
                    SdtNguoiLap  = r["SdtNguoiLap"].ToString(),
                    TenDot       = r["TenDot"].ToString(),
                    MaDot        = r["MaDot"].ToString(),
                    TrangThai    = r["TrangThai"].ToString(),
                    MaXacNhan    = r["MaXacNhan"].ToString(),
                    HangHoa      = r["HangHoa"].ToString(),
                    TongSoLuong  = r["TongSoLuong"]
                });
            }

            return Ok(list);
        }

        // ─────────────────────────────────────────────
        // PATCH {id}/nhan-chuyen – Tài xế nhận chuyến (yêu cầu MaXacNhan)
        // ─────────────────────────────────────────────
        [HttpPatch("{id}/nhan-chuyen")]
        public IActionResult NhanChuyen(string id, [FromBody] NhanChuyenRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.MaNguoiVanChuyen))
                return BadRequest(new { message = "Thiếu mã tài xế." });

            if (string.IsNullOrWhiteSpace(req.MaXacNhan))
                return BadRequest(new { message = "Vui lòng nhập mã xác nhận từ thủ kho." });

            string connStr = _config.GetConnectionString("DefaultConnection")!;
            using var conn = new SqlConnection(connStr);
            conn.Open();

            // Lấy trạng thái và mã xác nhận hiện tại
            string sqlCheck = "SELECT ISNULL(MaNguoiVanChuyen,''), ISNULL(MaXacNhan,'') FROM PhieuXuat WHERE MaPhieuXuat = @Ma";
            using var cmdCheck = new SqlCommand(sqlCheck, conn);
            cmdCheck.Parameters.AddWithValue("@Ma", id);
            using var rCheck = cmdCheck.ExecuteReader();

            if (!rCheck.Read())
                return NotFound(new { message = "Không tìm thấy phiếu xuất." });

            string existingVC = rCheck.GetString(0);
            string dbMaXN     = rCheck.GetString(1);
            rCheck.Close();

            if (!string.IsNullOrWhiteSpace(existingVC))
                return Conflict(new { message = "Chuyến hàng này đã có tài xế nhận rồi." });

            if (string.IsNullOrWhiteSpace(dbMaXN))
                return BadRequest(new { message = "Phiếu này chưa có mã xác nhận. Liên hệ thủ kho." });

            if (!string.Equals(dbMaXN.Trim(), req.MaXacNhan.Trim(), StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Mã xác nhận không đúng. Vui lòng kiểm tra lại với thủ kho." });

            // Mã khớp → gán tài xế + cập nhật trạng thái "Chờ xác nhận xuất"
            // Thủ kho phải xác nhận lần nữa mới chuyển sang "Đã xuất kho"
            string sqlUpd = @"
                UPDATE PhieuXuat
                SET MaNguoiVanChuyen = @VC,
                    TrangThai = N'Chờ xác nhận xuất'
                WHERE MaPhieuXuat = @Ma
            ";
            using var cmdUpd = new SqlCommand(sqlUpd, conn);
            cmdUpd.Parameters.AddWithValue("@Ma", id);
            cmdUpd.Parameters.AddWithValue("@VC", req.MaNguoiVanChuyen);
            cmdUpd.ExecuteNonQuery();

            return Ok(new { message = "Nhận chuyến thành công. Chúc bạn lái xe an toàn!" });
        }

        // ─────────────────────────────────────────────
        // GET cho-thon/{maDot} – Phiếu đang vận chuyển đến thôn (trưởng thôn xem)
        // ─────────────────────────────────────────────
        [HttpGet("cho-thon/{maDot}")]
        public IActionResult GetChoThon(string maDot)
        {
            var list = new List<object>();
            string connStr = _config.GetConnectionString("DefaultConnection")!;
            using var conn = new SqlConnection(connStr);
            conn.Open();

            string sql = @"
                SELECT px.MaPhieuXuat,
                       CONVERT(VARCHAR(16), px.NgayXuat, 120)  AS NgayXuat,
                       ISNULL(nl.HoTen, '—')                   AS NguoiLap,
                       ISNULL(nl.SoDienThoai, '—')             AS SdtNguoiLap,
                       ISNULL(vc.HoTen, '—')                   AS TaiXe,
                       ISNULL(vc.SoDienThoai, '—')             AS SdtTaiXe,
                       ISNULL(tx.BienSoXe, '—')                AS BienSoXe,
                       ISNULL(d.TenDot, '—')                   AS TenDot,
                       ISNULL(px.MaDot, '')                    AS MaDot,
                       ISNULL(px.TrangThai, N'Đang vận chuyển') AS TrangThai,
                       ISNULL(
                           (SELECT STRING_AGG(h.TenHang + ' x' + CAST(CAST(ct.SoLuong AS INT) AS VARCHAR), ', ')
                            FROM ChiTietPhieuXuat ct
                            JOIN HangCuuTro h ON h.MaHang = ct.MaHang
                            WHERE ct.MaPhieuXuat = px.MaPhieuXuat), N'—'
                       ) AS HangHoa
                FROM PhieuXuat px
                LEFT JOIN NguoiDung nl ON px.MaNguoiLap       = nl.MaNguoiDung
                LEFT JOIN NguoiDung vc ON px.MaNguoiVanChuyen = vc.MaNguoiDung
                LEFT JOIN TaiXe     tx ON px.MaNguoiVanChuyen = tx.MaNguoiDung
                LEFT JOIN DotCuuTro d  ON px.MaDot            = d.MaDot
                WHERE (px.MaDot = @MaDot OR @MaDot = 'all')
                  AND px.TrangThai IN (N'Đang vận chuyển', N'Đã hoàn thành', N'Đã giao thành công')
                ORDER BY px.NgayXuat DESC
            ";

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@MaDot", maDot);
            using var r = cmd.ExecuteReader();
            while (r.Read())
            {
                list.Add(new
                {
                    MaPhieuXuat  = r["MaPhieuXuat"].ToString(),
                    NgayXuat     = r["NgayXuat"].ToString(),
                    NguoiLap     = r["NguoiLap"].ToString(),
                    SdtNguoiLap  = r["SdtNguoiLap"].ToString(),
                    TaiXe        = r["TaiXe"].ToString(),
                    SdtTaiXe     = r["SdtTaiXe"].ToString(),
                    BienSoXe     = r["BienSoXe"].ToString(),
                    TenDot       = r["TenDot"].ToString(),
                    MaDot        = r["MaDot"].ToString(),
                    TrangThai    = r["TrangThai"].ToString(),
                    HangHoa      = r["HangHoa"].ToString()
                });
            }

            return Ok(list);
        }

        // ─────────────────────────────────────────────
        // PATCH {id}/xac-nhan-giao – Trưởng thôn nhập mã OTP từ tài xế
        // Kiểm tra mã → đổi trạng thái "Chờ tài xế xác nhận"
        // ─────────────────────────────────────────────
        [HttpPatch("{id}/xac-nhan-giao")]
        public IActionResult XacNhanGiao(string id, [FromBody] XacNhanGiaoRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.MaOTP))
                return BadRequest(new { message = "Vui lòng nhập mã xác nhận từ tài xế." });

            string connStr = _config.GetConnectionString("DefaultConnection")!;
            using var conn = new SqlConnection(connStr);
            conn.Open();

            // Lấy mã xác nhận trong DB
            string sqlGet = "SELECT ISNULL(MaXacNhan,''), ISNULL(TrangThai,'') FROM PhieuXuat WHERE MaPhieuXuat = @Ma";
            using var cmdGet = new SqlCommand(sqlGet, conn);
            cmdGet.Parameters.AddWithValue("@Ma", id);
            using var rGet = cmdGet.ExecuteReader();
            if (!rGet.Read()) return NotFound(new { message = "Không tìm thấy phiếu xuất." });
            string dbMa = rGet.GetString(0);
            string dbTT = rGet.GetString(1);
            rGet.Close();

            if (!string.Equals(dbMa.Trim(), req.MaOTP.Trim(), StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Mã xác nhận không đúng. Vui lòng kiểm tra lại với tài xế." });

            // Mã đúng → đổi trạng thái chờ tài xế xác nhận
            string sqlUpd = "UPDATE PhieuXuat SET TrangThai = N'Chờ tài xế xác nhận' WHERE MaPhieuXuat = @Ma";
            using var cmdUpd = new SqlCommand(sqlUpd, conn);
            cmdUpd.Parameters.AddWithValue("@Ma", id);
            cmdUpd.ExecuteNonQuery();

            return Ok(new { message = "Xác nhận mã thành công. Đang chờ tài xế xác nhận giao hàng." });
        }

        // ─────────────────────────────────────────────
        // PATCH {id}/hoan-thanh-giao – Tài xế xác nhận đã giao hàng cho trưởng thôn
        // ─────────────────────────────────────────────
        [HttpPatch("{id}/hoan-thanh-giao")]
        public IActionResult HoanThanhGiao(string id)
        {
            string connStr = _config.GetConnectionString("DefaultConnection")!;
            using var conn = new SqlConnection(connStr);
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                // Kiểm tra trạng thái phải là "Chờ tài xế xác nhận"
                string sqlCheck = "SELECT ISNULL(TrangThai,''), ISNULL(MaDot,'') FROM PhieuXuat WHERE MaPhieuXuat = @Ma";
                using var cmdCheck = new SqlCommand(sqlCheck, conn, tx);
                cmdCheck.Parameters.AddWithValue("@Ma", id);
                using var rCheck = cmdCheck.ExecuteReader();
                if (!rCheck.Read()) { tx.Rollback(); return NotFound(new { message = "Không tìm thấy phiếu xuất." }); }
                string tt    = rCheck.GetString(0);
                string maDot = rCheck.GetString(1);
                rCheck.Close();

                if (tt != "Chờ tài xế xác nhận")
                    return BadRequest(new { message = "Phiếu chưa được trưởng thôn xác nhận mã." });

                // Cập nhật phiếu xuất → Đã hoàn thành
                string sqlPX = "UPDATE PhieuXuat SET TrangThai = N'Đã hoàn thành' WHERE MaPhieuXuat = @Ma";
                using (var cmdPX = new SqlCommand(sqlPX, conn, tx))
                {
                    cmdPX.Parameters.AddWithValue("@Ma", id);
                    cmdPX.ExecuteNonQuery();
                }

                // Cập nhật LichSuCapPhat nếu có đợt
                if (!string.IsNullOrWhiteSpace(maDot))
                {
                    string sqlCP = "UPDATE LichSuCapPhat SET TrangThai = N'Đã nhận' WHERE MaDot = @MaDot AND TrangThai = N'Chưa nhận'";
                    using var cmdCP = new SqlCommand(sqlCP, conn, tx);
                    cmdCP.Parameters.AddWithValue("@MaDot", maDot);
                    cmdCP.ExecuteNonQuery();
                }

                tx.Commit();
                return Ok(new { message = "Xác nhận giao hàng thành công!" });
            }
            catch (Exception ex)
            {
                tx.Rollback();
                return StatusCode(500, new { message = $"Lỗi: {ex.Message}" });
            }
        }

        // ─────────────────────────────────────────────
        // PATCH {id}/hoan-thanh – Trưởng thôn xác nhận đã nhận hàng (legacy)
        // ─────────────────────────────────────────────
        [HttpPatch("{id}/hoan-thanh")]
        public IActionResult HoanThanh(string id, [FromBody] HoanThanhRequest req)
        {
            string connStr = _config.GetConnectionString("DefaultConnection")!;
            using var conn = new SqlConnection(connStr);
            conn.Open();
            using var tx = conn.BeginTransaction();

            try
            {
                // Cập nhật trạng thái phiếu xuất
                string sqlPX = "UPDATE PhieuXuat SET TrangThai = N'Đã hoàn thành' WHERE MaPhieuXuat = @Ma";
                using (var cmd = new SqlCommand(sqlPX, conn, tx))
                {
                    cmd.Parameters.AddWithValue("@Ma", id);
                    int affected = cmd.ExecuteNonQuery();
                    if (affected == 0)
                    {
                        tx.Rollback();
                        return NotFound(new { message = "Không tìm thấy phiếu xuất." });
                    }
                }

                // Cập nhật LichSuCapPhat nếu có MaDot
                if (!string.IsNullOrWhiteSpace(req.MaDot) && !string.IsNullOrWhiteSpace(req.MaThon))
                {
                    string sqlCP = @"
                        UPDATE LichSuCapPhat
                        SET TrangThai = N'Đã nhận'
                        WHERE MaDot = @MaDot AND MaThonToDanPho = @MaThon
                          AND TrangThai = N'Chưa nhận'
                    ";
                    using var cmdCP = new SqlCommand(sqlCP, conn, tx);
                    cmdCP.Parameters.AddWithValue("@MaDot",  req.MaDot);
                    cmdCP.Parameters.AddWithValue("@MaThon", req.MaThon);
                    cmdCP.ExecuteNonQuery();
                }

                tx.Commit();
                return Ok(new { message = "Xác nhận nhận hàng thành công." });
            }
            catch (Exception ex)
            {
                tx.Rollback();
                return StatusCode(500, new { message = $"Lỗi: {ex.Message}" });
            }
        }

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
        // PATCH {id}/trang-thai – Cập nhật trạng thái (thủ kho xác nhận xuất)
        // Không cần MaXacNhan — tài xế đã xác nhận bằng mã khi nhận chuyến
        // ─────────────────────────────────────────────
        [HttpPatch("{id}/trang-thai")]
        public IActionResult UpdateTrangThai(string id, [FromBody] PhieuXuatTrangThaiRequest req)
        {
            string connStr = _config.GetConnectionString("DefaultConnection")!;
            using var conn = new SqlConnection(connStr);
            conn.Open();

            string sqlUpd = "UPDATE PhieuXuat SET TrangThai = @TT WHERE MaPhieuXuat = @Ma";
            using var cmdUpd = new SqlCommand(sqlUpd, conn);
            cmdUpd.Parameters.AddWithValue("@Ma", id);
            cmdUpd.Parameters.AddWithValue("@TT", req.TrangThai ?? "Đã xuất kho");
            int affected = cmdUpd.ExecuteNonQuery();

            if (affected == 0) return NotFound(new { message = "Không tìm thấy phiếu." });
            return Ok(new { message = "Cập nhật trạng thái thành công." });
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

    public class NhanChuyenRequest
    {
        public string? MaNguoiVanChuyen { get; set; }
        public string? MaXacNhan        { get; set; }
    }

    public class HoanThanhRequest
    {
        public string? MaDot  { get; set; }
        public string? MaThon { get; set; }
        public string? GhiChu { get; set; }
    }

    public class XacNhanGiaoRequest
    {
        public string? MaOTP  { get; set; }
        public string? GhiChu { get; set; }
    }
}
