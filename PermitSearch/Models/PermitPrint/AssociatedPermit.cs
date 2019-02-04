using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;
using PermitSearch.Models;

namespace PermitSearch.Models 
{
  public class AssociatedPermit
  {
    public int base_id { get; set; } = -1;
    public string permit_number { get; set; } = "";
    public string master_permit_number { get; set; } = "";
    public string permit_type_string { get; set; } = "";
    public bool safety { get; set; } = false;
    public bool safety_cvt { get; set; } = false;
    public DateTime issue_date { get; set; } = DateTime.MinValue;
    public string parcel_number { get; set; } = "";
    public decimal valuation { get; set; } = 0;
    public string legal_description { get; set; } = "";
    public string prop_use_code { get; set; } = "";
    public string prop_use_description { get; set; } = "";
    public string project_address_complete { get; set; } = "";
    public string project_address_state { get; set; } = "";
    public string contractor_data_line1 { get; set; } = "";
    public string contractor_data_line2 { get; set; } = "";
    public string contractor_data_linee3 { get; set; } = "";
    public string general_contractor_license_number { get; set; } = "";
    public string general_contractor_name { get; set; } = "";
    public string type { get; set; } = "";
    public string power_company { get; set; } = "";
    public string temp_service { get; set; } = "";
    public string nal_legal { get; set; } = "";
    public DateTime void_date { get; set; } = DateTime.MinValue;
    public List<string> notes { get; set; } = new List<string>();
    public List<PermitPrintCharges> permit_fees { get; set; } = new List<PermitPrintCharges>();
    public List<PermitPrintOutstandingHolds> outstanding_holds { get; set; } = new List<PermitPrintOutstandingHolds>();


    public AssociatedPermit()
    {
      
    }

    public static AssociatedPermit GetPermit(string permitNumber)
    {

      var permit = GetPermitRaw(permitNumber);
      if (permit != null)
      {
        permit.permit_fees = PermitPrintCharges.Get(permit.permit_number);
        permit.outstanding_holds = PermitPrintOutstandingHolds.Get(permit.permit_number);
        permit.notes = Models.permit.GetPermitNotes(permit.permit_number);
      }

      return permit;

    }
    public static AssociatedPermit GetPermitRaw(string permitNumber)
    {
      var param = new DynamicParameters();
      param.Add("@permit_number", permitNumber);

      var query = @"
          USE WATSC;

          SELECT 
          A.BaseID base_id,
          permit_type_string = 
          CASE Left(A.PermitNo, 1) 
            WHEN '2' THEN 'Electrical'
            WHEN '3' THEN 'Plumbing'
            WHEN '4' THEN 'Mechanical'
            WHEN '6' THEN 'Fire'
            WHEN '8' THEN 'Irrigation'
          END,  
          A.PermitNo permit_number, 
          A.safety, 
          A.SafetyCvt safety_cvt,
          A.MPermitNo master_permit_number,
          A.IssueDate issue_date, 
          CASE WHEN confidential = 1 THEN 'Confidential' ELSE B.ParcelNo  END parcel_number, 
          B.valuation, 
          CASE WHEN confidential = 1 THEN 'Confidential' ELSE B.LEGAL END legal_description, 
	        B.PropUseCode prop_use_code,
          ISNULL(bpPROPUSE_REF.UseDescription, '') prop_use_description,
	        CASE WHEN B.Confidential = 1 THEN 'CONFIDENTIAL'
            ELSE RTRIM(ISNULL(B.ProjAddrCombined,'')) + ',   ' + 
               RTRIM(ISNULL(B.ProjCity,'')) + '  FL  ' + 
               ISNULL(B.ProjZip,'') END project_address_complete, 

	        RTRIM(ISNULL(A.ServAddr,'')) + ',   ' + 
          RTRIM(ISNULL(B.ProjCity,'')) + '  FL  ' + 
          ISNULL(B.ProjZip,'') serv_address,
	        CASE WHEN B.Confidential = 1 THEN 'CONFIDENTIAL' 
            ELSE B.OwnerName END owner_name, 
          CASE WHEN B.Confidential = 1 THEN 'CONFIDENTIAL' 
            ELSE RTRIM(ISNULL(B.OwnerStreet,'')) + '  ' + 
                   RTRIM(ISNULL(B.OwnerCity,'')) + '  ' + 
                   RTRIM(ISNULL(B.OwnerState,'')) + '  ' + 
                   RTRIM(ISNULL(B.OwnerZip,'')) END owner_address, 
	        RTRIM(ISNULL(clCustomer.CustomerName,'')) + '  *  ' + 
            RTRIM(ISNULL(C.CompanyName,'')) contractor_data_line1, 
	        RTRIM(ISNULL(clCustomer.Address1,'')) + '  ' + 
            RTRIM(ISNULL(clCustomer.Address2,'')) + ' ' + 
            RTRIM(ISNULL(clCustomer.City,'')) + ' ' + 
            RTRIM(ISNULL(clCustomer.State,'')) + ' ' + 
            RTRIM(ISNULL(clCustomer.Zip,'')) contractor_data_line2, 
	        RTRIM(ISNULL(A.ContractorId,'')) + ' phone:' + 
            RTRIM(ISNULL(clCustomer.Phone1,'')) + ' fax: ' + 
            RTRIM(ISNULL(clCustomer.Fax,'')) contractor_data_line3, 
          C1.ContractorCd general_contractor_license_number, 
          C1.CustomerName AS general_contractor_name,
	        A.Type, 
          A.PowerCo power_company, 
          A.TempSrv temporary_service, 
          apNAL.Lgl as nal_legal,
          A.VoidDate void_date
        FROM  bpASSOC_PERMIT A
        LEFT OUTER JOIN clContractor C ON C.ContractorCd = A.ContractorId
        LEFT OUTER JOIN bpBASE_PERMIT B ON A.BaseID = B.BaseID   
        LEFT OUTER JOIN apNAL ON apNAL.Parcel = B.ParcelNo
        LEFT OUTER JOIN clCustomer C1 ON C1.ContractorCd = B.ContractorId
        LEFT OUTER JOIN bpPROPUSE_REF ON B.PropUseCode = bpPROPUSE_REF.UseCode 
        LEFT OUTER JOIN clCustomer ON C.ContractorCd = clCustomer.ContractorCd
        WHERE A.PermitNo = @permit_number;
      
      ";

      try
      {
        var permit = Constants.Get_Data<AssociatedPermit>("production", query, param).FirstOrDefault();
        return permit;
      }
      catch(Exception ex)
      {
        new ErrorLog(ex, query);
        return null;
      }

    }

    

  }
}