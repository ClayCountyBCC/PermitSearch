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
    //// GET: api/Permit
    //[HttpGet]
    //[Route("PermitCard")]
    //public IHttpActionResult GetPermitCard(int permitnumber)
    //{
    //  return Ok(permit.GetSpecific(permitnumber));
    //}

    [HttpGet]
    [Route("Documents")]
    public IHttpActionResult GetDocuments(int permitnumber)
    {
      return Ok(document.GetDocuments(permitnumber));
    }

    [HttpGet]
    [Route("PermitNotes")]
    public IHttpActionResult GetPermitNotes(int permitnumber)
    {
      return Ok(permit_note.GetPermitNotes(permitnumber));
    }

    [HttpGet]
    [Route("PlansReview")]
    public IHttpActionResult GetPlanReviews(int permitnumber)
    {
      return Ok(plan_review.GetPlanReviews(permitnumber));
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

    [HttpGet]
    [Route("PrintPermit")]
    public IHttpActionResult PrintPermit(int permit_number)
    {
       if(permit_number < 20000000 || permit_number > 89999999)
       {
        var permit = MasterPermit.GetPermit(permit_number.ToString());
        return Ok(permit);
       }
       else if(permit_number >= 20000000 && permit_number < 90000000) 
       {
        var permit = AssociatedPermit.GetPermit(permit_number.ToString());
        return Ok(permit);

       }

      return Ok(BadRequest("Not a valid Permit Number"));
    }

    [HttpGet]
    [Route("Related")]
    public IHttpActionResult RelatedPermits(int permitnumber)
    {
      return Ok(permit.GetRelatedPermits(permitnumber));
    }

  }
}
