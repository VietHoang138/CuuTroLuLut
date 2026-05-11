using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Collections.Generic;

namespace CuuTroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DotCuuTroController : ControllerBase
    {
        private readonly IConfiguration _config;

        public DotCuuTroController(IConfiguration config)
        {
            _config = config;
        }

        // GET ALL
        [HttpGet]
        public IActionResult GetAll()
        {
            string connStr = _config.GetConnectionString("DefaultConnection");
            var list = new List<object>();

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = @"
                    SELECT MaDot, TenDot, MoTa,
                           CONVERT(VARCHAR(10), NgayBatDau, 120) AS NgayBatDau,
                           CONVERT(VARCHAR(10), NgayKetThuc, 120) AS NgayKetThuc,
                           TrangThai,
                           ISNULL(HinhAnh, '') AS HinhAnh
                    FROM DotCuuTro
                    ORDER BY NgayBatDau DESC
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        list.Add(new
                        {
                            MaDot = reader["MaDot"].ToString(),
                            TenDot = reader["TenDot"].ToString(),
                            MoTa = reader["MoTa"].ToString(),
                            NgayBatDau = reader["NgayBatDau"].ToString(),
                            NgayKetThuc = reader["NgayKetThuc"].ToString(),
                            TrangThai = reader["TrangThai"].ToString(),
                            HinhAnh = reader["HinhAnh"].ToString()
                        });
                    }
                }
            }

            return Ok(list);
        }

        // GET BY ID
        [HttpGet("{id}")]
        public IActionResult GetById(string id)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = @"
                    SELECT MaDot, TenDot, MoTa,
                           CONVERT(VARCHAR(10), NgayBatDau, 120) AS NgayBatDau,
                           CONVERT(VARCHAR(10), NgayKetThuc, 120) AS NgayKetThuc,
                           TrangThai
                    FROM DotCuuTro WHERE MaDot = @id
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (!reader.Read()) return NotFound("Không tìm thấy đợt cứu trợ.");
                        return Ok(new
                        {
                            MaDot = reader["MaDot"].ToString(),
                            TenDot = reader["TenDot"].ToString(),
                            MoTa = reader["MoTa"].ToString(),
                            NgayBatDau = reader["NgayBatDau"].ToString(),
                            NgayKetThuc = reader["NgayKetThuc"].ToString(),
                            TrangThai = reader["TrangThai"].ToString()
                        });
                    }
                }
            }
        }

        // POST - Thêm đợt
        [HttpPost]
        public IActionResult Create([FromBody] DotCuuTroRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.TenDot))
                return BadRequest(new { message = "Tên đợt không được để trống." });

            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                if (string.IsNullOrWhiteSpace(req.MaDot))
                    req.MaDot = GenerateNextMa(conn);

                string sql = @"
                    INSERT INTO DotCuuTro (MaDot, TenDot, MoTa, NgayBatDau, NgayKetThuc, TrangThai)
                    VALUES (@Ma, @Ten, @MoTa, @BatDau, @KetThuc, @TrangThai)
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Ma", req.MaDot);
                    cmd.Parameters.AddWithValue("@Ten", req.TenDot);
                    cmd.Parameters.AddWithValue("@MoTa", NullIfEmpty(req.MoTa));
                    cmd.Parameters.AddWithValue("@BatDau", string.IsNullOrWhiteSpace(req.NgayBatDau) ? (object)DBNull.Value : DateTime.Parse(req.NgayBatDau));
                    cmd.Parameters.AddWithValue("@KetThuc", string.IsNullOrWhiteSpace(req.NgayKetThuc) ? (object)DBNull.Value : DateTime.Parse(req.NgayKetThuc));
                    cmd.Parameters.AddWithValue("@TrangThai", NullIfEmpty(req.TrangThai));
                    cmd.ExecuteNonQuery();
                }
            }

            return Ok(new { message = "Thêm đợt cứu trợ thành công.", MaDot = req.MaDot });
        }

        // PUT - Sửa đợt
        [HttpPut("{id}")]
        public IActionResult Update(string id, [FromBody] DotCuuTroRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.TenDot))
                return BadRequest(new { message = "Tên đợt không được để trống." });

            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = @"
                    UPDATE DotCuuTro
                    SET TenDot = @Ten, MoTa = @MoTa,
                        NgayBatDau = @BatDau, NgayKetThuc = @KetThuc, TrangThai = @TrangThai
                    WHERE MaDot = @Ma
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Ma", id);
                    cmd.Parameters.AddWithValue("@Ten", req.TenDot);
                    cmd.Parameters.AddWithValue("@MoTa", NullIfEmpty(req.MoTa));
                    cmd.Parameters.AddWithValue("@BatDau", string.IsNullOrWhiteSpace(req.NgayBatDau) ? (object)DBNull.Value : DateTime.Parse(req.NgayBatDau));
                    cmd.Parameters.AddWithValue("@KetThuc", string.IsNullOrWhiteSpace(req.NgayKetThuc) ? (object)DBNull.Value : DateTime.Parse(req.NgayKetThuc));
                    cmd.Parameters.AddWithValue("@TrangThai", NullIfEmpty(req.TrangThai));
                    cmd.ExecuteNonQuery();
                }
            }

            return Ok("Cập nhật thành công.");
        }

        // DELETE
        [HttpDelete("{id}")]
        public IActionResult Delete(string id)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = "DELETE FROM DotCuuTro WHERE MaDot = @Ma";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Ma", id);
                    try { cmd.ExecuteNonQuery(); }
                    catch (SqlException ex) when (ex.Number == 547)
                    {
                        return Conflict(new { message = "Không thể xóa đợt này vì đang có dữ liệu ủng hộ hoặc phiếu xuất liên quan." });
                    }
                }
            }

            return Ok("Xóa thành công.");
        }

        private static string GenerateNextMa(SqlConnection conn)
        {
            string sql = "SELECT MAX(TRY_CAST(SUBSTRING(MaDot, 2, 10) AS INT)) FROM DotCuuTro WHERE MaDot LIKE 'D%'";
            using (SqlCommand cmd = new SqlCommand(sql, conn))
            {
                object? result = cmd.ExecuteScalar();
                int max = (result != null && result != DBNull.Value && int.TryParse(result.ToString(), out int n)) ? n : 0;
                return $"D{max + 1}";
            }
        }

        private static object NullIfEmpty(string? value) =>
            string.IsNullOrWhiteSpace(value) ? DBNull.Value : (object)value;
    }

    public class DotCuuTroRequest
    {
        public string? MaDot { get; set; }
        public string? TenDot { get; set; }
        public string? MoTa { get; set; }
        public string? NgayBatDau { get; set; }
        public string? NgayKetThuc { get; set; }
        public string? TrangThai { get; set; }
    }
}
