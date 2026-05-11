using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Collections.Generic;

namespace CuuTroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TinhThanhPhoController : ControllerBase
    {
        private readonly IConfiguration _config;
        public TinhThanhPhoController(IConfiguration config) { _config = config; }

        [HttpGet]
        public IActionResult GetAll()
        {
            var list = new List<object>();
            using (SqlConnection conn = new SqlConnection(_config.GetConnectionString("DefaultConnection")))
            {
                conn.Open();
                using (SqlCommand cmd = new SqlCommand("SELECT MaTinhThanhPho, TenTinhThanhPho FROM TinhThanhPho ORDER BY TenTinhThanhPho", conn))
                using (SqlDataReader r = cmd.ExecuteReader())
                    while (r.Read())
                        list.Add(new { MaTinhThanhPho = r["MaTinhThanhPho"].ToString(), TenTinhThanhPho = r["TenTinhThanhPho"].ToString() });
            }
            return Ok(list);
        }
    }
}
