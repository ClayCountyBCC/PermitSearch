using System;
using System.Collections.Generic;
using Dapper;
using System.Linq;
using System.Web;

namespace PermitSearch.Models.PermitPrint
{
  public class MasterPermit
  {
    public string permit_number { get; set; } = "";
    public List<PermitPrintCharges> permit_fees { get; set; }
    public List<PermitPrintOutstandingHolds> outstanding_holds { get; set; }
    public List<string> notes { get; set; }

    public MasterPermit()
    {

    }

    public static MasterPermit GetPermit(string permit_number)
    {
      var permit = GetPermitRaw(permit_number);

      permit.permit_fees = PermitPrintCharges.Get(permit.permit_number);
      permit.outstanding_holds = PermitPrintOutstandingHolds.Get(permit.permit_number);
      permit.notes = Constants.GetPermitNotes(permit.permit_number);


      return new MasterPermit();
    }

    public static MasterPermit GetPermitRaw(string permit_number)
    {
      var i = new MasterPermit();
      i.permit_number = permit_number;
      return i;
    }


  }
}