using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Collections.Generic;

namespace CuuTroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VaiTroController : ControllerBase
    {
        private readonly IConfiguration _config;

        public VaiTroController(IConfiguration config)
        {
            _config = config;
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            string connStr = _config.GetConnectionString("DefaultConnection");
            var roles = new List<object>();

            using (SqlConnection conn = new SqlConnection(connStr))
            {
                conn.Open();
                string sql = "SELECT MaVaiTro, TenVaiTro, TrangThai FROM VaiTro ORDER BY MaVaiTro";
                using (SqlCommand cmd = new SqlCommand(sql, conn))
                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        roles.Add(new
                        {
                            MaVaiTro = reader["MaVaiTro"].ToString(),
                            TenVaiTro = reader["TenVaiTro"].ToString(),
                            TrangThai = reader["TrangThai"].ToString()
                        });
                    }
                }
            }

            return Ok(roles);
        }
    }
}

