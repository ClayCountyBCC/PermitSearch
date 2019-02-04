using System;
using System.Collections.Generic;
using Dapper;
using System.Linq;
using System.Web;

namespace PermitSearch.Models
{
  public class MasterPermit
  {
    public int base_id { get; set; } = -1;
    public string permit_type_label { get; set; } = "";
    public string permit_number { get; set; } = "";
    public DateTime issue_date { get; set; } = DateTime.MinValue;
    public string parcel_number { get; set; } = "";
    public decimal valuation { get; set; } = -1;
    public string clearance_sheet { get; set; } = "";
    public string legal { get; set; } = "";
    public int square_footage { get; set; } = -1;
    public int stories { get; set; } = -1;
    public string max_height { get; set; } = "";
    public string prop_use_code { get; set; } = "";
    public string use_description { get; set; } = "";
    public bool prop_use_co { get; set; } = false;
    public DateTime temp_co_date { get; set; } = DateTime.MinValue;
    public int temp_co_date_days { get; set; } = -1;
    public string project_name { get; set; } = "";
    public string project_address { get; set; } = "";
    public string owner_name { get; set; } = "";
    public string owner_address { get; set; } = "";
    public string contractor_data_line1 { get; set; } = "";
    public string contractor_data_line2 { get; set; } = ""; 
    public string contractor_data_line3 { get; set; } = "";
    public char set_back_type { get; set; } = ' ';
    public char set_back { get; set; } = ' ';
    public string front { get; set; } = "";
    public string side { get; set; } = "";
    public string rear { get; set; } = "";
    public DateTime void_date { get; set; } = DateTime.MinValue;
    public string construction_type { get; set; } = "";
    public int occupation_load { get; set; } = -1;
    public char co_closed_type { get; set; } = ' ';

    public List<FloodData> flood_data
    {
      get
      {
        return FloodData.Get(permit_number);
      }
    }

    public List<charge> permit_fees
    {
      get
      {
        return charge.GetCharges(int.Parse(permit_number));
      }
    }

    public List<string> notes
    {
      get
      {
        return permit.GetPermitNotes(permit_number);
      }
    }

    public List<string> outstanding_holds
    {
      get
      {
        return permit.GetOutstandingHolds(permit_number);
      }
    }

    public List<string> occupancy_class
    {
      get
      {
        return GetOccupancyClass();
      }
    }

    public MasterPermit()
    {

    }

    public static MasterPermit GetPermit(string permit_number)
    {
      var permit = GetPermitRaw(permit_number);
      return permit;
    }

    public static MasterPermit GetPermitRaw(string permit_number)
    {
      if (permit_number.Length == 0) return new MasterPermit();

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
            B.legal, 
            B.SqFt square_footage,
            ISNULL(stories, 0) stories,
            B.MaxHeight max_height,
            B.PropUseCode prop_use_code,
            PR.UseDescription use_description, 
            PR.CO prop_use_co, 
            M.TempCoDate temp_co_date, 
            ISNULL(M.TempCoDateDays, -1) temp_co_date_days, 
            CASE WHEN confidential = 1 THEN 'Confidential' 
              ELSE ISNULL(B.ProjName, '') END  project_name, 
            CASE WHEN confidential = 1 THEN 'Confidential' 
             ELSE RTRIM(ISNULL(B.ProjAddrCombined, '')) + ', ' + 
                  RTRIM(ISNULL(B.ProjCity, '')) + ' FL ' + 
                  ISNULL(B.ProjZip, '') END project_address,
            CASE WHEN confidential = 1 THEN 'Confidential' 
              ELSE B.OwnerName END owner_name, 
            CASE WHEN confidential = 1 THEN 'Confidential' 
              ELSE RTRIM(ISNULL(B.OwnerStreet, '')) + '  ' + 
                   RTRIM(ISNULL(B.OwnerCity, '')) + '  ' + 
                   RTRIM(ISNULL(B.OwnerState, ''))+ '  ' + 
                   RTRIM(ISNULL(B.OwnerZip, '')) END owner_address, 
            
	          RTRIM(ISNULL(C1.CustomerName,'')) contractor_data_line1, 

            RTRIM(ISNULL(C1.Address1, '')) + '  ' + 
              RTRIM(ISNULL(C1.Address2, '')) + ' ' + 
              RTRIM(ISNULL(C1.City, '')) + ' ' + 
              RTRIM(ISNULL(C1.State, '')) + ' ' + 
              RTRIM(ISNULL(C1.Zip, '')) contractor_data_line2, 

            RTRIM(ISNULL(B.ContractorId, '')) + ' phone: ' + 
              RTRIM(ISNULL(C1.Phone1, '')) + ' fax: ' + 
              RTRIM(ISNULL(C1.Fax, '')) contractor_data_line3, 

            B.SetbackType set_back_type, 
            B.Setback set_back, 
            B.front, 
            B.side, 
            B.rear, 
            M.VoidDate, 
            ISNULL(B.ConstrType, '') construction_type, 
            B.OccLoad occupation_load, 
            B.FireSprinkler fire_sprinkler, 
            CAT.Description code_edition, 
            M.CoClosedType co_closed_type
          FROM bpMASTER_PERMIT M
            INNER JOIN bpBASE_PERMIT B ON M.BaseID = B.BaseID
            LEFT OUTER JOIN bpPROPUSE_REF PR ON B.PropUseCode = PR.UseCode
            LEFT OUTER JOIN bpASSOC_PERMIT A ON A.BaseID = B.BaseID
            LEFT OUTER JOIN clCustomer AS C1 ON B.ContractorId = C1.ContractorCd 
            LEFT OUTER JOIN bpCategory_Codes CAT ON B.CodeEdition = CAT.Code AND CAT.Type_Code = 107 
            LEFT OUTER JOIN bpCategory_Codes CAT1 ON B.ConstrType = CAT1.Code AND CAT.Type_Code = 109
          WHERE M.PermitNo = @permit_number
  

      ";

      var master_permit = Constants.Get_Data<MasterPermit>("production", query, param).FirstOrDefault();

      if(master_permit.permit_number.Length == 0)
      {
        
      }

      return master_permit;

    }

    public List<string> GetOccupancyClass()
    {
      if (permit_number.Length == 0) return new List<string>();

       var param = new DynamicParameters();
      param.Add("@permit_number", permit_number);

      var query = @"
      
        WITH ClearanceSheets AS (
          SELECT DISTINCT ClrSht
          FROM bpBASE_PERMIT B
          INNER JOIN bpMASTER_PERMIT M ON M.BaseID = B.BaseId
          WHERE M.PermitNo = @permit_number)

        SELECT
          CC.Description OccClass
        FROM bpOccClass O
        INNER JOIN bpCategory_Codes CC ON O.Code = CC.Code AND CC.Type_Code = 108
        INNER JOIN ClearanceSheets CS ON O.Clrsht = CS.ClrSht
      
      ";
      try
      {
        return Constants.Get_Data<string>("production", query, param);

      }
      catch (Exception ex)
      {
        new ErrorLog(ex, query);
        return new List<string>();
      }
      
    }
  }
}