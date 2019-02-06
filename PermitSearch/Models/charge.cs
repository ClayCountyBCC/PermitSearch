using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace PermitSearch.Models
{
  public class charge
  {
    public int item_id { get; set; } = -1;
    public int permit_number { get; set; } = -1;
    public string charge_description { get; set; } = "";
    public string narrative { get; set; } = "";
    public decimal amount { get; set; } = -1;
    public string cashier_id { get; set; } = "";

    public charge()
    {

    }

    public static List<charge> GetCharges(int permit_number)
    {
      if (permit_number <= 0)
      {
        return new List<charge>();
      }

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


    public static string GetAssocPermitFeesDue(string permit_number)
    {

      var dp = new DynamicParameters();
      dp.Add("@permit_number", permit_number);
      string sql = @"

          WITH ASSOC_PERMITS AS (
          SELECT PermitNo
          FROM bpASSOC_PERMIT
          WHERE BaseId = @BaseId)

          SELECT 'Assoc Permit Fee Due', COUNT(*), SUM(TOTAL) FROM (
            SELECT * FROM ccCashierItem CI
            INNER JOIN ASSOC_PERMITS A ON CI.AssocKey = A.PermitNo
            WHERE CatCode IS NOT NULL
              AND CashierId IS NULL
          ) AS TMP
          having count(*) > 0

       ";
      return Constants.Get_Data<string>("Production", sql, dp).FirstOrDefault();

    }
  }
}