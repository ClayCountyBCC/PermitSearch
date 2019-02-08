namespace PermitSearch
{
  "use strict";

  interface IAssociatedPermit
  {
    permit_type_string: string;
    permit_number: string;
    master_permit_number: string;
    issue_date: any;
    parcel_number: string;
    valuation: number;
    legal: string;
    square_footage: number;
    stories: number;
    proposed_use: string;    
    project_address: string;
    owner_name: string;
    owner_address: string;
    contractor_data_line1: string;
    contractor_data_line2: string;
    contractor_data_line3: string;
    general_contractor_license_number: string;
    general_contractor_name: string;
    void_date: any;    
    permit_fees: Array<Charge>;
    notes: Array<string>;
    outstanding_holds: Array<Hold>;
  }
  export class AssociatedPermit implements IAssociatedPermit
  {
    public permit_type_string: string;
    public permit_number: string;
    public master_permit_number: string;
    public issue_date: any;
    public parcel_number: string;
    public valuation: number;
    public legal: string;
    public square_footage: number;
    public stories: number;
    public proposed_use: string;
    public project_address: string;
    public owner_name: string;
    public owner_address: string;
    public contractor_data_line1: string;
    public contractor_data_line2: string;
    public contractor_data_line3: string;
    public general_contractor_license_number: string;
    public general_contractor_name: string;
    public void_date: any;
    public permit_fees: Array<Charge>;
    public notes: Array<string>;
    public outstanding_holds: Array<Hold>;

    constructor() { }

    public static Get(permit_number: string): void
    {
      let path = PermitSearch.GetPath();
      Utilities.Get<AssociatedPermit>(path + "API/Permit/PrintPermit?permit_number=" + permit_number)
        .then(function (permit: AssociatedPermit)
        {
          console.log("assoc permit", permit);
          PermitSearch.LoadAssocPermit(permit);
        }, function (e)
          {
            console.log('error getting assoc permit ' + permit_number, e);
          });
    }
  }
}


    //public string general_contractor_license_number { get; set; } = "";
    //public string general_contractor_name { get; set; } = "";
    //public DateTime void_date { get; set; } = DateTime.MinValue;
    //public List < string > notes => permit.GetPermitNotes(permit_number);
    //public List < hold > outstanding_holds
    //public List < charge > permit_fees => charge.GetCharges(int.Parse(permit_number));