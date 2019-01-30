using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;
using System.Text;

namespace PermitSearch.Models
{
  public class permit
  {
    const int page_size = 20;
    public int permit_number { get; set; }
    public string permit_type { get; set; } = "";
    public int days_since_last_passed_inspection { get; set; } = 0;
    public string address { get; set; }
    public DateTime issue_date { get; set; }
    public DateTime void_date { get; set; } = DateTime.MinValue;
    public DateTime co_date { get; set; }
    public bool is_closed { get; set; }
    public bool passed_final_inspection { get; set; }
    public decimal total_charges { get; set; }
    public decimal paid_charges { get; set; }
    public int document_count { get; set; }
    public bool has_related_permits { get; set; }
    public string contractor_number { get; set; }
    public string contractor_name { get; set; }
    public string company_name { get; set; }
    public string owner_name { get; set; }
    public string parcel_number { get; set; }
    public string pin_complete { get; set; }

    public permit()
    {

    }

    public static permit GetSpecific(int permit_number)
    {
      var dp = new DynamicParameters();      
      dp.Add("@permit_number", permit_number);

      string sql = @"
        SELECT
         P.permit_number,
         ISNULL(P.permit_type, '') permit_type,
         P.days_since_last_passed_inspection,
         P.address,
         P.issue_date,
         P.void_date,
         P.co_date,
         P.is_closed,
         P.passed_final_inspection,
         P.total_charges,
         P.paid_charges,
         P.document_count,
         P.has_related_permits,
         PA.parcel_number,
         ISNULL(PA.pin_complete, '') pin_complete,
         O.owner_name,
         ISNULL(P.contractor_number, '') contractor_number,
         C.contractor_name,
         C.company_name
        FROM permit P
        INNER JOIN permit_parcel PP ON P.permit_number = PP.permit_number
        INNER JOIN parcel PA ON PP.parcel_id = PA.id
        INNER JOIN permit_owner PO ON PO.permit_number = P.permit_number
        INNER JOIN [owner] O ON O.ID = PO.owner_id        
        INNER JOIN permit_contractor PC ON P.permit_number = PC.permit_number
        INNER JOIN contractor C ON PC.contractor_number = C.contractor_number
        WHERE P.permit_number = @permit_number;";

      return Constants.Get_Specific<permit>("Production", sql, dp);
    }

    private static DynamicParameters GetDynamicParameters(
      int permitnumber,
      string status,
      string contractorid,
      string contractorname,
      string companyname,
      string streetnumber,
      string streetname,
      string owner,
      string parcel,
      int page)
    {
      var dp = new DynamicParameters();
      dp.Add("@page", (page - 1) * page_size);
      if (permitnumber > -1)
      {
        dp.Add("@permit_number", permitnumber);
      }
      else
      {
        if (contractorid.Length > 0 | contractorname.Length > 0 | companyname.Length > 0)
        {
          if (contractorid.Length > 0)
          {
            dp.Add("@contractor_number", contractorid);
          }
          if (contractorname.Length > 0)
          {
            dp.Add("@contractor_name", contractorname);
          }
          if (contractorname.Length > 0)
          {
            dp.Add("@company_name", companyname);
          }
        }

        if (streetnumber.Length > 0 | streetname.Length > 0)
        {

          if (streetnumber.Length > 0)
          {
            dp.Add("@street_number", streetnumber);
          }

          if (streetname.Length > 0)
          {
            dp.Add("@street_name", streetname);
          }
        }

        if (parcel.Length > 0)
        {
          dp.Add("@parcel_number", parcel);
        }

        if (owner.Length > 0)
        {
          dp.Add("@owner_name", owner);
        }
      }
      return dp;

    }

    private static string GetSearchQuery(
      int permitnumber,
      string status,
      string contractorid,
      string contractorname,
      string companyname,
      string streetnumber,
      string streetname,
      string owner,
      string parcel,
      int page)
    {
      StringBuilder sbWhere = new StringBuilder("");
      StringBuilder sbJoin = new StringBuilder("");
      sbWhere.AppendLine("WHERE 1 = 1");

      if (permitnumber > -1)
      {
        sbWhere.AppendLine("AND P.permit_number = @permit_number");
      }
      else
      {
        switch (status)
        {
          case "open":
            sbWhere.AppendLine("AND P.is_closed = 0");
            break;

          case "closed":
            sbWhere.AppendLine("AND P.is_closed = 1");
            break;

          default: // same as case "all":
            break;
        }

        if (contractorid.Length > 0 | contractorname.Length > 0 | companyname.Length > 0)
        {

          if (contractorid.Length > 0)
          {
            sbWhere.AppendLine("AND C.contractor_number = @contractor_number ");
          }
          if (contractorname.Length > 0)
          {
            sbWhere.AppendLine("AND C.contractor_name LIKE '%' + @contractor_name + '%' ");
          }
          if (companyname.Length > 0)
          {
            sbWhere.AppendLine("AND C.company_name LIKE '%' + @company_name + '%' ");
          }
        }

        if (streetnumber.Length > 0 | streetname.Length > 0)
        {
          sbJoin.AppendLine("INNER JOIN permit_address PAD ON PAD.permit_number = P.permit_number");
          sbJoin.AppendLine("INNER JOIN [address] A ON A.ID = PAD.address_id");
          if (streetnumber.Length > 0)
          {
            sbWhere.AppendLine("AND (A.street_number = @street_number ");
            sbWhere.AppendLine("OR A.street_number LIKE @street_number + '-%' ");
            sbWhere.AppendLine("OR A.street_number LIKE @street_number + ' %') ");
          }
          if (streetname.Length > 0)
          {
            sbWhere.AppendLine("AND A.street_name LIKE '%' + @street_name + '%' ");
          }
        }

        if (parcel.Length > 0)
        {
          sbWhere.AppendLine("AND PA.parcel_number LIKE @parcel_number + '%' ");
        }

        if (owner.Length > 0)
        {
          sbWhere.AppendLine("AND O.owner_name LIKE '%' + @owner_name + '%' ");
        }
      }
      sbJoin.AppendLine(sbWhere.ToString());
      return sbJoin.ToString();
    }

