using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using PermitSearch.Models;

namespace PermitSearch.Controllers
{
  [RoutePrefix("API/Search")]
  public class SearchController : ApiController
  {
    // GET: api/Search
    [HttpGet]
    [Route("Permit")]
    public IHttpActionResult Get(
      int permitnumber = -1, 
      string status = "all", 
      string contractorid = "", 
      string contractorname = "", 
      string companyname = "",
      string streetnumber = "",
      string streetname = "",
      string owner = "",
      string parcel = "", 
      int page = 1)
    {

      var permitlist = permit.Search(permitnumber, status, contractorid, contractorname, companyname, streetnumber, streetname, owner, parcel, page);
      return Ok(permitlist);

    }

    // GET: api/Search
    [HttpGet]
    [Route("Count")]
    public IHttpActionResult Count(
      int permitnumber = -1,
      string status = "all",
      string contractorid = "",
      string contractorname = "",
      string companyname = "",
      string streetnumber = "",
      string streetname = "",
      string owner = "",
      string parcel = "",
      int page = 1)
    {

      var count = permit.Count(permitnumber, status, contractorid, contractorname, companyname, streetnumber, streetname, owner, parcel, page);
      return Ok(count);

    }


  }
}
