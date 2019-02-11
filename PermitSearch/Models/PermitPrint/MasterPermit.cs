using System;
using System.Collections.Generic;
using Dapper;
using System.Linq;
using System.Web;

namespace PermitSearch.Models
{
  public class MasterPermit
  {
    public string permit_type_label { get; set; } = "";
    public string permit_number { get; set; } = "";
    public DateTime issue_date { get; set; } = DateTime.MinValue;
    public string parcel_number { get; set; } = "";
    public decimal valuation { get; set; } = -1;
    //public string clearance_sheet { get; set; } = "";
    public string legal { get; set; } = "";
    public int square_footage { get; set; } = -1;
    public int stories { get; set; } = -1;
    public string proposed_use { get; set; } = "";
    //public string max_height { get; set; } = "";
    //public string prop_use_code { get; set; } = "";
    //public string prop_use_description { get; set; } = "";
    //public bool prop_use_co { get; set; } = false;
    //public DateTime temp_co_date { get; set; } = DateTime.MinValue;
    //public int temp_co_date_days { get; set; } = -1;
    public string project_name { get; set; } = "";
    public string project_address { get; set; } = "";
    public string owner_name { get; set; } = "";
    public string owner_address { get; set; } = "";
    public string contractor_data_line1 { get; set; } = "";
    public string contractor_data_line2 { get; set; } = ""; 
    public string contractor_data_line3 { get; set; } = "";
    //public string set_back_type { get; set; } = "";
    //public string set_back { get; set; } = "";
    public string front { get; set; } = "";
    public string side { get; set; } = "";
    public string rear { get; set; } = "";
    public DateTime void_date { get; set; } = DateTime.MinValue;
    //public string co_closed_type { get; set; } = "";

    public List<FloodData> flood_data => FloodData.Get(permit_number);

    public List<charge> permit_fees => charge.GetMasterPermitCharges(int.Parse(permit_number));

    public List<string> notes
    {
      get
      {
        var notes = permit.GetPermitNotes(permit_number);
        if(square_footage > 0)
        {
          notes.Insert(0, "Square Footage: " + square_footage.ToString());
        }
        if (stories > 0)
        {
          notes.Insert(0, "Stories: " + stories.ToString());
        }
        else
        {
          notes.Insert(0, "Stories: None");
        }
        if (front.Length > 0) notes.Insert(0, "Front: " + front);
        if (side.Length > 0) notes.Insert(0, "Side: " + side);
        if (rear.Length > 0) notes.Insert(0, "Rear: " + rear);
        
        return notes;
      }
    }

    public List<hold> outstanding_holds
    {
      get
      {
        return hold.GetHolds(int.Parse(permit_number));
      }
    }

    //public List<string> occupancy_class => GetOccupancyClass();

    public MasterPermit()
    {
    }

