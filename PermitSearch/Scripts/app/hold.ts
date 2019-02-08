/// <reference path="app.ts" />

namespace PermitSearch
{
  "use strict";

  interface IHold
  {
    description: string;
  }

  export class Hold implements IHold
  {
    public description: string;
    static holds_container: string = "holdContainer";
    constructor() { }

    static QueryHolds(permit_number: number): void
    {
      let path = PermitSearch.GetPath();
      Utilities.Get<Array<Hold>>(path + "API/Permit/Holds?permitnumber=" + permit_number.toString())
        .then(function (holds: Array<Hold>)
        {
          console.log("holds", holds);
          PermitSearch.permit_holds = holds;
          if (holds.length === 0)
          {
            PermitSearch.CreateMessageRow(Hold.holds_container, 1, "No Holds were found for this permit.");
          }
          else
          {
            Hold.CreateDocumentsTable(holds, Hold.holds_container);
          }

        }, function (e)
        {
          PermitSearch.CreateMessageRow(Hold.holds_container, 4, "There was an issue retrieving the holds for this permit.  Please try again.");
            console.log('error getting holds', e);
          });
    }

    static ResetHolds(): void
    {
      PermitSearch.permit_holds = [];
      PermitSearch.CreateMessageRow(Hold.holds_container, 4, "Loading Holds...")
    }

    static CreateDocumentsTable(holds: Array<Hold>, container: string): void
    {
      let df = document.createDocumentFragment();
      for (let h of holds)
      {
        df.appendChild(Hold.CreateRow(h));
      }
      let tbody = (<HTMLTableSectionElement>document.getElementById(container));
      Utilities.Clear_Element(tbody);
      tbody.appendChild(df);
    }

    static CreateRow(h: Hold): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(Hold.CreateCell(h.description));
      return tr;
    }

    static CreateCell(value: string, className: string = ""): HTMLTableCellElement
    {
      let td = document.createElement("td");
      if (className.length > 0) td.classList.add(className);
      td.appendChild(document.createTextNode(value));
      return td;
    }



  }
}