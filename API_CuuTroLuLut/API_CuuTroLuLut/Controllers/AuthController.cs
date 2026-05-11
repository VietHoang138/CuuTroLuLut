using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using CuuTroAPI.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace CuuTroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;

        public AuthController(IConfiguration config)
        {
            _config = config;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDTO login)
        {
            if (string.IsNullOrWhiteSpace(login?.Email) || string.IsNullOrWhiteSpace(login?.MatKhau))
                return BadRequest(new { message = "Vui lòng nhập tài khoản và mật khẩu." });

            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                // Hỗ trợ đăng nhập bằng Email hoặc Số điện thoại
                string sql = @"
                    SELECT MaNguoiDung, HoTen, MaVaiTro,
                           ISNULL(MaThonToDanPho, '') AS MaThonToDanPho
                    FROM NguoiDung
                    WHERE (Email = @TaiKhoan OR SoDienThoai = @TaiKhoan)
                      AND MatKhau = @MatKhau
                      AND ISNULL(TrangThai, N'Hoạt động') <> N'Tạm khóa'
                ";

                SqlCommand cmd = new SqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@TaiKhoan", login.Email ?? "");
                cmd.Parameters.AddWithValue("@MatKhau", login.MatKhau ?? "");

                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    var maNguoiDung = reader["MaNguoiDung"].ToString();
                    var hoTen = reader["HoTen"].ToString();
                    var maVaiTro = reader["MaVaiTro"].ToString();
                    var maThon = reader["MaThonToDanPho"].ToString();

                    var claims = new[]
                    {
                        new Claim("MaNguoiDung", maNguoiDung),
                        new Claim("VaiTro", maVaiTro)
                    };

                    var key = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(_config["Jwt:Key"])
                    );
                    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
                    var token = new JwtSecurityToken(
                        issuer: _config["Jwt:Issuer"],
                        claims: claims,
                        expires: DateTime.Now.AddHours(8),
                        signingCredentials: creds
                    );

                    return Ok(new
                    {
                        token = new JwtSecurityTokenHandler().WriteToken(token),
                        userId = maNguoiDung,
                        hoTen = hoTen,
                        maVaiTro = maVaiTro,
                        maThon = maThon
                    });
                }
            }

            return Unauthorized("Sai tài khoản hoặc mật khẩu.");
        }
    }
}