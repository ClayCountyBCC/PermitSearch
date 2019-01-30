using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using Dapper;

namespace PermitSearch.Models
{
  public static class Constants
  {
    public const int appId = 20005;

    public static DateTime GetCachedDateUpdated()
    {
      return MyCache.GetDate("dateupdated");
    }

    public static DateTime GetDateUpdated()
    {
      string sql = @"
        SELECT TOP 1
          updated_on
        FROM PermitSearch.dbo.updated_last";
      return Exec_Scalar<DateTime>("Production", sql);

    }

    public static string GetCS(string cs)
    {
      return ConfigurationManager.ConnectionStrings[cs].ConnectionString;
    }


    public static List<T> Get_Data<T>(string cs, string query, DynamicParameters dbA)
    {
      try
      {
        using (IDbConnection db = new SqlConnection(GetCS(cs)))
        {
          return (List<T>)db.Query<T>(query, dbA);
        }
      }
      catch (Exception ex)
      {
        new ErrorLog(ex, query);
        return null;
      }
    }

    public static T Get_Specific<T>(string cs, string query, DynamicParameters dbA)
    {
      try
      {
        using (IDbConnection db = new SqlConnection(GetCS(cs)))
        {
          return (T)db.Query<T>(query, dbA);
        }
      }
      catch (Exception ex)
      {
        new ErrorLog(ex, query);
        return default(T);
      }
    }

    public static T Exec_Scalar<T>(string cs, string query, DynamicParameters dbA = null)
    {
      try
      {
        using (IDbConnection db = new SqlConnection(GetCS(cs)))
        {
          if (dbA == null)
          {
            return db.ExecuteScalar<T>(query);
          }
          return db.ExecuteScalar<T>(query, dbA);
        }
      }
      catch (Exception ex)
      {
        new ErrorLog(ex, query);
        return default(T);
      }
    }

    public static List<string> GetPermitNotes(string permit_number)
    {

      var param = new DynamicParameters();
      param.Add("@permit_number", permit_number);

      var query = @"
        USE WATSC;

        SELECT CAST(ChrgDesc + ' ' + ISNULL(UnitPrompt,'') + ' ' + CAST(UNIT AS VARCHAR(10)) AS VARCHAR(MAX)) NOTE
        FROM bpAssocChrg AC
        INNER JOIN bpAssocChrgType_Ref ACT ON ACT.ChrgCd = AC.ChrgCd
        WHERE PermitNo = @permit_number
        UNION ALL
        SELECT distinct Note FROM (
        select TOP 500 CAST(Note AS VARCHAR(MAX)) NOTE from bpNotes n
        where permitno = @permit_number
          AND INFOTYPE =  'T'
          ORDER BY N.NoteID DESC) AS TMP;

        
        ";
      var notes = new List<string>();
      try
      {
        
        var tempNoteList = Constants.Get_Data<string>("Production", query, param);
        var stringSeparators = new string[] { "< /br>" , "<p>" };

        foreach (var n in tempNoteList)
        {
          notes.AddRange(n.Split(stringSeparators, StringSplitOptions.None));
        }


      }
      catch (Exception ex)
      {
        new ErrorLog(ex, query);
        notes = new List<string>();
      }

      return notes;
    }

  }
}