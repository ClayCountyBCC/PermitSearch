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
    public IHttpActionResult Get(int permitnumber)
    {
      return Ok(permit.GetSpecific(permitnumber));
    }


  }
}
