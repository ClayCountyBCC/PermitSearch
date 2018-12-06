namespace PermitSearch
{
  "use strict";

  interface IPermit
  {
    permit_number: number;
    address: string;
    issue_date: Date;
    co_date: Date;
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
  }
  export class Permit implements IPermit
  {
    public permit_number: number = 0;
    public address: string = "";
    public issue_date: Date = new Date();
    public co_date: Date = new Date();
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

    constructor() { }
  }

}