/// <reference path="app.ts" />

namespace PermitSearch
{
  "use strict";

  interface ICharge
  {
    item_id: number;
    permit_number: number;
    charge_description: string;
    narrative: string;
    amount: number;
    cashier_id: string;
  }

  export class Charge implements ICharge
  {
    public item_id: number = -1;
    public permit_number: number = -1;
    public charge_description: string = "";
    public narrative: string = "";
    public amount: number = 0;
    public cashier_id: string = "";
    static charges_container: string = "chargeContainer";
    constructor() { }


    static QueryCharges(permit_number: number): void
    {
      Charge.ResetCharges();
      let path = GetPath();
      Utilities.Get<Array<Charge>>(path + "API/Permit/Charges?permitnumber=" + permit_number.toString())
        .then(function (charges: Array<Charge>)
        {
          console.log("charges", charges);
          PermitSearch.permit_charges = charges;
          if (charges.length === 0)
          {
            PermitSearch.CreateMessageRow(Charge.charges_container, 4, "No charges were found for this permit.");
          }
          else
          {
            Charge.CreateTable(charges);
          }

        }, function (e)
          {
            console.log('error getting charges', e);
          });
    }

    static CreateTable(charges: Array<Charge>): void
    {
      let df = document.createDocumentFragment();
      for (let c of charges)
      {
        df.appendChild(Charge.CreateRow(c));
      }
      let tbody = (<HTMLTableSectionElement>document.getElementById(Charge.charges_container));
      Utilities.Clear_Element(tbody);
      tbody.appendChild(df);
    }

    static ResetCharges(): void
    {
      PermitSearch.permit_charges = [];
      PermitSearch.CreateMessageRow(Charge.charges_container, 4, "Loading Charges...");
    }

    static CreateRow(c: Charge): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(Charge.CreateCell(c.charge_description));
      let narrative = c.narrative !== c.charge_description ? c.narrative : "";
      tr.appendChild(Charge.CreateCell(narrative));
      tr.appendChild(Charge.CreateCell(Utilities.Format_Amount(c.amount), "has-text-right"));
      // need to display the following:
      // If the charge is paid, show Paid with a link to the receipt
      // If unpaid, Unpaid, and a link to claypay for that permit
      if (c.cashier_id.length === 0)
      {
        let permitLink = "https://public.claycountygov.com/claypay/#permit=" + c.permit_number.toString();
        tr.appendChild(Charge.CreateCellLink("Pay Now", "has-text-centered", permitLink));
      }
      else
      {
        let receiptLink = "https://public.claycountygov.com/claypay/#cashierid=" + c.cashier_id;
        tr.appendChild(Charge.CreateCellLink("View Receipt", "has-text-centered", receiptLink));
      }
      //tr.appendChild(Charge.CreateCell("View", "has-text-centered"));
      return tr;
    }

    static CreateCell(value: string, className: string = ""): HTMLTableCellElement
    {
      let td = document.createElement("td");
      if (className.length > 0) td.classList.add(className);
      td.appendChild(document.createTextNode(value));
      return td;
    }

    static CreateCellLink(value: string, className: string = "", href: string = ""): HTMLTableCellElement
    {
      let td = document.createElement("td");
      if (className.length > 0) td.classList.add(className);
      let link = document.createElement("a");
      link.classList.add("has-text-link");
      link.target = "_blank";
      link.rel = "noopener";
      link.href = href;
      link.appendChild(document.createTextNode(value));
      link.setAttribute("aria-label", "View on Claypay");
      td.appendChild(link);
      return td;
    }

  }
}