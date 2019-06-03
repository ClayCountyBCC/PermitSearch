using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace PermitSearch.Models
{
  public class permit_note
  {
    public int note_id { get; set; }
    public int permit_number { get; set; }
    public string note { get; set; }
    public string note_type { get; set; }
    public DateTime created_on { get; set; } = DateTime.MinValue;
    public string created_by { get; set; }

    public permit_note() { }


    public static List<permit_note>GetPermitNotes(int permit_number)
    {
      var dp = new DynamicParameters();
      dp.Add("@permit_number", permit_number);
      string sql = @"
        SELECT
          note_id
          ,permit_number
          ,note
          ,note_type
          ,created_on
          ,created_by
        FROM PermitSearch.dbo.permit_note
        WHERE 
          note_visible = 1
          AND permit_number = @permit_number";
      return Constants.Get_Data<permit_note>("Production", sql, dp);
    }

  }
}