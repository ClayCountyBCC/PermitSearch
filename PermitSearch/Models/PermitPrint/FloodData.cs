using System;
using System.Collections.Generic;
using Dapper;
using System.Linq;
using System.Web;

namespace PermitSearch.Models
{
  public class FloodData
  {
    public string flood_zone_code { get; set; } = "";
    public string fema_map { get; set; } = "";
    public bool special_flood_hazard_area { get; set; } = false;
    public string flood_zone_id { get; set; } = "";
    public string fema_elevation { get; set; } = "";
    public bool conditional_letter_of_map_revision { get; set; } = false;
    
    public FloodData()
    {

    }

    public static List<FloodData> Get(string permit_number)
    {
      if (permit_number.Length == 0) return new List<FloodData>();

      var param = new DynamicParameters();
      param.Add("@permit_number", permit_number);

      var query = @"
        USE WATSC;

        SELECT 
          FloodZone flood_zone_code, 
          FemaMap fema_map, 
          SFHA  special_flood_hazard_area, 
          FZId flood_zone_id, 
          FemaElev fema_elevation, 
          CLOMR conditional_letter_of_map_revision
        FROM bpFLOOD_ZONE F
        INNER JOIN bpBASE_PERMIT B ON B.BaseId = F.BaseId
        WHERE BaseID = @BaseID
      ";

      try
      {
        return Constants.Get_Data<FloodData>("production", query, param);

      }
      catch (Exception ex)
      {
        new ErrorLog(ex, query);
        return new List<FloodData>();
      }


    }
  }
}