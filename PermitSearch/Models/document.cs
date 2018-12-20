using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace PermitSearch.Models
{
  public class document
  {
    public int table_number { get; set; }
    public int object_id { get; set; }
    public int permit_number { get; set; }
    public string document_type { get; set; }
    public int page_count { get; set; }
    public DateTime created_on { get; set; }

    public document()
    {

    }

    public static List<document> GetDocuments(int permit_number) 
    {
      var dp = new DynamicParameters();
      dp.Add("@permit_number", permit_number);
      string sql = @"
        USE PermitSearch;

        SELECT
          table_number,
          object_id,
          permit_number,
          document_type,
          page_count,
          created_on
        FROM document
        WHERE permit_number=@permit_number
        ORDER BY created_on DESC;";
      return Constants.Get_Data<document>("Production", sql, dp);
    }

  }
}