    public static MasterPermit GetPermit(string permit_number)
    {
      if (permit_number.Length == 0) return new MasterPermit();

      var param = new DynamicParameters();
      param.Add("@permit_number", permit_number);

      var query = @"
        USE WATSC;

        SELECT DISTINCT 
            permit_type_label = 
            CASE LEFT(@permit_number, 1) 
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
            B.ParcelNo parcel_number, 
            B.valuation, 
            B.legal, 
            B.SqFt square_footage,
            ISNULL(stories, 0) stories,
            B.PropUseCode + ' ' + ISNULL(M.PropUseDesc,PR.UseDescription) proposed_use,
            CASE WHEN confidential = 1 THEN 'Confidential' 
              ELSE ISNULL(B.ProjName, '') END  project_name, 

            CASE WHEN confidential = 1 THEN 'Confidential' 
             ELSE RTRIM(ISNULL(B.ProjAddrCombined, '')) + ', ' + 
                  RTRIM(ISNULL(B.ProjCity, '')) + ' FL ' + 
                  ISNULL(B.ProjZip, '') END project_address,
            CASE WHEN confidential = 1 THEN 'Confidential' 
              ELSE B.OwnerName END owner_name, 
            CASE WHEN confidential = 1 THEN 'Confidential' 
              ELSE LTRIM(RTRIM(ISNULL(B.OwnerStreet, ''))) + ', ' + 
                   LTRIM(RTRIM(ISNULL(B.OwnerCity, ''))) + '  ' + 
                   LTRIM(RTRIM(ISNULL(B.OwnerState, '')))+ '  ' + 
                   LTRIM(RTRIM(ISNULL(B.OwnerZip, ''))) END owner_address, 
            
	          CASE WHEN UPPER(B.ContractorId) = 'OWNER'
            THEN 'OWNER'
            ELSE RTRIM(ISNULL(C1.CustomerName,'')) END contractor_data_line1, 

            CASE WHEN UPPER(B.ContractorId) = 'OWNER'
            THEN ''
            ELSE 
              RTRIM(ISNULL(C1.Address1, '')) + ' ' + 
                RTRIM(ISNULL(C1.Address2, '')) + ' ' + 
                RTRIM(ISNULL(C1.City, '')) + ' ' + 
                RTRIM(ISNULL(C1.State, '')) + ' ' + 
                RTRIM(ISNULL(C1.Zip, '')) END contractor_data_line2, 
             
            CASE WHEN UPPER(B.ContractorId) = 'OWNER'
            THEN ''
            ELSE RTRIM(ISNULL(B.ContractorId,'')) +
              CASE WHEN ISNULL(C1.Phone1, '') = '' 
                THEN ''
                ELSE ' Phone: '+ LTRIM(RTRIM(C1.Phone1)) 
                END +
              CASE WHEN ISNULL(C1.Fax, '') = '' 
                THEN '' 
                ELSE ' Fax: ' + LTRIM(RTRIM(C1.Fax)) END 
              END contractor_data_line3,


            B.SetbackType set_back_type, 
            B.Setback set_back, 
            B.front, 
            B.side, 
            B.rear, 
            M.VoidDate, 
            M.CoClosedType co_closed_type
          FROM bpMASTER_PERMIT M
            INNER JOIN bpBASE_PERMIT B ON M.BaseID = B.BaseID
            LEFT OUTER JOIN bpPROPUSE_REF PR ON B.PropUseCode = PR.UseCode
            LEFT OUTER JOIN bpASSOC_PERMIT A ON A.BaseID = B.BaseID
            LEFT OUTER JOIN clCustomer AS C1 ON B.ContractorId = C1.ContractorCd 
          WHERE 
            M.PermitNo = @permit_number
      ";

      MasterPermit master_permit = Constants.Get_Data<MasterPermit>("production", query, param).FirstOrDefault();
      //var master_permit = Constants.Get_Data<MasterPermit>("production", query, param).FirstOrDefault();

      if (master_permit.permit_number.Length == 0)
      {
        return new MasterPermit();
      }

      return master_permit;

    }

    //public List<string> GetOccupancyClass()
    //{
    //  if (permit_number.Length == 0) return new List<string>();

    //   var param = new DynamicParameters();
    //  param.Add("@permit_number", permit_number);

    //  var query = @"
    //    USE WATSC;
    //    WITH ClearanceSheets AS (
    //      SELECT DISTINCT ClrSht, CodeEdition, OccLoad, ConstrType, FireSprinkler
    //      FROM bpBASE_PERMIT B
    //      INNER JOIN bpMASTER_PERMIT M ON M.BaseID = B.BaseId
    //      WHERE M.PermitNo = @permit_number
    //    ), BasicData AS (
    //    SELECT
    //      0 ord, 
    //      CC.Description OccClass
    //    FROM bpCategory_Codes CC 
    //    INNER JOIN ClearanceSheets CS ON CS.CodeEdition = CC.Code AND CC.Type_Code = 107
    //    WHERE CC.Description IS NOT NULL
    //    UNION
    //    SELECT
    //      1, 
    //      CC.Description OccClass
    //    FROM bpOccClass O
    //    INNER JOIN bpCategory_Codes CC ON O.Code = CC.Code AND CC.Type_Code = 108
    //    INNER JOIN ClearanceSheets CS ON O.Clrsht = CS.ClrSht
    //    WHERE CC.Description IS NOT NULL
    //    UNION
    //    SELECT
    //      3, 
    //      'Occupancy Load: ' + CAST(OccLoad AS VARCHAR(5))
    //    FROM ClearanceSheets
    //    WHERE OccLoad IS NOT NULL
    //    UNION
    //    SELECT 
    //      4, 
    //      'Fire Sprinklers Required'
    //    FROM ClearanceSheets
    //    WHERE FireSprinkler = 1
    //    UNION
    //    SELECT
    //      2, 
    //      ConstrType
    //    FROM ClearanceSheets
    //    WHERE ConstrType IS NOT NULL
    //    )
    //    SELECT
    //      OccClass
    //    FROM BasicData
    //    ORDER BY ord ASC";
    //  try
    //  {
    //    return Constants.Get_Data<string>("production", query, param);
    //  }
    //  catch (Exception ex)
    //  {
    //    new ErrorLog(ex, query);
    //    return new List<string>();
    //  }
      
    //}
  }
}