    public static List<permit> Search(
      int permitnumber,
      string status,
      string contractorid,
      string contractorname,
      string companyname,
      string streetnumber,
      string streetname,
      string owner ,
      string parcel,
      int page,
      string sortfield,
      string sortdirection)
    {
      var dp = GetDynamicParameters(permitnumber, status, contractorid, contractorname, companyname, streetnumber, streetname, owner, parcel, page);
      var sb = new StringBuilder();
      string sql = @"
        SELECT
          P.permit_number,
          ISNULL(P.permit_type, '') permit_type,
          P.days_since_last_passed_inspection,
          P.address,
          P.issue_date,
          P.void_date,
          P.co_date,
          P.is_closed,
          P.passed_final_inspection,
          P.total_charges,
          P.paid_charges,
          P.document_count,
          P.has_related_permits,
          ISNULL(PA.parcel_number, '') parcel_number,
          ISNULL(PA.pin_complete, '') pin_complete,
          ISNULL(O.owner_name, '') owner_name,
          ISNULL(P.contractor_number, '') contractor_number,
          ISNULL(C.contractor_name, '') contractor_name,
          ISNULL(C.company_name, '') company_name
        FROM permit P
        LEFT OUTER JOIN permit_contractor PC ON PC.permit_number = P.permit_number
        LEFT OUTER JOIN contractor C ON C.contractor_number = PC.contractor_number
        LEFT OUTER JOIN permit_parcel PP ON PP.permit_number = P.permit_number
        LEFT OUTER JOIN parcel PA ON PA.ID = PP.parcel_id
        LEFT OUTER JOIN permit_owner PO ON P.permit_number = PO.permit_number
        LEFT OUTER JOIN owner O ON O.id = PO.owner_id";
      sb.AppendLine(sql);
      sb.AppendLine(GetSearchQuery(permitnumber, status, contractorid, contractorname, companyname, streetnumber, streetname, owner, parcel, page));
      //sb.AppendLine("ORDER BY @sortfield @sortdirection");
      sb.AppendLine(GetOrderBy(sortfield, sortdirection));
      sb.AppendLine($"OFFSET @Page ROWS FETCH NEXT { page_size.ToString() } ROWS ONLY;");
      return Constants.Get_Data<permit>("Production", sb.ToString(), dp);
    }

    public static string GetOrderBy(string column, string direction)
    {
      string orderby = "";
      direction = direction == "A" ? " ASC" : " DESC"; // handle direction here, with a leading space

      switch (column)
      {
        case "parcel":
          orderby = "PA.parcel_number" + direction;
          break;

        case "owner":
          orderby = "O.owner_name" + direction;
          break;

        case "company":
          orderby = "C.company_name" + direction;
          break;

        case "contractorname":
          orderby = "C.contractor_name" + direction;
          break;

        case "charges":
          orderby = "total_charges - paid_charges" + direction;
          break;

        case "address":
          orderby = "A.street_number" + direction + ", A.street_name" + direction;
          break;

        case "issuedate":
          orderby = "ISNULL(issue_date, GETDATE())" + direction;
          break;

        case "documents":
          orderby = "document_count" + direction;
          break;

        case "permit":
          orderby = "permit_number" + direction;
          break;

        case "status":
          orderby = "is_closed" + direction;
          break;

        case "age":
          orderby = "days_since_last_passed_inspection" + direction;
          break;

        default:
          orderby = "ISNULL(issue_date, GETDATE())" + direction;
          break;
      }

      return "ORDER BY " + orderby;

    }


    public static int Count(
      int permitnumber,
      string status,
      string contractorid,
      string contractorname,
      string companyname,
      string streetnumber,
      string streetname,
      string owner,
      string parcel,
      int page)
    {
      var dp = GetDynamicParameters(permitnumber, status, contractorid, contractorname, companyname, streetnumber, streetname, owner, parcel, page);
      var sb = new StringBuilder();
      string sql = @"
        SELECT
          COUNT(DISTINCT P.permit_number) CNT
        FROM permit P
        LEFT OUTER JOIN permit_contractor PC ON PC.permit_number = P.permit_number
        LEFT OUTER JOIN contractor C ON C.contractor_number = PC.contractor_number
        LEFT OUTER JOIN permit_parcel PP ON PP.permit_number = P.permit_number
        LEFT OUTER JOIN parcel PA ON PA.ID = PP.parcel_id
        LEFT OUTER JOIN permit_owner PO ON P.permit_number = PO.permit_number
        LEFT OUTER JOIN owner O ON O.id = PO.owner_id";
      sb.AppendLine(sql);
      sb.AppendLine(GetSearchQuery(permitnumber, status, contractorid, contractorname, companyname, streetnumber, streetname, owner, parcel, page));
      return Constants.Exec_Scalar<int>("Production", sb.ToString(), dp);
    }



  }
}