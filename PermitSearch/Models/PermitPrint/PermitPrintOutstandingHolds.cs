using System;
using System.Collections.Generic;
using Dapper;
using System.Linq;
using System.Web;

namespace PermitSearch.Models.PermitPrint
{
  public class PermitPrintOutstandingHolds
  {
    public string hold { get; set; }

    public PermitPrintOutstandingHolds()
    {
      
    }

    public PermitPrintOutstandingHolds(string holdText)
    {
      hold = holdText;
    }
   
    public static List<PermitPrintOutstandingHolds> Get(string  permit_number)
    {
      var param = new DynamicParameters();
      param.Add("@permit_number", permit_number);

        var query = @"
          USE WATSC;

          SELECT 
            HR.HoldDesc 
          FROM bpHOLD H  
          INNER JOIN bpHOLD_REF HR ON HR.HoldCode = H.HldCd
          WHERE PermitNo = @permit_number
            AND H.Deleted IS NULL 
            AND h.HldDate IS NULL
	          AND HR.Active = 1
  
        ";

      var outstandingHolds = new List<PermitPrintOutstandingHolds>();
      try
      {

        outstandingHolds = Constants.Get_Data<PermitPrintOutstandingHolds>("Production", query, param);
        if (outstandingHolds.Count() == 0)
        {
          outstandingHolds.Add(new PermitPrintOutstandingHolds("No outstanding holds"));
        }


        
      }
      catch (Exception ex)
      {
        new ErrorLog(ex, query);
      }

      return outstandingHolds;

    }
  }
}