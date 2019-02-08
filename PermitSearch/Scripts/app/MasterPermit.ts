namespace PermitSearch
{
  "use strict";

  interface IMasterPermit
  {
    permit_type_label: string;
    permit_number: string;
    issue_date: any;
    parcel_number: string;
    valuation: number;
    legal: string;
    square_footage: number;
    stories: number;
    proposed_use: string;
    project_name: string;
    project_address: string;
    owner_name: string;
    owner_address: string;
    contractor_data_line1: string;
    contractor_data_line2: string;
    contractor_data_line3: string;
    front: string;
    side: string;
    rear: string;
    void_date: any;
    flood_data: Array<FloodData>;
    permit_fees: Array<Charge>;
    notes: Array<string>;
    outstanding_holds: Array<Hold>;
  }
  export class MasterPermit implements IMasterPermit
  {
    public permit_type_label: string;
    public permit_number: string;
    public issue_date: any;
    public parcel_number: string;
    public valuation: number;
    public legal: string;
    public square_footage: number;
    public stories: number;
    public proposed_use: string;
    public project_name: string;
    public project_address: string;
    public owner_name: string;
    public owner_address: string;
    public contractor_data_line1: string;
    public contractor_data_line2: string;
    public contractor_data_line3: string;
    public front: string;
    public side: string;
    public rear: string;
    public void_date: any;
    public flood_data: Array<FloodData>;
    public permit_fees: Array<Charge>;
    public notes: Array<string>;
    public outstanding_holds: Array<Hold>;

    constructor() { }

    public static Get(permit_number: string): void
    {
      let path = PermitSearch.GetPath();
      Utilities.Get<MasterPermit>(path + "API/Permit/PrintPermit?permit_number=" + permit_number)
        .then(function (permit: MasterPermit)
        {
          console.log("master permit", permit);          
          PermitSearch.LoadMasterPermit(permit);          
        }, function (e)
          {
            console.log('error getting master permit ' + permit_number, e);
          });
    }

  }
}
