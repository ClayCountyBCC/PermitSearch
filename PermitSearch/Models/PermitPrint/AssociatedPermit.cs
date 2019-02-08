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
    public string permit_number { get; set; } = "";
    public string master_permit_number { get; set; } = "";
    public string permit_type_string { get; set; } = "";
    //public bool safety { get; set; } = false;
    //public bool safety_cvt { get; set; } = false;
    public DateTime issue_date { get; set; } = DateTime.MinValue;
    public string parcel_number { get; set; } = "";
    public decimal valuation { get; set; } = 0;
    public string legal { get; set; } = "";
    public string proposed_use { get; set; } = "";
    //public string prop_use_code { get; set; } = "";
    //public string prop_use_description { get; set; } = "";
    public string project_address { get; set; } = "";
    public string owner_name { get; set; } = "";
    public string owner_address { get; set; } = "";
    //public string project_address_state { get; set; } = "";
    public string contractor_data_line1 { get; set; } = "";
    public string contractor_data_line2 { get; set; } = "";
    public string contractor_data_line3 { get; set; } = "";
    public string general_contractor_license_number { get; set; } = "";
    public string general_contractor_name { get; set; } = "";
    //public string type { get; set; } = "";
    //public string power_company { get; set; } = "";
    //public string temp_service { get; set; } = "";
    //public string nal_legal { get; set; } = "";
    public DateTime void_date { get; set; } = DateTime.MinValue;

    public List<string> notes => permit.GetPermitNotes(permit_number);

    public List<hold> outstanding_holds
    {
      get
      {
        return hold.GetHolds(int.Parse(permit_number));
      }
    }

    public List<charge> permit_fees => charge.GetCharges(int.Parse(permit_number));

    public AssociatedPermit()
    {
      
    }

    public static AssociatedPermit GetPermit(string permitNumber)
    {
      var param = new DynamicParameters();
      param.Add("@permit_number", permitNumber);

      var query = @"
          USE WATSC;

          SELECT 
            permit_type_string = 
            CASE Left(A.PermitNo, 1) 
              WHEN '2' THEN 'Electrical'
              WHEN '3' THEN 'Plumbing'
              WHEN '4' THEN 'Mechanical'
              WHEN '6' THEN 'Fire'
              WHEN '8' THEN 'Irrigation'
            END,  
            A.PermitNo permit_number, 
            --A.safety, 
            --A.SafetyCvt safety_cvt,
            A.MPermitNo master_permit_number,
            A.IssueDate issue_date, 
            B.ParcelNo parcel_number, 
            B.valuation, 
            B.LEGAL legal, 
	          --B.PropUseCode prop_use_code,
            --ISNULL(bpPROPUSE_REF.UseDescription, '') prop_use_description,
            B.PropUseCode + ' ' + ISNULL(PR.UseDescription, '') proposed_use,

	          CASE WHEN B.Confidential = 1 THEN 'CONFIDENTIAL'
            ELSE RTRIM(ISNULL(B.ProjAddrCombined,'')) + ',   ' + 
                 RTRIM(ISNULL(B.ProjCity,'')) + '  FL  ' + 
                 ISNULL(B.ProjZip,'') END project_address, 

	          --RTRIM(ISNULL(A.ServAddr,'')) + ',   ' + 
            --RTRIM(ISNULL(B.ProjCity,'')) + '  FL  ' + 
            --ISNULL(B.ProjZip,'') serv_address,

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

	          RTRIM(ISNULL(A.ContractorId,'')) + ' Phone:' + 
              RTRIM(ISNULL(clCustomer.Phone1,'')) + ' Fax: ' + 
              RTRIM(ISNULL(clCustomer.Fax,'')) contractor_data_line3, 

            C1.ContractorCd general_contractor_license_number, 

            C1.CustomerName AS general_contractor_name,

	          --A.Type, 
            --A.PowerCo power_company, 
            --A.TempSrv temporary_service, 
            --apNAL.Lgl as nal_legal,
            A.VoidDate void_date
          FROM  bpASSOC_PERMIT A
          LEFT OUTER JOIN bpMASTER_PERMIT M ON A.MPermitNo = M.PermitNo
          LEFT OUTER JOIN clContractor C ON C.ContractorCd = A.ContractorId
          LEFT OUTER JOIN bpBASE_PERMIT B ON A.BaseID = B.BaseID   
          --LEFT OUTER JOIN apNAL ON apNAL.Parcel = B.ParcelNo
          LEFT OUTER JOIN clCustomer C1 ON C1.ContractorCd = B.ContractorId
          LEFT OUTER JOIN bpPROPUSE_REF PR ON B.PropUseCode = PR.UseCode 
          LEFT OUTER JOIN clCustomer ON C.ContractorCd = clCustomer.ContractorCd
          WHERE A.PermitNo = @permit_number;

      ";

      try
      {
        return Constants.Get_Data<AssociatedPermit>("production", query, param).FirstOrDefault();
      }
      catch(Exception ex)
      {
        new ErrorLog(ex, query);
        return new AssociatedPermit();
      }

    }

    

  }
}