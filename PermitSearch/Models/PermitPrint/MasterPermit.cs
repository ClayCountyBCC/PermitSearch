using System;
using System.Collections.Generic;
using Dapper;
using System.Linq;
using System.Web;

namespace PermitSearch.Models
{
  public class MasterPermit
  {
    public bool confidential { get; set; } = false;
    public int base_id { get; set; } = -1;
    public string permit_type_label { get; set; } = "";
    public string permit_number { get; set; } = "";
    public DateTime issue_date { get; set; } = DateTime.MinValue;
    public string parcel_number { get; set; } = "";
    public decimal valuation { get; set; }
    public string clearance_sheet { get; set; } = "";
    public string legal { get; set; } = "";
    public int square_footage { get; set; } = -1;
    public int stories { get; set; } = -1;
    public int max_height { get; set; } = -1;
    public string prop_use_code { get; set; } = "";
    public string use_description { get; set; } = "";
    public bool prop_use_co { get; set; } = false;
    public DateTime temp_co_date { get; set; } = DateTime.MinValue;
    public int temp_co_date_days { get; set; } = -1;
    public string project_name { get; set; } = "";
    public string project_address { get; set; } = "";
    public string owner_name { get; set; } = "";
    public string owner_address { get; set; } = "";
    public string contractor_id { get; set; } = "";
    public string contractor_data_line1 { get; set; } = "";
    public string contractor_data_line2 { get; set; } = ""; 
    public string contractor_data_line3 { get; set; } = "";
    public char set_back_type { get; set; }
    public char set_back { get; set; }
    public string front { get; set; } = "";
    public string side { get; set; } = "";
    public string rear { get; set; } = "";
    public DateTime void_date { get; set; } = DateTime.MinValue;
    public string construction_type { get; set; } = "";
    public char co_closed_type { get; set; }
    public List<PermitPrintCharges> permit_fees { get; set; }
    public List<PermitPrintOutstandingHolds> outstanding_holds { get; set; }
    public List<string> notes { get; set; }
    public List<string> occupancy_class 
    { 
      get 
      {
        return GetOccupancyClass();
      } 
    }

    public List<FloodData> flood_data 
    { 
      get 
      {
        return FloodData.Get(permit_number);
      } 
      
    }


    public MasterPermit()
    {

    }

    public static MasterPermit GetPermit(string permit_number)
    {
      var permit = GetPermitRaw(permit_number);
  
      permit.permit_fees = PermitPrintCharges.Get(permit.permit_number);
      permit.outstanding_holds = PermitPrintOutstandingHolds.Get(permit.permit_number);
      permit.notes = Models.permit.GetPermitNotes(permit.permit_number);


      return new MasterPermit();
    }

