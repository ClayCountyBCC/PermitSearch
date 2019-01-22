using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;


namespace PermitSearch.Models.PermitPrint
{
  public class AssociatedPermit
  {
    public string permit_number { get; set; } = "";
    public string master_permit_number { get; set; } = "";


    public AssociatedPermit()
    {

    }

    public static AssociatedPermit GetPermit(string permitNumber)
    {
      var param = new DynamicParameters();
      param.Add("@permit_number", permitNumber);

      var query = @"
          USE WATSC;

          SELECT PermitTypeLabel = 
          CASE Left(bpASSOC_PERMIT.PermitNo, 1) 
            WHEN '2' THEN 'Electrical'
            WHEN '3' THEN 'Plumbing'
            WHEN '4' THEN 'Mechanical'
            WHEN '6' THEN 'Fire'
            WHEN '8' THEN 'Irrigation'
          END,  
          bpASSOC_PERMIT.PermitNo, 
          --bpASSOC_PERMIT.Safety, 
          --bpASSOC_PERMIT.SafetyCvt,
          bpASSOC_PERMIT.MPermitNo,   
          bpASSOC_PERMIT.IssueDate, 
          bpBASE_PERMIT.ParcelNo,
          bpBASE_PERMIT.Valuation, 
          bpBASE_PERMIT.Legal, 
	        bpBASE_PERMIT.PropUseCode,
          bpPROPUSE_REF.UseDescription AS PUDesc, 
	        RTRIM(ISNULL(bpBASE_PERMIT.ProjAddrCombined,'')) + ',   ' + RTRIM(ISNULL(bpBASE_PERMIT.ProjCity,'')) + '  FL  ' + ISNULL(bpBASE_PERMIT.ProjZip,'') AS PAddr, 
	        RTRIM(ISNULL(bpASSOC_PERMIT.ServAddr,'')) + ',   ' + RTRIM(ISNULL(bpBASE_PERMIT.ProjCity,'')) + '  FL  ' + ISNULL(bpBASE_PERMIT.ProjZip,'') AS SAddr,
	        bpBASE_PERMIT.OwnerName AS OName, RTRIM(ISNULL(bpBASE_PERMIT.OwnerStreet,'')) + '  ' + RTRIM(ISNULL(bpBASE_PERMIT.OwnerCity,'')) + '  ' + RTRIM(ISNULL(bpBASE_PERMIT.OwnerState,'')) + '  ' + RTRIM(ISNULL(bpBASE_PERMIT.OwnerZip,'')) AS OAddr, 
	        RTRIM(ISNULL(clCustomer.CustomerName,'')) + '  *  ' + RTRIM(ISNULL(clContractor.CompanyName,'')) AS CL1, 
	        RTRIM(ISNULL(clCustomer.Address1,'')) + '  ' + RTRIM(ISNULL(clCustomer.Address2,'')) + ' ' + RTRIM(ISNULL(clCustomer.City,'')) + ' ' + RTRIM(ISNULL(clCustomer.State,'')) + ' ' + RTRIM(ISNULL(clCustomer.Zip,'')) AS CL2, 
	        RTRIM(ISNULL(bpAssoc_PERMIT.ContractorId,'')) + '   phone:' + RTRIM(ISNULL(clCustomer.Phone1,'')) + '  fax: ' + RTRIM(ISNULL(clCustomer.Fax,'')) AS CL3, clCustomer_1.ContractorCd AS GenCLId, clCustomer_1.CustomerName AS GenCLName,
	        Type, 
          PowerCo, 
          TempSrv, 
          dbo.apNAL.Lgl as NALLgl,
          isnull(bpASSOC_PERMIT.VoidDate,'') as VoidDate
        FROM         dbo.clContractor RIGHT OUTER JOIN
                              dbo.clCustomer AS clCustomer_1 RIGHT OUTER JOIN
                              dbo.apNAL RIGHT OUTER JOIN
                              dbo.bpASSOC_PERMIT INNER JOIN
                              dbo.bpBASE_PERMIT ON dbo.bpASSOC_PERMIT.BaseID = dbo.bpBASE_PERMIT.BaseID ON dbo.apNAL.Parcel = dbo.bpBASE_PERMIT.ParcelNo ON 
                              clCustomer_1.ContractorCd = dbo.bpBASE_PERMIT.ContractorId ON 
                              dbo.clContractor.ContractorCd = dbo.bpASSOC_PERMIT.ContractorId LEFT OUTER JOIN
                              dbo.bpPROPUSE_REF ON dbo.bpBASE_PERMIT.PropUseCode = dbo.bpPROPUSE_REF.UseCode LEFT OUTER JOIN
                              dbo.clCustomer ON dbo.clContractor.ContractorCd = dbo.clCustomer.ContractorCd
        WHERE bpASSOC_PERMIT.PermitNo = @PermitNo
      
      
      ";



      return new AssociatedPermit();

    }



    
  }
}