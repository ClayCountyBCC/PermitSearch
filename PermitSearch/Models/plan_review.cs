using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace PermitSearch.Models
{
  public class plan_review
  {
    public string clearance_sheet { get; set; } = "";
    public int plan_id { get; set; }
    public string plan_type { get; set; }
    public string comment { get; set; }
    public DateTime received_date { get; set; }
    public DateTime plan_reviewed_date { get; set; } = DateTime.MinValue;
    public string plan_reviewed_by { get; set; } = "";
    public string review_status { get; set; }
    public int issue_id { get; set; } = -1;
    public string plan_review_issue { get; set; } = "";
    public DateTime issue_added_on { get; set; } = DateTime.MinValue;
    public string issue_added_by { get; set; } = "";
    public DateTime signed_off_on { get; set; } = DateTime.MinValue;
    public string signed_off_by { get; set; } = "";

    public plan_review() { }

    public static List<plan_review>GetPlanReviews(int permit_number)
    {
      var dp = new DynamicParameters();
      dp.Add("@permit_number", permit_number);
      string sql = @"
        WITH ClearanceSheet AS (

          SELECT DISTINCT
            base_id
            ,clearance_sheet
          FROM PermitSearch.dbo.permit
          WHERE 
            permit_number = @permit_number

        )

        SELECT 
          C.clearance_sheet
          ,P.plan_id
          ,ISNULL(P.comment, '') comment
          ,P.plan_type
          ,P.received_date
          ,P.plan_reviewed_date
          ,ISNULL(P.plan_reviewed_by, '') plan_reviewed_by
          ,P.review_status  
          ,PRI.issue_id
          ,PRI.plan_review_issue
          ,PRI.issue_added_on
          ,PRI.issue_added_by
          ,PRI.signed_off_on
          ,PRI.signed_off_by
        FROM PermitSearch.dbo.plans P
        INNER JOIN ClearanceSheet C ON C.base_id = P.base_id
        LEFT OUTER JOIN plan_review_issues PRI ON P.plan_id = PRI.plan_id
        ORDER BY P.plan_id DESC, PRI.issue_id ASC";

      return Constants.Get_Data<plan_review>("Production", sql, dp);
    }
  }
}