    public static MasterPermit GetPermitRaw(string permit_number)
    {

      var param = new DynamicParameters();
      param.Add("@permit_number", permit_number);

      var query = @"
        USE WATSC;

        SELECT DISTINCT 
            B.BaseId base_id,
            permit_type_label = 
            CASE Left(@permit_number, 1) 
              WHEN '1' THEN 'Building'
              WHEN '2' THEN 'Electrical'
              WHEN '3' THEN 'Plumbing'
              WHEN '4' THEN 'Mechanical'
              WHEN '6' THEN 'Fire'
              WHEN '7' THEN 'Mobile Home'
              WHEN '8' THEN 'Irrigation'
              ELSE ''
            END,
            M.PermitNo permit_number,
            M.IssueDate issue_date, 
            CASE WHEN confidential = 1 THEN 'Confidential' ELSE B.ParcelNo  END parcel_number, 
            B.valuation, 
            B.ClrSht clearance_sheet, 
            CASE WHEN confidential = 1 THEN 'Confidential' ELSE B.LEGAL END legal, 
            B.SqFt square_footage,
            stories,
            B.MaxHeight max_height,
            B.PropUseCode prop_use_code,
            PR.UseDescription use_description, 
            PR.CO prop_use_co, 
            M.TempCoDate temp_co_date, 
            M.TempCoDateDays temp_co_date_days, 
            CASE WHEN confidential = 1 THEN 'Confidential 
              ELSE ISNULL(B.ProjName, '') END  project_name, 
            CASE WHEN confidential = 1 THEN 'Confidential' 
             ELSE RTRIM(ISNULL(B.ProjAddrCombined, '')) + ', ' + 
                  RTRIM(ISNULL(B.ProjCity, '')) + ' FL ' + 
                  ISNULL(B.ProjZip, '') END project_address,
            CASE WHEN confidential = 1 THEN 'Confidential 
              ELSE B.OwnerName END owner_name, 
            CASE WHEN confidential = 1 THEN 'Confidential 
              ELSE RTRIM(ISNULL(B.OwnerStreet, '')) + '  ' + 
                   RTRIM(ISNULL(B.OwnerCity, '')) + '  ' + 
                   RTRIM(ISNULL(B.OwnerState, ''))+ '  ' + 
                   RTRIM(ISNULL(B.OwnerZip, '')) END owner_address, 

	          RTRIM(ISNULL(clCustomer.CustomerName,'')) + '  *  ' + 
              RTRIM(ISNULL(C.CompanyName,'')) contractor_data_line1, 

            RTRIM(ISNULL(C1.Address1, '')) + '  ' + 
              RTRIM(ISNULL(C1.Address2, '')) + ' ' + 
              RTRIM(ISNULL(C1.City, '')) + ' ' + 
              RTRIM(ISNULL(C1.State, '')) + ' ' + 
              RTRIM(ISNULL(C1.Zip, '')) AS contractor_data_line2, 

            RTRIM(ISNULL(B.ContractorId, '')) + ' phone: ' + 
              RTRIM(ISNULL(C1.Phone1, '')) + ' fax: ' + 
              RTRIM(ISNULL(C1.Fax, '')) AS contractor_data_line3, 

            B.SetbackType set_back_type, 
            B.Setback set_back, 
            B.front, 
            B.side, 
            B.rear, 
            ISNULL(M.VoidDate, '') AS void_date, 
            B.ConstrType construction_type, 
            B.OccLoad occupation_load, 
            B.FireSprinkler fire_sprinkler, 
            dbo.bpCategory_Codes.Description AS code_edition, 
            bpCategory_Codes_1.Description AS construction_type, 
            M.CoClosedType co_closed_type
          FROM bpMASTER_PERMIT M
            INNER JOIN bpBASE_PERMIT B ON M.BaseID = B.BaseID
            INNER JOIN bpPROPUSE_REF PR ON B.PropUseCode = PR.UseCode
            LEFT OUTER JOIN bpASSOC_PERMIT A ON A.BaseID = B.BaseID
            LEFT OUTER JOIN clCustomer AS C1 ON B.ContractorId = C1.ContractorCd 
            LEFT OUTER JOIN bpPROPUSE_REF ON B.PropUseCode = bpPROPUSE_REF.UseCode 
            LEFT OUTER JOIN bpCategory_Codes ON B.CodeEdition = bpCategory_Codes.Code AND bpCategory_Codes.Type_Code = 107 
            LEFT OUTER JOIN bpCategory_Codes AS bpCategory_Codes_1 ON B.ConstrType = bpCategory_Codes_1.Code AND bpCategory_Codes.Type_Code = 109
          WHERE M.PermitNo = @permit_number

      ";
      try
      {
        var master_permit = Constants.Get_Data<MasterPermit>("production", query, param).First();
        if(master_permit == null)
        {
          return new MasterPermit();
        }
        return master_permit;
      }
      catch(Exception ex)
      {
        new ErrorLog(ex, query);
        return null;
      }

      
    }

    public List<string> GetOccupancyClass()
    {

      var param = new DynamicParameters();
      param.Add("@permit_number", permit_number);

      var query = @"
      
        USE WATSC;

        WITH ClearanceSheets AS (
          SELECT DISTINCT ClrSht
          FROM bpBASE_PERMIT B
          INNER JOIN bpMASTER_PERMIT M ON M.BaseID = B.BaseId
          WHERE M.PermitNo = @permit_number)

        SELECT 
          CC.Description OccClass
        FROM bpOccClass O
        INNER JOIN bpCategory_Codes CC ON O.Code = CC.Code AND CC.Type_Code = 108
        WHERE O.Clrsht IN (SELECT Clrsht FROM ClearanceSheets)
      
      ";
      try
      {
        var oc = Constants.Get_Data<string>("production", query, param);

        if (oc == null)
        {
          oc = new List<string>();
        }

        return oc;
      }
      catch (Exception ex)
      {
        new ErrorLog(ex, query);
        return new List<string>();
        }
      
    }
  }
}