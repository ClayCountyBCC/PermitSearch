using System;
using System.Collections.Generic;
using System.Linq;
using Dapper;
using System.Web;

namespace PermitSearch.Models.PermitPrint
{
  public class PermitPrintCharges
  {
    public string cashier_id { get; set; } = "";
    public string charge_description { get; set; } = "";
    public string payment_type { get; set; } = "";
    public string payment_type_text { get; set; } = "";
    public decimal total { get; set; }


    public PermitPrintCharges()
    {
      
    }

    public static List<PermitPrintCharges> Get(string permit_number)
    {
      var param = new DynamicParameters();

      param.Add("@permit_number", permit_number);

      var query = @"
      
        USE [WATSC]

        DECLARE @BaseId INT = (SELECT BaseId FROM bpMASTER_PERMIT WHERE PERMITNO = @permit_number
                                UNION
        SELECT BaseId FROM bpASSOC_PERMIT WHERE PERMITNO = @permit_number);

        WITH CashierIdForPaidPermitFees AS (
          select DISTINCT CashierId 
          from ccCashierItem CI
          INNER JOIN ccCashierPayment CP ON CP.OTid = CI.OTId
          INNER JOIN ccLookUp L ON LEFT(L.Code,5) = LEFT(CP.PmtType,5)
          where CI.AssocKey = @permit_number
            AND RTRIM(LTRIM(CatCode)) IN (
              '1ZON',
              '100RE',
              '2RAD',
              '1RAD',
              'IFRD3',
              'IFRD2',
              'IFSCH',
              '104',
              '105',
              '106',
              '108')
            AND (L.CdType = 'PMTTYPE' 
             OR L.CODE IN ('cc_online', 'cc_cashier'))
        ), TotalPaid AS (
          SELECT 
            CashierId cashier_id,
            NULL charge_description,
            NULL payment_type,
            'Total Paid' payment_type_text,
            SUM(Total) total
          FROM ccCashierItem
          WHERE CashierId IN 
            (SELECT DISTINCT CashierId
             FROM CashierIdForPaidPermitFees)
          GROUP BY CashierId
        ),WaivedOrExemptedImpactFees AS (
          select CashierId 
          from ccCashierItem CI
          INNER JOIN ccCashierPayment CP ON CP.OTid = CI.OTId
          INNER JOIN ccLookUp L ON LEFT(L.Code,5) = LEFT(CP.PmtType,5)
          where AssocKey = @permit_number
            AND L.cdType = 'SPECIALPT'
            AND L.Code NOT IN ('cc_online', 'cc_cashier')
        )


        SELECT DISTINCT
          CI.CashierId cashier_id,
          CC.[description] charge_description,
          NULL payment_type,
          NULL payment_type_text,
          CI.total
        FROM ccCashierItem CI 
        INNER JOIN ccCashierPayment CP ON CP.OTid = CI.OTId
        INNER JOIN ccLookUp L ON LEFT(L.Code,5) = LEFT(CP.PmtType,5)
        INNER JOIN ccCatCd CC ON CC.CatCode = CI.CatCode
        WHERE AssocKey = @permit_number
          AND CI.CashierId IS NOT NULL
          AND CI.CashierId IN 
            (SELECT DISTINCT CashierId FROM CashierIdForPaidPermitFees)
        union ALL
        SELECT
          cashier_id,
          charge_description,
          payment_type,
          payment_type_text,
          total
        FROM TotalPaid        
        union ALL
        SELECT 
          CI.CashierId cashier_id,
          CC.[description] charge_description,
          L.Code payment_type,
          L.Narrative payment_type_text,
          sum(CI.TOTAL) total
        FROM ccCashierItem CI 
        INNER JOIN ccCashierPayment CP ON CP.OTid = CI.OTId
        INNER JOIN ccLookUp L ON LEFT(L.Code,5) = LEFT(CP.PmtType,5)
        INNER JOIN ccCatCd CC ON CC.CatCode = CI.CatCode
        WHERE AssocKey = @permit_number
          AND CI.CashierId IS NOT NULL
          AND CI.CashierId IN 
            (SELECT CashierId FROM WaivedOrExemptedImpactFees)
        GROUP BY CashierId, CC.[description], L.CODE, L.Narrative

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