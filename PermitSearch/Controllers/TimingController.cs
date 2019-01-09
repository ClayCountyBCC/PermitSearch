using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

/*  This controller is just going to be used to return the date the data was
 *  last updated.  This information will go into the footer at a minimum, 
 *  but it should go to more visible places if we can find a spot for it.
*/

namespace PermitSearch.Controllers
{

  [RoutePrefix("API/Timing")]
  public class TimingController : ApiController
  {
    // GET: api/Timing
    [HttpGet]
    public IHttpActionResult Get()
    {
      return Ok(Models.Constants.GetCachedDateUpdated());
    }

  }
}
