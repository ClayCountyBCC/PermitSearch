using System;
using System.Collections.Generic;
using System.Linq;
using Dapper;
using System.Web;

namespace PermitSearch.Models
{
  public class PermitPrintCharges
  {
    public string cashier_id { get; set; } = "";
    public string charge_description { get; set; } = "";
    public decimal amount { get; set; }


    public PermitPrintCharges()
    {
      
    }

    public static List<PermitPrintCharges> Get(string permit_number)
    {
      var param = new DynamicParameters();

      param.Add("@permit_number", permit_number);

      var query = @"
        USE PermitSearch;

        SELECT 
          cashier_id, 
          charge_description, 
          amount 
        FROM charge 
        WHERE permit_number = @permit_number

      ";

      try
      {
        var i = Constants.Get_Data<PermitPrintCharges>("Production", query, param);

        return i;
      }
      catch (Exception ex)
      {
        new ErrorLog(ex, query);
      }
      return new List<PermitPrintCharges>();
    }
    
  }
}