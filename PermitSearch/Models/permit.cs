using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PermitSearch.Models
{
  public class permit
  {
    public int permit_number { get; set; }
    public string address { get; set; }
    public DateTime issue_date { get; set; }
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

    public permit()
    {

    }

  }
}