using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace PermitSearch.Models
{
  public class charge
  {
    public int item_id { get; set; }
    public int permit_number { get; set; }
    public string charge_description { get; set; }
    public string narrative { get; set; }
    public decimal amount { get; set; }
    public string cashier_id { get; set; }

    public charge()
    {

    }

    public static List<charge> GetCharges(int permit_number)
    {
      var dp = new DynamicParameters();
      dp.Add("@permit_number", permit_number);
      string sql = @"
        USE PermitSearch;

        SELECT
          item_id,
          permit_number,
          charge_description,
          narrative,
          amount,
          cashier_id
        FROM charge
        WHERE permit_number=@permit_number
        ORDER BY item_id DESC";
      return Constants.Get_Data<charge>("Production", sql, dp);
    }
  }
}