using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Data.SqlClient;
using CuuTroAPI.Models;
using API_CuuTroLuLut.Models;

namespace CuuTroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HangCuuTroController : ControllerBase
    {
        private readonly IConfiguration _config;

        // 🔥 constructor để lấy config
        public HangCuuTroController(IConfiguration config)
        {
            _config = config;
        }

        //Danh sách hàng cứu trợ (cho dropdown + hiển thị tồn kho)
        [HttpGet]
        public IActionResult GetAll()
        {
            var list = new List<object>();
            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string sql = @"
                            SELECT h.MaHang, h.TenHang, h.SoLuongTon,
                                   l.TenLoaiHang
                            FROM HangCuuTro h
                            JOIN LoaiHang l ON h.MaLoaiHang = l.MaLoaiHang
                            ";

                SqlCommand cmd = new SqlCommand(sql, conn);
                SqlDataReader reader = cmd.ExecuteReader();

                while (reader.Read())
                {
                    list.Add(new
                    {
                        MaHang = reader["MaHang"].ToString(),
                        TenHang = reader["TenHang"].ToString(),
                        SoLuongTon = reader["SoLuongTon"],
                        TenLoai = reader["TenLoaiHang"].ToString()
                    });
                }
            }

            // dùng cho dropdown + hiển thị tồn kho
            return Ok(list);
        }



        /// 🔹 Chỉ admin mới được thêm hàng cứu trợ
        [Authorize]
        [HttpPost]
        public IActionResult Create(HangCuuTro h)
        {
            var role = User.FindFirst("VaiTro")?.Value;

            if (role != "VT01") // admin
                return Forbid("Không có quyền");

            string connStr = _config.GetConnectionString("DefaultConnection");

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();

                string sql = @"INSERT INTO HangCuuTro
                            (MaHang, TenHang, MaLoaiHang, SoLuongTon, MoTa)
                            VALUES (@Ma, @Ten, @Loai, @SL, @MoTa)";

                SqlCommand cmd = new SqlCommand(sql, conn);

                cmd.Parameters.AddWithValue("@Ma", h.MaHang);
                cmd.Parameters.AddWithValue("@Ten", h.TenHang);
                cmd.Parameters.AddWithValue("@Loai", h.MaLoaiHang);
                cmd.Parameters.AddWithValue("@SL", h.SoLuongTon);
                cmd.Parameters.AddWithValue("@MoTa", h.MoTa);

                cmd.ExecuteNonQuery();
            }

            return Ok("Thêm hàng thành công");
        }
    }
}