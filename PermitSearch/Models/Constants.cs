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
          return db.ExecuteScalar<T>(query, dbA);
        }
      }
      catch (Exception ex)
      {
        new ErrorLog(ex, query);
        return default(T);
      }
    }

  }
}