/// <reference path="app.ts" />

namespace PermitSearch
{
  interface ILocationHash
  {
    permit_number: string;
    permit_status: string;
    contractor_number: string;
    contractor_name: string;
    company_name: string;
    street_number: string;
    street_name: string;
    parcel_number: string;
    owner_name: string;
  }

  export class LocationHash implements ILocationHash
  {
    public permit_number: string = "";
    public permit_status: string = "all";
    public contractor_number: string = "";
    public contractor_name: string = "";
    public company_name: string = "";
    public street_number: string = "";
    public street_name: string = "";
    public parcel_number: string = "";
    public owner_name: string = "";    

    constructor(locationHash: string)
    {
      let ha: Array<string> = locationHash.split("&")
      for (let i = 0; i < ha.length; i++)
      {
        let k: Array<string> = ha[i].split("=");
        switch (k[0].toLowerCase())
        {
          case "permit":
            this.permit_number = k[1];
            break;
          case "status":
            this.permit_status = k[1];
            break;
          case "contractorid":
            this.contractor_number = k[1];
            break;
          case "contractorname":
            this.contractor_name = k[1];
            break;
          case "companyname":
            this.company_name = k[1];
            break;
          case "streetnumber":
            this.street_number = k[1];
            break;
          case "streetname":
            this.street_name = k[1];
            break;
          case "owner":
            this.owner_name = k[1];
            break;
          case "parcel":
            this.parcel_number = k[1];
            break;
        }
      }

    }

    ToHash(): string
    {
      let h: string = "";
      if (this.permit_status.length > 0) h += "&status=" + this.permit_status;
      if (this.permit_number.length > 0) h += "&permit=" + this.permit_number;      
      if (this.street_number.length > 0) h += "&streetnumber=" + this.street_number;
      if (this.street_name.length > 0) h += "&streetname=" + this.street_name;
      if (this.contractor_number.length > 0) h += "&contractorid=" + this.contractor_number;
      if (this.contractor_name.length > 0) h += "&contractorname=" + this.contractor_name;
      if (this.company_name.length > 0) h += "&companyname=" + this.company_name;
      if (this.owner_name.length > 0) h += "&owner=" + this.owner_name;
      if (this.parcel_number.length > 0) h += "&parcel=" + this.parcel_number;
      if (h.length > 0) h = "#" + h.substring(1);
      return h;
    }

  }


}