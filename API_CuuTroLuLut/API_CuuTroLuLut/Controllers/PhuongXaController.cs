using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Collections.Generic;

namespace CuuTroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhuongXaController : ControllerBase
    {
        private readonly IConfiguration _config;
        public PhuongXaController(IConfiguration config) { _config = config; }

        // GET ALL hoặc lọc theo tỉnh: /api/PhuongXa?maTinh=T1
        [HttpGet]
        public IActionResult GetAll([FromQuery] string? maTinh = null)
        {
            var list = new List<object>();
            using (SqlConnection conn = new SqlConnection(_config.GetConnectionString("DefaultConnection")))
            {
                conn.Open();
                string sql = string.IsNullOrWhiteSpace(maTinh)
                    ? "SELECT MaPhuongXa, TenPhuongXa, MaTinhThanhPho FROM PhuongXa ORDER BY TenPhuongXa"
                    : "SELECT MaPhuongXa, TenPhuongXa, MaTinhThanhPho FROM PhuongXa WHERE MaTinhThanhPho = @maTinh ORDER BY TenPhuongXa";

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    if (!string.IsNullOrWhiteSpace(maTinh))
                        cmd.Parameters.AddWithValue("@maTinh", maTinh);
                    using (SqlDataReader r = cmd.ExecuteReader())
                        while (r.Read())
                            list.Add(new
                            {
                                MaPhuongXa = r["MaPhuongXa"].ToString(),
                                TenPhuongXa = r["TenPhuongXa"].ToString(),
                                MaTinhThanhPho = r["MaTinhThanhPho"].ToString()
                            });
                }
            }
            return Ok(list);
        }
    }
}
