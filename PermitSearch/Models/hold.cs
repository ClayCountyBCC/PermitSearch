using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace PermitSearch.Models
{
  public class hold
  {
    public int permit_number { get; set; }
    public string description { get; set; }

    public hold()
    {
    }

    public static List<string> GetHolds(int permit_number)
    {
      var dp = new DynamicParameters();
      dp.Add("@permit_number", permit_number);
      string sql = @"
        USE PermitSearch;

        SELECT
          hold_id,
          permit_number,
          description
        FROM hold
        WHERE permit_number=@permit_number
        ORDER BY hold_id DESC";
      return Constants.Get_Data<string>("Production", sql, dp);
    }
  }
}