using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PermitSearch.Models
{
  public class document
  {
    public int table_number { get; set; }
    public int object_id { get; set; }
    public int permit_number { get; set; }
    public string document_type { get; set; }
    public int page_count { get; set; }
    public DateTime created_on { get; set; }

    public document()
    {

    }

  }
}