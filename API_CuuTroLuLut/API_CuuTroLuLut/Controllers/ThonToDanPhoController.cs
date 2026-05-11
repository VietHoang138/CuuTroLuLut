using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Collections.Generic;

namespace CuuTroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ThonToDanPhoController : ControllerBase
    {
        private readonly IConfiguration _config;

        public ThonToDanPhoController(IConfiguration config)
        {
            _config = config;
        }

        // GET ALL (kèm tên phường xã, tỉnh thành) hoặc lọc theo phường xã
        [HttpGet]
        public IActionResult GetAll([FromQuery] string? maPhuongXa = null)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");
            var list = new List<object>();

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string where = string.IsNullOrWhiteSpace(maPhuongXa) ? "" : "WHERE t.MaPhuongXa = @maPX";
                string sql = $@"
                    SELECT
                        t.MaThonToDanPho,
                        t.TenThonToDanPho,
                        t.MaPhuongXa,
                        p.TenPhuongXa,
                        p.MaTinhThanhPho,
                        tp.TenTinhThanhPho,
                        (SELECT COUNT(*) FROM NguoiDung nd WHERE nd.MaThonToDanPho = t.MaThonToDanPho) AS SoHoDan
                    FROM ThonToDanPho t
                    LEFT JOIN PhuongXa p ON p.MaPhuongXa = t.MaPhuongXa
                    LEFT JOIN TinhThanhPho tp ON tp.MaTinhThanhPho = p.MaTinhThanhPho
                    {where}
                    ORDER BY t.MaThonToDanPho
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    if (!string.IsNullOrWhiteSpace(maPhuongXa))
                        cmd.Parameters.AddWithValue("@maPX", maPhuongXa);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            list.Add(new
                            {
                                MaThonToDanPho = reader["MaThonToDanPho"].ToString(),
                                TenThonToDanPho = reader["TenThonToDanPho"].ToString(),
                                MaPhuongXa = reader["MaPhuongXa"].ToString(),
                                TenPhuongXa = reader["TenPhuongXa"].ToString(),
                                MaTinhThanhPho = reader["MaTinhThanhPho"].ToString(),
                                TenTinhThanhPho = reader["TenTinhThanhPho"].ToString(),
                                SoHoDan = Convert.ToInt32(reader["SoHoDan"])
                            });
                        }
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
                    SELECT t.MaThonToDanPho, t.TenThonToDanPho, t.MaPhuongXa,
                           p.TenPhuongXa, p.MaTinhThanhPho, tp.TenTinhThanhPho
                    FROM ThonToDanPho t
                    LEFT JOIN PhuongXa p ON p.MaPhuongXa = t.MaPhuongXa
                    LEFT JOIN TinhThanhPho tp ON tp.MaTinhThanhPho = p.MaTinhThanhPho
                    WHERE t.MaThonToDanPho = @id
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@id", id);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return Ok(new
                            {
                                MaThonToDanPho = reader["MaThonToDanPho"].ToString(),
                                TenThonToDanPho = reader["TenThonToDanPho"].ToString(),
                                MaPhuongXa = reader["MaPhuongXa"].ToString(),
                                TenPhuongXa = reader["TenPhuongXa"].ToString(),
                                MaTinhThanhPho = reader["MaTinhThanhPho"].ToString(),
                                TenTinhThanhPho = reader["TenTinhThanhPho"].ToString()
                            });
                        }
                        return NotFound("Không tìm thấy thôn.");
                    }
                }
            }
        }

        // POST - Thêm thôn
        [HttpPost]
        public IActionResult Create([FromBody] ThonRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.TenThonToDanPho))
                return BadRequest(new { message = "Tên thôn không được để trống." });

            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                if (string.IsNullOrWhiteSpace(req.MaThonToDanPho))
                    req.MaThonToDanPho = GenerateNextMa(conn);

                string sql = @"
                    INSERT INTO ThonToDanPho (MaThonToDanPho, TenThonToDanPho, MaPhuongXa)
                    VALUES (@Ma, @Ten, @MaPX)
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Ma", req.MaThonToDanPho);
                    cmd.Parameters.AddWithValue("@Ten", req.TenThonToDanPho);
                    cmd.Parameters.AddWithValue("@MaPX", NullIfEmpty(req.MaPhuongXa));
                    cmd.ExecuteNonQuery();
                }
            }

            return Ok(new { message = "Thêm thôn thành công.", MaThonToDanPho = req.MaThonToDanPho });
        }

        // PUT - Sửa thôn
        [HttpPut("{id}")]
        public IActionResult Update(string id, [FromBody] ThonRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.TenThonToDanPho))
                return BadRequest(new { message = "Tên thôn không được để trống." });

            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = @"
                    UPDATE ThonToDanPho
                    SET TenThonToDanPho = @Ten, MaPhuongXa = @MaPX
                    WHERE MaThonToDanPho = @Ma
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Ma", id);
                    cmd.Parameters.AddWithValue("@Ten", req.TenThonToDanPho);
                    cmd.Parameters.AddWithValue("@MaPX", NullIfEmpty(req.MaPhuongXa));
                    cmd.ExecuteNonQuery();
                }
            }

            return Ok("Cập nhật thành công.");
        }

        // DELETE - Xóa thôn
        [HttpDelete("{id}")]
        public IActionResult Delete(string id)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = "DELETE FROM ThonToDanPho WHERE MaThonToDanPho = @Ma";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Ma", id);
                    try
                    {
                        cmd.ExecuteNonQuery();
                    }
                    catch (SqlException ex) when (ex.Number == 547)
                    {
                        return Conflict(new { message = "Không thể xóa thôn này vì đang có người dùng hoặc dữ liệu liên quan." });
                    }
                }
            }

            return Ok("Xóa thành công.");
        }

        private static string GenerateNextMa(SqlConnection conn)
        {
            string sql = @"
                SELECT MAX(TRY_CAST(SUBSTRING(MaThonToDanPho, 3, 10) AS INT))
                FROM ThonToDanPho WHERE MaThonToDanPho LIKE 'TT%'
            ";
            using (SqlCommand cmd = new SqlCommand(sql, conn))
            {
                object? result = cmd.ExecuteScalar();
                int max = (result != null && result != DBNull.Value && int.TryParse(result.ToString(), out int n)) ? n : 0;
                return $"TT{max + 1}";
            }
        }

        private static object NullIfEmpty(string? value) =>
            string.IsNullOrWhiteSpace(value) ? DBNull.Value : (object)value;
    }

    public class ThonRequest
    {
        public string? MaThonToDanPho { get; set; }
        public string? TenThonToDanPho { get; set; }
        public string? MaPhuongXa { get; set; }
    }
}
