using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace PermitSearch.Models
{
  public class charge
  {
    public int item_id { get; set; }
    public int permit_number { get; set; }
    public string charge_description { get; set; }
    public string narrative { get; set; }
    public decimal amount { get; set; }
    public string cashier_id { get; set; }

    public charge()
    {

    }
  }
}