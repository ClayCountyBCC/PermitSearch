/// <reference path="app.ts" />

namespace PermitSearch
{
  interface ILocationHash
  {
    permit_number: string;
    permit_display: string; // this will be used to indicate that a permit should be shown on the modal.
    permit_status: string;
    contractor_number: string;
    contractor_name: string;
    company_name: string;
    street_number: string;
    street_name: string;
    parcel_number: string;
    owner_name: string;
    page: string;
  }

  export class LocationHash implements ILocationHash
  {
    public permit_number: string = "";
    public permit_display: string = "";
    public permit_status: string = "all";
    public contractor_number: string = "";
    public contractor_name: string = "";
    public company_name: string = "";
    public street_number: string = "";
    public street_name: string = "";
    public parcel_number: string = "";
    public owner_name: string = "";
    public page: string = "1";

    constructor(locationHash: string)
    {
      if (locationHash.length > 0)
      {
        let ha: Array<string> = locationHash.split("&")
        for (let i = 0; i < ha.length; i++)
        {
          let k: Array<string> = ha[i].split("=");
          switch (k[0].toLowerCase())
          {
            case "permitnumber":
              this.permit_number = k[1];
              break;
            case "displaypermit":
              this.permit_display = k[1];
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
            case "page":
              this.page = k[1];
              break;
          }
        }
        this.UpdateInputs();
      }
      else
      {
        this.ReadInputs();
      }
    }

    UpdateInputs(): void
    {
      Utilities.Set_Value("permitStatus", this.permit_status);
      Utilities.Set_Value("permitSearch", this.permit_number);
      Utilities.Set_Value("streetNumberSearch", this.street_number);
      Utilities.Set_Value("streetNameSearch", this.street_name);
      Utilities.Set_Value("parcelSearch", this.parcel_number);
      Utilities.Set_Value("ownerSearch", this.owner_name);
      Utilities.Set_Value("contractorNumberSearch", this.contractor_number);
      Utilities.Set_Value("contractorNameSearch", this.contractor_name);
      Utilities.Set_Value("companyNameSearch", this.company_name);
      
    }

    ReadInputs():void
    {
      this.permit_status = Utilities.Get_Value("permitStatus").trim();
      this.permit_number = Utilities.Get_Value("permitSearch").trim();
      if (this.permit_number.length > 0) this.permit_display = this.permit_number;
      this.street_number = Utilities.Get_Value("streetNumberSearch").trim();
      this.street_name = Utilities.Get_Value("streetNameSearch").trim();
      this.parcel_number = Utilities.Get_Value("parcelSearch").trim();
      this.owner_name = Utilities.Get_Value("ownerSearch").trim();
      this.contractor_number = Utilities.Get_Value("contractorNumberSearch").trim();
      this.contractor_name = Utilities.Get_Value("contractorNameSearch").trim();
      this.company_name = Utilities.Get_Value("companyNameSearch").trim();
    }

    ReadyToSearch(): boolean
    {
      return (this.permit_number.length > 0) ||
        (this.contractor_number.length > 0) ||
        (this.contractor_name.length > 0) ||
        (this.company_name.length > 0) ||
        (this.street_number.length > 0) ||
        (this.street_name.length > 0) ||
        (this.owner_name.length > 0) ||
        (this.parcel_number.length > 0);
    }

    ToHash(): string
    {
      let h: string = "";
      h += LocationHash.AddToHash(this.permit_status, "status");
      h += LocationHash.AddToHash(this.permit_number, "permitnumber");
      h += LocationHash.AddToHash(this.permit_display, "permitdisplay");
      h += LocationHash.AddToHash(this.street_number, "streetnumber");
      h += LocationHash.AddToHash(this.street_name, "streetname");
      h += LocationHash.AddToHash(this.contractor_number, "contrctorid");
      h += LocationHash.AddToHash(this.contractor_name, "contractorname");
      h += LocationHash.AddToHash(this.company_name, "companyname");
      h += LocationHash.AddToHash(this.owner_name, "owner");
      h += LocationHash.AddToHash(this.parcel_number, "parcel");
      h += LocationHash.AddToHash(this.page, "page");
      //if (this.permit_status.length > 0) h += "&status=" + this.permit_status;
      //if (this.permit_number.length > 0) h += "&permitnumber=" + this.permit_number;      
      //if (this.permit_display.length > 0) h += "&permitdisplay=" + this.permit_display;
      //if (this.street_number.length > 0) h += "&streetnumber=" + this.street_number;
      //if (this.street_name.length > 0) h += "&streetname=" + this.street_name;
      //if (this.contractor_number.length > 0) h += "&contractorid=" + this.contractor_number;
      //if (this.contractor_name.length > 0) h += "&contractorname=" + this.contractor_name;
      //if (this.company_name.length > 0) h += "&companyname=" + this.company_name;
      //if (this.owner_name.length > 0) h += "&owner=" + this.owner_name;
      //if (this.parcel_number.length > 0) h += "&parcel=" + this.parcel_number;
      //if (this.page.length > 0) h += "&page=" + this.page;
      if (h.length > 0) h = "#" + h.substring(1);      
      return h;
    }

    static AddToHash(field: string, arg: string):string
    {
      if (field.length > 0) return "&" + arg + "=" + field;
      return "";
    }

  }


}
