using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using PermitSearch.Models;

/* This controller will return one specific permit when searched.
 * 
 * 
 * 
*/
namespace PermitSearch.Controllers
{
  
  [RoutePrefix("API/Permit")]
  public class PermitController : ApiController
  {
    // GET: api/Permit
    [HttpGet]
    [Route("PermitCard")]
    public IHttpActionResult GetPermitCard(int permitnumber)
    {
      return Ok(permit.GetSpecific(permitnumber));
    }

    [HttpGet]
    [Route("Documents")]
    public IHttpActionResult GetDocuments(int permitnumber)
    {
      return Ok(document.GetDocuments(permitnumber));
    }

    [HttpGet]
    [Route("Holds")]
    public IHttpActionResult GetHolds(int permitnumber)
    {
      return Ok(hold.GetHolds(permitnumber));
    }

    [HttpGet]
    [Route("Charges")]
    public IHttpActionResult GetCharges(int permitnumber)
    {
      return Ok(charge.GetCharges(permitnumber));
    }


  }
}
