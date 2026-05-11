using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using CuuTroAPI.Models;
using System.Collections.Generic;

namespace CuuTroAPI.Controllers
{
    [ApiController]

    [Route("api/[controller]")]
    public class NguoiDungController : ControllerBase
    {
        private readonly IConfiguration _config;

        public NguoiDungController(IConfiguration config)
        {
            _config = config;
        }

        // GET ALL (kèm tên vai trò, trạng thái)
        [HttpGet]
        public IActionResult GetAll()
        {
            string connStr = _config.GetConnectionString("DefaultConnection");

            var users = new List<object>();
            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = @"
                    SELECT nd.MaNguoiDung, nd.HoTen, nd.Email, nd.SoDienThoai, nd.MaVaiTro,
                           vt.TenVaiTro,
                           ISNULL(nd.TrangThai, N'Hoạt động') AS TrangThai
                    FROM NguoiDung nd
                    LEFT JOIN VaiTro vt ON vt.MaVaiTro = nd.MaVaiTro
                    ORDER BY nd.MaNguoiDung
                ";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        users.Add(new
                        {
                            MaNguoiDung = reader["MaNguoiDung"].ToString(),
                            HoTen = reader["HoTen"].ToString(),
                            Email = reader["Email"].ToString(),
                            SoDienThoai = reader["SoDienThoai"].ToString(),
                            MaVaiTro = reader["MaVaiTro"].ToString(),
                            TenVaiTro = reader["TenVaiTro"].ToString(),
                            TrangThai = reader["TrangThai"].ToString()
                        });
                    }
                }
            }

            return Ok(users);
        }

        // GET BY ID 
        [HttpGet("{id}")]
        public IActionResult GetById(string id)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string sql = "SELECT * FROM NguoiDung WHERE MaNguoiDung = @id";

                SqlCommand cmd = new SqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@id", id);

                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    var user = new NguoiDung
                    {
                        MaNguoiDung = reader["MaNguoiDung"].ToString(),
                        HoTen = reader["HoTen"].ToString(),
                        Email = reader["Email"].ToString(),
                        SoDienThoai = reader["SoDienThoai"].ToString(),
                        MaVaiTro = reader["MaVaiTro"].ToString(),
                        TrangThai = reader["TrangThai"].ToString()
                    };

                    return Ok(user);
                }
                else
                {
                    return NotFound("Không tìm thấy");
                }
            }
        }


        // API insert
        [HttpPost]
        public IActionResult Create([FromBody] NguoiDung nd)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                if (string.IsNullOrWhiteSpace(nd.MaNguoiDung))
                {
                    nd.MaNguoiDung = GenerateNextMaNguoiDung(conn);
                }

                string sql = @"
                                INSERT INTO NguoiDung
                                (MaNguoiDung, HoTen, Email, SoDienThoai, MatKhau, DiaChiCuThe, MaThonToDanPho, MaVaiTro, TrangThai)
                                VALUES
                                (@Ma, @Ten, @Email, @SDT, @MK, @DiaChi, @Thon, @VaiTro, @TrangThai)
                                ";

                SqlCommand cmd = new SqlCommand(sql, conn);

                cmd.Parameters.AddWithValue("@Ma", nd.MaNguoiDung);
                cmd.Parameters.AddWithValue("@Ten", nd.HoTen ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Email", nd.Email ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SDT", NullIfEmpty(nd.SoDienThoai));
                cmd.Parameters.AddWithValue("@MK", nd.MatKhau ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DiaChi", NullIfEmpty(nd.DiaChiCuThe));
                cmd.Parameters.AddWithValue("@Thon", NullIfEmpty(nd.MaThonToDanPho));
                cmd.Parameters.AddWithValue("@VaiTro", NullIfEmpty(nd.MaVaiTro));
                cmd.Parameters.AddWithValue("@TrangThai", string.IsNullOrWhiteSpace(nd.TrangThai) ? "Hoạt động" : nd.TrangThai);

                cmd.ExecuteNonQuery();
            }

            return Ok(new { message = "Thêm thành công", MaNguoiDung = nd.MaNguoiDung });
        }


        //Update NguoiDung
        [HttpPut("{id}")]
        public IActionResult Update(string id, [FromBody] NguoiDung nd)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string sql = @"
                            UPDATE NguoiDung
                            SET HoTen = @Ten,
                                Email = @Email,
                                SoDienThoai = @SDT,
                                DiaChiCuThe = @DiaChi,
                                MaThonToDanPho = @Thon,
                                MaVaiTro = @VaiTro,
                                TrangThai = @TrangThai
                            WHERE MaNguoiDung = @Ma
                            ";

                SqlCommand cmd = new SqlCommand(sql, conn);

                cmd.Parameters.AddWithValue("@Ma", id);
                cmd.Parameters.AddWithValue("@Ten", nd.HoTen ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Email", nd.Email ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SDT", NullIfEmpty(nd.SoDienThoai));
                cmd.Parameters.AddWithValue("@DiaChi", NullIfEmpty(nd.DiaChiCuThe));
                cmd.Parameters.AddWithValue("@Thon", NullIfEmpty(nd.MaThonToDanPho));
                cmd.Parameters.AddWithValue("@VaiTro", NullIfEmpty(nd.MaVaiTro));
                cmd.Parameters.AddWithValue("@TrangThai", string.IsNullOrWhiteSpace(nd.TrangThai) ? "Hoạt động" : nd.TrangThai);

                cmd.ExecuteNonQuery();
            }

            return Ok("Cập nhật thành công");
        }

        //Delete NguoiDung
        [HttpDelete("{id}")]
        public IActionResult Delete(string id)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string sql = "DELETE FROM NguoiDung WHERE MaNguoiDung = @Ma";

                SqlCommand cmd = new SqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@Ma", id);

                try
                {
                    cmd.ExecuteNonQuery();
                }
                catch (SqlException ex) when (ex.Number == 547) // FK violation
                {
                    return Conflict(new { message = "Không thể xóa người dùng này vì đang có dữ liệu liên quan (phiếu nhập, phiếu xuất,...). Hãy khóa tài khoản thay vì xóa." });
                }
            }

            return Ok("Xóa thành công");
        }

        // Khóa tài khoản (TrangThai = 'Tạm khóa')
        [HttpPatch("{id}/lock")]
        public IActionResult Lock(string id)
        {
            return SetTrangThai(id, "Tạm khóa");
        }

        // Mở khóa tài khoản (TrangThai = 'Hoạt động')
        [HttpPatch("{id}/unlock")]
        public IActionResult Unlock(string id)
        {
            return SetTrangThai(id, "Hoạt động");
        }

        private IActionResult SetTrangThai(string id, string trangThai)
        {
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = "UPDATE NguoiDung SET TrangThai = @TrangThai WHERE MaNguoiDung = @Ma";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@Ma", id);
                    cmd.Parameters.AddWithValue("@TrangThai", trangThai);
                    int affected = cmd.ExecuteNonQuery();
                    if (affected <= 0)
                    {
                        return NotFound("Không tìm thấy");
                    }
                }
            }

            return Ok(new { message = "Cập nhật trạng thái thành công", TrangThai = trangThai });
        }

        private static string GenerateNextMaNguoiDung(SqlConnection conn)
        {
            string sql = @"
                SELECT MAX(TRY_CAST(SUBSTRING(MaNguoiDung, 3, 10) AS INT)) AS MaxNum
                FROM NguoiDung
                WHERE MaNguoiDung LIKE 'ND%'
            ";
            using (SqlCommand cmd = new SqlCommand(sql, conn))
            {
                object? result = cmd.ExecuteScalar();
                int maxNum = 0;
                if (result != null && result != DBNull.Value)
                {
                    _ = int.TryParse(result.ToString(), out maxNum);
                }
                return $"ND{maxNum + 1}";
            }
        }

        // Trả về DBNull nếu chuỗi null hoặc rỗng (tránh lỗi FK với chuỗi rỗng)
        private static object NullIfEmpty(string? value) =>
            string.IsNullOrWhiteSpace(value) ? DBNull.Value : (object)value;
    }
}