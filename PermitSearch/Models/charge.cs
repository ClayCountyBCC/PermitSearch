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


    public static List<charge> GetMasterPermitCharges(int permit_number)
    {

      var dp = new DynamicParameters();
      dp.Add("@permit_number", permit_number);
      string sql = @"
        USE PermitSearch;

        WITH TOTAL_FEES_PER_PERMIT AS (
          SELECT
            RP.permit_number,
            SUM(C.amount) fees_due
          FROM charge C
          INNER JOIN related_permit RP ON C.permit_number = RP.permit_number 
            AND RP.master_permit_number = CAST(@permit_number AS INT)
            AND C.cashier_id =''
          GROUP BY RP.permit_number
        )

        SELECT
          item_id,
          permit_number,
          charge_description,
          narrative,
          amount,
          cashier_id
        FROM charge
        WHERE permit_number= CAST(@permit_number AS INT)
        UNION ALL
        SELECT 
          0,
          permit_number,
          '',
          'ASSOC PERMIT FEES DUE',
          fees_due,
          ''
        FROM TOTAL_FEES_PER_PERMIT
        ORDER BY item_id DESC, permit_number ASC";

      return Constants.Get_Data<charge>("Production", sql, dp);

    }
  }
}