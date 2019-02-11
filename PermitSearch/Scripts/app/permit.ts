/// <reference path="app.ts" />

namespace PermitSearch
{
  "use strict";

  interface IPermit
  {
    permit_number: number;
    permit_type: string;
    days_since_last_passed_inspection: number;
    address: string;
    issue_date: any;
    void_date: any;
    co_date: any;
    is_closed: boolean;
    passed_final_inspection: boolean;
    outstanding_hold_count: number;
    total_charges: number;
    paid_charges: number;
    document_count: number;
    has_related_permits: boolean;
    contractor_number: string;
    contractor_name: string;
    company_name: string;
    owner_name: string;
    parcel_number: string;
    pin_complete: string;
  }
  export class Permit implements IPermit
  {
    public permit_number: number = 0;
    public permit_type: string = "";
    public days_since_last_passed_inspection: number = 0;
    public address: string = "";
    public issue_date: any = new Date();
    public void_date: any;
    public co_date: any = new Date();
    public is_closed: boolean = false;
    public passed_final_inspection: boolean = false;
    public outstanding_hold_count: number = 0;
    public total_charges: number = 0;
    public paid_charges: number = 0;
    public document_count: number = 0;
    public has_related_permits: boolean = false;
    public contractor_number: string = "";
    public contractor_name: string = "";
    public company_name: string = "";
    public owner_name: string = "";
    public parcel_number: string = "";
    public pin_complete: string = "";

    constructor() { }

    public static QueryRelatedPermits(permit_number: number): void
    {
      let path = PermitSearch.GetPath();
      Utilities.Get<Array<Permit>>(path + "API/Permit/Related?permitnumber=" + permit_number.toString())
        .then(function (permits: Array<Permit>)
        {
          console.log("related permits", permits);
          if (permits.length === 0)
          {
            PermitSearch.CreateMessageRow("relatedPermitsResultsBody", 4, "No documents were found for this permit.");
          }
          else
          {
            CreateResultsTable(permits, "relatedPermitsResultsHead", "relatedPermitsResultsBody", true);
            //Document.CreateDocumentsTable(permits);
            //Document.PopulateDocumentTypeFilter(permits);
          }
        }, function (e)
          {
          PermitSearch.CreateMessageRow("relatedPermitsResultsBody", 4, "There was an issue retrieving the related permits for this permit.  Please refresh this page to try again.");
            console.log('error getting permits', e);
          });
    }
  }

}