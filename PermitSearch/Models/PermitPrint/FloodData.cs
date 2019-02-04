using System;
using System.Collections.Generic;
using Dapper;
using System.Linq;
using System.Web;

namespace PermitSearch.Models
{
  public class FloodData
  {
    public string flood_zone { get; set; } = "";
    public string fema_map { get; set; } = "";
    public bool sfha { get; set; } = false;
    public string fema_elevation { get; set; } = "";
    public bool CLOMR { get; set; } = false;


    public FloodData()
    {

    }


    public static List<FloodData> Get(string permit_number)
    {
      var param = new DynamicParameters();
      param.Add("@permit_number", permit_number);

      var query = @"
        USE WATSC;
        DECLARE @base_id INT = (SELECT BaseId FROM bpMASTER_PERMIT WHERE PermitNo = @permit_number)

        SELECT   FloodZone as FZCd, FemaMap, SFHA, BaseId, FZId, FemaElev, CLOMR 
        FROM [bpFLOOD_ZONE]
        WHERE BaseID = @BaseID
      ";

      try
      {
        var fz = Constants.Get_Data<FloodData>("production", query, param);
        if (fz != null)
        {
          return fz;
        }
      }
      catch (Exception ex)
      {
        new ErrorLog(ex, query);
      }

      return new List<FloodData>();

    }
  }
}